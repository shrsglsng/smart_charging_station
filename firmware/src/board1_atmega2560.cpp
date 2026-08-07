#include "Arduino.h"
#include <Adafruit_NeoPixel.h>

#define LED_PIN 33
#define NUM_LEDS 19

Adafruit_NeoPixel pixels(NUM_LEDS, LED_PIN, NEO_GRB + NEO_KHZ400);

enum LedState {
    LED_STATE_GREEN,
    LED_STATE_BLUE,
    LED_STATE_BLINKING_GREEN
};

struct Slot {
    int id;
    int dl_pin;
    int ds_pin;
    int cc_pin;
    bool lastDoorState;
    unsigned long lockPulseStartTime;
    bool lockIsPulsing;
    LedState ledState;
};

// Board 1 controls 19 slots
const int NUM_LOCAL_SLOTS = 19;
Slot slots[NUM_LOCAL_SLOTS] = {
    {1, 11, 10, 12, HIGH, 0, false, LED_STATE_GREEN},
    {2, 8, 7, 9, HIGH, 0, false, LED_STATE_GREEN},
    {3, 5, 4, 6, HIGH, 0, false, LED_STATE_GREEN},
    {4, 2, 20, 3, HIGH, 0, false, LED_STATE_GREEN},
    {9, 25, 26, 24, HIGH, 0, false, LED_STATE_GREEN},
    {10, 28, 29, 27, HIGH, 0, false, LED_STATE_GREEN},
    {11, 31, 32, 30, HIGH, 0, false, LED_STATE_GREEN},
    {12, 35, 36, 34, HIGH, 0, false, LED_STATE_GREEN},
    {13, 38, 39, 37, HIGH, 0, false, LED_STATE_GREEN},
    {19, 41, 42, 40, HIGH, 0, false, LED_STATE_GREEN},
    {20, 44, 45, 43, HIGH, 0, false, LED_STATE_GREEN},
    {21, 47, 48, 46, HIGH, 0, false, LED_STATE_GREEN},
    {22, 50, 51, 49, HIGH, 0, false, LED_STATE_GREEN},
    {23, 53, A15, 52, HIGH, 0, false, LED_STATE_GREEN},
    {29, A13, A12, A14, HIGH, 0, false, LED_STATE_GREEN},
    {30, A10, A9, A11, HIGH, 0, false, LED_STATE_GREEN},
    {31, A7, A6, A8, HIGH, 0, false, LED_STATE_GREEN},
    {32, A4, A3, A5, HIGH, 0, false, LED_STATE_GREEN},
    {33, A1, A0, A2, HIGH, 0, false, LED_STATE_GREEN}
};

const unsigned long UNLOCK_PULSE_MS = 200;

String esp32Buffer = "";
String board2Buffer = "";

void handleEsp32Cmd(String cmd);
void checkDoorSensors();
void updateLocks();
void handleBoard2Event(String event);
void updateLed(int slotIdx, LedState state);
void renderLeds(bool blinkState);
void updateLeds();

void setup() {
    Serial.begin(115200);   // Debug
    Serial1.begin(115200);  // To Board 2
    Serial2.begin(115200);  // To ESP32

    pixels.begin();
    pixels.setBrightness(100);

    for (int i = 0; i < NUM_LOCAL_SLOTS; i++) {
        pinMode(slots[i].ds_pin, INPUT_PULLUP);
        pinMode(slots[i].dl_pin, OUTPUT);
        pinMode(slots[i].cc_pin, OUTPUT);
        digitalWrite(slots[i].dl_pin, LOW);
        digitalWrite(slots[i].cc_pin, LOW);
        slots[i].lastDoorState = HIGH; // Default to HIGH (Open) so physically closed doors (LOW) trigger initial EVENT:DOOR on boot
        updateLed(i, LED_STATE_GREEN); // Green by default
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
    updateLeds();
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
                updateLed(i, LED_STATE_GREEN);
                Serial.print("Action: Unlocking Slot ");
                Serial.println(slotId);
            } else if (cmd.startsWith("CMD:CHG_ON:")) {
                digitalWrite(slots[i].cc_pin, HIGH);
                updateLed(i, LED_STATE_BLUE);
                Serial.print("Action: Charging ON Slot ");
                Serial.println(slotId);
            } else if (cmd.startsWith("CMD:CHG_OFF:")) {
                digitalWrite(slots[i].cc_pin, LOW);
                updateLed(i, LED_STATE_BLINKING_GREEN);
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
                
                if (currentState == HIGH) {
                    // Door opened (phone collected / door accessed) -> reset LED to solid green
                    updateLed(i, LED_STATE_GREEN);
                }

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

void renderLeds(bool blinkState) {
    for (int i = 0; i < NUM_LOCAL_SLOTS; i++) {
        switch (slots[i].ledState) {
            case LED_STATE_BLUE:
                pixels.setPixelColor(i, pixels.Color(0, 0, 255)); // Blue
                break;
            case LED_STATE_BLINKING_GREEN:
                if (blinkState) {
                    pixels.setPixelColor(i, pixels.Color(255, 0, 0)); // Green
                } else {
                    pixels.setPixelColor(i, pixels.Color(0, 0, 0)); // Off
                }
                break;
            case LED_STATE_GREEN:
            default:
                pixels.setPixelColor(i, pixels.Color(255, 0, 0)); // Green
                break;
        }
    }
    pixels.show();
}

void updateLed(int slotIdx, LedState state) {
    slots[slotIdx].ledState = state;
    renderLeds(true);
}

void updateLeds() {
    unsigned long now = millis();
    static unsigned long lastBlinkTime = 0;
    static bool blinkState = false;

    if (now - lastBlinkTime >= 500) {
        lastBlinkTime = now;
        blinkState = !blinkState;

        bool hasBlinkingSlot = false;
        for (int i = 0; i < NUM_LOCAL_SLOTS; i++) {
            if (slots[i].ledState == LED_STATE_BLINKING_GREEN) {
                hasBlinkingSlot = true;
                break;
            }
        }

        if (hasBlinkingSlot) {
            renderLeds(blinkState);
        }
    }
}
