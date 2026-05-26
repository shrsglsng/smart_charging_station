#include "Arduino.h"

struct Slot {
    int id;
    int dl_pin;
    int ds_pin;
    int cc_pin;
    bool lastDoorState;
    unsigned long lockPulseStartTime;
    bool lockIsPulsing;
};

// Board 2 controls 19 slots
const int NUM_LOCAL_SLOTS = 19;
Slot slots[NUM_LOCAL_SLOTS] = {
    {5, 8, 7, 9, HIGH, 0, false},
    {6, 5, 4, 6, HIGH, 0, false},
    {7, 2, 20, 3, HIGH, 0, false},
    {8, 22, 23, 21, HIGH, 0, false},
    {14, 25, 26, 24, HIGH, 0, false},
    {15, 28, 29, 27, HIGH, 0, false},
    {16, 31, 32, 30, HIGH, 0, false},
    {17, 35, 36, 34, HIGH, 0, false},
    {18, 38, 39, 37, HIGH, 0, false},
    {24, 41, 42, 40, HIGH, 0, false},
    {25, 44, 45, 43, HIGH, 0, false},
    {26, 47, 48, 46, HIGH, 0, false},
    {27, 50, 51, 49, HIGH, 0, false},
    {28, 53, A15, 52, HIGH, 0, false},
    {34, A13, A12, A14, HIGH, 0, false},
    {35, A10, A9, A11, HIGH, 0, false},
    {36, A7, A6, A8, HIGH, 0, false},
    {37, A4, A3, A5, HIGH, 0, false},
    {38, A1, A0, A2, HIGH, 0, false}
};

const unsigned long UNLOCK_PULSE_MS = 200;

String board1Buffer = "";

void handleBoard1Cmd(String cmd);
void checkDoorSensors();
void updateLocks();

void setup() {
    Serial.begin(115200);   // Debug
    Serial2.begin(115200);  // To Board 1

    for (int i = 0; i < NUM_LOCAL_SLOTS; i++) {
        pinMode(slots[i].ds_pin, INPUT_PULLUP);
        pinMode(slots[i].dl_pin, OUTPUT);
        pinMode(slots[i].cc_pin, OUTPUT);
        digitalWrite(slots[i].dl_pin, LOW);
        digitalWrite(slots[i].cc_pin, LOW);
        slots[i].lastDoorState = digitalRead(slots[i].ds_pin);
    }

    Serial.println("Mega Board 2 Ready (Interleaved Slots)");
}

void loop() {
    // Read from Board 1 (UART1)
    while (Serial2.available() > 0) {
        char c = Serial2.read();
        if (c == '\n') {
            board1Buffer.trim();
            if (board1Buffer.length() > 0) {
                handleBoard1Cmd(board1Buffer);
            }
            board1Buffer = "";
        } else {
            board1Buffer += c;
        }
    }

    checkDoorSensors();
    updateLocks();
}

void handleBoard1Cmd(String cmd) {
    Serial.print("Board1 -> Board2: ");
    Serial.println(cmd);

    // Protocol: CMD:<ACTION>:<SLOT>
    int lastColon = cmd.lastIndexOf(':');
    if (lastColon == -1) return;

    int slotId = cmd.substring(lastColon + 1).toInt();

    // Check if it's a local slot
    for (int i = 0; i < NUM_LOCAL_SLOTS; i++) {
        if (slots[i].id == slotId) {
            if (cmd.startsWith("CMD:UNLOCK:")) {
                digitalWrite(slots[i].dl_pin, HIGH);
                slots[i].lockPulseStartTime = millis();
                slots[i].lockIsPulsing = true;
                Serial.print("Action: Unlocking Slot ");
                Serial.println(slotId);
            } else if (cmd.startsWith("CMD:CHG_ON:")) {
                digitalWrite(slots[i].cc_pin, HIGH);
                Serial.print("Action: Charging ON Slot ");
                Serial.println(slotId);
            } else if (cmd.startsWith("CMD:CHG_OFF:")) {
                digitalWrite(slots[i].cc_pin, LOW);
                Serial.print("Action: Charging OFF Slot ");
                Serial.println(slotId);
            }
            break;
        }
    }
}

void checkDoorSensors() {
    for (int i = 0; i < NUM_LOCAL_SLOTS; i++) {
        bool currentState = digitalRead(slots[i].ds_pin);
        if (currentState != slots[i].lastDoorState) {
            delay(10); // Minimal debounce
            if (digitalRead(slots[i].ds_pin) == currentState) {
                slots[i].lastDoorState = currentState;
                
                // EVENT:DOOR:<SLOT>:<STATE>
                String event = "EVENT:DOOR:" + String(slots[i].id) + ":" + (currentState == LOW ? "0" : "1");
                Serial2.println(event);
                Serial.print("Local Door Change: ");
                Serial.println(event);
            }
        }
    }
}

void updateLocks() {
    unsigned long now = millis();
    for (int i = 0; i < NUM_LOCAL_SLOTS; i++) {
        if (slots[i].lockIsPulsing) {
            if (now - slots[i].lockPulseStartTime >= UNLOCK_PULSE_MS) {
                digitalWrite(slots[i].dl_pin, LOW);
                slots[i].lockIsPulsing = false;
            }
        }
    }
}
