#include "Arduino.h"
#include <Adafruit_NeoPixel.h>

#define LED_PIN 33

struct Slot {
    int id;
    int dl_pin;
    int ds_pin;
    int cc_pin;
    bool lastDoorState;
    unsigned long lockPulseStartTime;
    bool lockIsPulsing;
    bool isLocked;
};

// Board 2 controls 19 slots
const int NUM_LOCAL_SLOTS = 19;
Slot slots[NUM_LOCAL_SLOTS] = {
    {5, 8, 7, 9, HIGH, 0, false, false},
    {6, 5, 4, 6, HIGH, 0, false, false},
    {7, 2, 20, 3, HIGH, 0, false, false},
    {8, 22, 23, 21, HIGH, 0, false, false},
    {14, 25, 26, 24, HIGH, 0, false, false},
    {15, 28, 29, 27, HIGH, 0, false, false},
    {16, 31, 32, 30, HIGH, 0, false, false},
    {17, 35, 36, 34, HIGH, 0, false, false},
    {18, 38, 39, 37, HIGH, 0, false, false},
    {24, 41, 42, 40, HIGH, 0, false, false},
    {25, 44, 45, 43, HIGH, 0, false, false},
    {26, 47, 48, 46, HIGH, 0, false, false},
    {27, 50, 51, 49, HIGH, 0, false, false},
    {28, 53, A15, 52, HIGH, 0, false, false},
    {34, A13, A12, A14, HIGH, 0, false, false},
    {35, A10, A9, A11, HIGH, 0, false, false},
    {36, A7, A6, A8, HIGH, 0, false, false},
    {37, A4, A3, A5, HIGH, 0, false, false},
    {38, A1, A0, A2, HIGH, 0, false, false}
};

const unsigned long UNLOCK_PULSE_MS = 200;

Adafruit_NeoPixel pixels(NUM_LOCAL_SLOTS, LED_PIN, NEO_RGB + NEO_KHZ800);
bool pixelsDirty = false;
unsigned long lastUartTime = 0;

String board1Buffer = "";

void handleBoard1Cmd(String cmd);
void checkDoorSensors();
void updateLocks();
void updateSlotLed(int index);

void setup() {
    Serial.begin(115200);   // Debug
    delay(500);
    Serial2.begin(115200);  // To Board 1
    delay(500);

    // Flush any residual boot/reset glitch bytes from hardware UART RX buffer
    while (Serial2.available() > 0) Serial2.read();

    for (int i = 0; i < NUM_LOCAL_SLOTS; i++) {
        pinMode(slots[i].ds_pin, INPUT_PULLUP);
        pinMode(slots[i].dl_pin, OUTPUT);
        pinMode(slots[i].cc_pin, OUTPUT);
        digitalWrite(slots[i].dl_pin, LOW);
        digitalWrite(slots[i].cc_pin, LOW);
        slots[i].lastDoorState = digitalRead(slots[i].ds_pin);
    }

    // Initialize WS2811 Status LEDs
    pixels.begin();
    pixels.setBrightness(150);
    for (int i = 0; i < NUM_LOCAL_SLOTS; i++) {
        updateSlotLed(i);
    }
    pixels.show();
    pixelsDirty = false;

    Serial.println("Mega Board 2 Ready (Interleaved Slots)");
}

void loop() {
    // Read from Board 1 (UART2)
    while (Serial2.available() > 0) {
        lastUartTime = millis();
        char c = Serial2.read();
        if (c == '\0' || (uint8_t)c > 127) continue; // Ignore NULL bytes and non-ASCII framing errors

        if (c == '\n') {
            board1Buffer.trim();
            if (board1Buffer.length() > 0) {
                handleBoard1Cmd(board1Buffer);
            }
            board1Buffer = "";
        } else if (c != '\r') {
            board1Buffer += c;
        }
    }

    checkDoorSensors();
    updateLocks();

    // Deferred LED rendering when UART line has been idle for at least 15ms
    if (pixelsDirty && (millis() - lastUartTime >= 15)) {
        pixels.show();
        pixelsDirty = false;
    }
}

void updateSlotLed(int index) {
    bool chargingOn = (digitalRead(slots[index].cc_pin) == HIGH);
    bool isLocked = slots[index].isLocked;

    if (!isLocked) {
        // GREEN: Door Unlocked (Available / Returned)
        pixels.setPixelColor(index, pixels.Color(0, 255, 0));
    } else if (chargingOn) {
        // BLUE: Door Locked & Charging ON
        pixels.setPixelColor(index, pixels.Color(0, 0, 255));
    } else {
        // AMBER / YELLOW: Door Locked & Charging OFF (30-min timer expired)
        pixels.setPixelColor(index, pixels.Color(255, 180, 0));
    }
    pixelsDirty = true;
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
                slots[i].isLocked = false;
                digitalWrite(slots[i].cc_pin, LOW);
                digitalWrite(slots[i].dl_pin, HIGH);
                slots[i].lockPulseStartTime = millis();
                slots[i].lockIsPulsing = true;
                updateSlotLed(i);
                Serial.print("Action: Unlocking Slot ");
                Serial.println(slotId);
            } else if (cmd.startsWith("CMD:CHG_ON:")) {
                digitalWrite(slots[i].cc_pin, HIGH);
                slots[i].isLocked = true;
                updateSlotLed(i);
                Serial.print("Action: Charging ON Slot ");
                Serial.println(slotId);
            } else if (cmd.startsWith("CMD:CHG_OFF:")) {
                digitalWrite(slots[i].cc_pin, LOW);
                updateSlotLed(i);
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