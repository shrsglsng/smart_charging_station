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

// Board 1 controls 19 slots
const int NUM_LOCAL_SLOTS = 19;
Slot slots[NUM_LOCAL_SLOTS] = {
    {1, 11, 10, 12, HIGH, 0, false},
    {2, 8, 7, 9, HIGH, 0, false},
    {3, 5, 4, 6, HIGH, 0, false},
    {4, 2, 20, 3, HIGH, 0, false},
    {9, 25, 26, 24, HIGH, 0, false},
    {10, 28, 29, 27, HIGH, 0, false},
    {11, 31, 32, 30, HIGH, 0, false},
    {12, 35, 36, 34, HIGH, 0, false},
    {13, 38, 39, 37, HIGH, 0, false},
    {19, 41, 42, 40, HIGH, 0, false},
    {20, 44, 45, 43, HIGH, 0, false},
    {21, 47, 48, 46, HIGH, 0, false},
    {22, 50, 51, 49, HIGH, 0, false},
    {23, 53, A15, 52, HIGH, 0, false},
    {29, A13, A12, A14, HIGH, 0, false},
    {30, A10, A9, A11, HIGH, 0, false},
    {31, A7, A6, A8, HIGH, 0, false},
    {32, A4, A3, A5, HIGH, 0, false},
    {33, A1, A0, A2, HIGH, 0, false}
};

const unsigned long UNLOCK_PULSE_MS = 200;

String esp32Buffer = "";
String board2Buffer = "";

void handleEsp32Cmd(String cmd);
void checkDoorSensors();
void updateLocks();
void handleBoard2Event(String event);

void setup() {
    Serial.begin(115200);   // Debug
    Serial1.begin(115200);  // To Board 2
    Serial2.begin(115200);  // To ESP32

    for (int i = 0; i < NUM_LOCAL_SLOTS; i++) {
        pinMode(slots[i].ds_pin, INPUT_PULLUP);
        pinMode(slots[i].dl_pin, OUTPUT);
        pinMode(slots[i].cc_pin, OUTPUT);
        digitalWrite(slots[i].dl_pin, LOW);
        digitalWrite(slots[i].cc_pin, LOW);
        slots[i].lastDoorState = digitalRead(slots[i].ds_pin);
    }

    Serial.println("Mega Board 1 Ready (Interleaved Slots)");
}

void loop() {
    // Read from ESP32 (UART2)
    while (Serial2.available() > 0) {
        char c = Serial2.read();
        if (c == '\n') {
            esp32Buffer.trim();
            if (esp32Buffer.length() > 0) {
                handleEsp32Cmd(esp32Buffer);
            }
            esp32Buffer = "";
        } else {
            esp32Buffer += c;
        }
    }

    // Read from Board 2 (UART1)
    while (Serial1.available() > 0) {
        char c = Serial1.read();
        if (c == '\n') {
            board2Buffer.trim();
            if (board2Buffer.length() > 0) {
                handleBoard2Event(board2Buffer);
            }
            board2Buffer = "";
        } else {
            board2Buffer += c;
        }
    }

    checkDoorSensors();
    updateLocks();
}

void handleEsp32Cmd(String cmd) {
    Serial.print("ESP32 -> Board1: ");
    Serial.println(cmd);

    // Protocol: CMD:<ACTION>:<SLOT>
    int lastColon = cmd.lastIndexOf(':');
    if (lastColon == -1) return;

    int slotId = cmd.substring(lastColon + 1).toInt();
    bool isLocal = false;

    // Check if it's a local slot
    for (int i = 0; i < NUM_LOCAL_SLOTS; i++) {
        if (slots[i].id == slotId) {
            isLocal = true;
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

    if (!isLocal && slotId >= 1 && slotId <= 38) {
        // Forward to Board 2
        Serial1.println(cmd);
        Serial.print("Action: Forwarded to Board 2: ");
        Serial.println(cmd);
    }
}

void handleBoard2Event(String event) {
    Serial.print("Board2 -> Board1: ");
    Serial.println(event);
    // Forward everything from Board 2 to ESP32
    Serial2.println(event);
}

void checkDoorSensors() {
    for (int i = 0; i < NUM_LOCAL_SLOTS; i++) {
        bool currentState = digitalRead(slots[i].ds_pin);
        if (currentState != slots[i].lastDoorState) {
            delay(10); // Minimal debounce for multiple slots
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
