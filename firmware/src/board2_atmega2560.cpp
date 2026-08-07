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

// Board 2 controls 19 slots
const int NUM_LOCAL_SLOTS = 19;
Slot slots[NUM_LOCAL_SLOTS] = {
    {5, 8, 7, 9, HIGH, 0, false, LED_STATE_GREEN},
    {6, 5, 4, 6, HIGH, 0, false, LED_STATE_GREEN},
    {7, 2, 20, 3, HIGH, 0, false, LED_STATE_GREEN},
    {8, 22, 23, 21, HIGH, 0, false, LED_STATE_GREEN},
    {14, 25, 26, 24, HIGH, 0, false, LED_STATE_GREEN},
    {15, 28, 29, 27, HIGH, 0, false, LED_STATE_GREEN},
    {16, 31, 32, 30, HIGH, 0, false, LED_STATE_GREEN},
    {17, 35, 36, 34, HIGH, 0, false, LED_STATE_GREEN},
    {18, 38, 39, 37, HIGH, 0, false, LED_STATE_GREEN},
    {24, 41, 42, 40, HIGH, 0, false, LED_STATE_GREEN},
    {25, 44, 45, 43, HIGH, 0, false, LED_STATE_GREEN},
    {26, 47, 48, 46, HIGH, 0, false, LED_STATE_GREEN},
    {27, 50, 51, 49, HIGH, 0, false, LED_STATE_GREEN},
    {28, 53, A15, 52, HIGH, 0, false, LED_STATE_GREEN},
    {34, A13, A12, A14, HIGH, 0, false, LED_STATE_GREEN},
    {35, A10, A9, A11, HIGH, 0, false, LED_STATE_GREEN},
    {36, A7, A6, A8, HIGH, 0, false, LED_STATE_GREEN},
    {37, A4, A3, A5, HIGH, 0, false, LED_STATE_GREEN},
    {38, A1, A0, A2, HIGH, 0, false, LED_STATE_GREEN}
};

const unsigned long UNLOCK_PULSE_MS = 200;

String board1Buffer = "";

void handleBoard1Cmd(String cmd);
void checkDoorSensors();
void updateLocks();
void updateLed(int slotIdx, LedState state);
void renderLeds(bool blinkState);
void updateLeds();

void setup() {
    Serial.begin(115200);   // Debug
    Serial2.begin(115200);  // To Board 1

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
    updateLeds();
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
}

void checkDoorSensors() {
    for (int i = 0; i < NUM_LOCAL_SLOTS; i++) {
        bool currentState = digitalRead(slots[i].ds_pin);
        if (currentState != slots[i].lastDoorState) {
            delay(10); // Minimal debounce
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
