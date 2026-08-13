#include "Arduino.h"
#include <Adafruit_NeoPixel.h>
#include <EEPROM.h>

#define LED_PIN 33

const int HMI_CHARGING_PIN = 21;
const unsigned long HMI_MINUTE_MS = 60000UL; // 1 minute in ms
const uint8_t HMI_STATE_ON = 1;
const uint8_t HMI_STATE_OFF = 0;

// EEPROM addresses for HMI state persistence across resets
const int EEPROM_ADDR_MAGIC = 0;   // Magic byte (0xA5)
const int EEPROM_ADDR_STATE = 1;   // 1 = ON, 0 = OFF
const int EEPROM_ADDR_MINUTES = 2; // 0 to 29 minutes elapsed in current state

uint8_t hmiState = HMI_STATE_ON;
uint8_t hmiElapsedMinutes = 0;
unsigned long lastHmiMinuteTick = 0;

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

// Board 1 controls 19 slots
const int NUM_LOCAL_SLOTS = 19;
Slot slots[NUM_LOCAL_SLOTS] = {
    {1, 11, 10, 12, HIGH, 0, false, false},
    {2, 8, 7, 9, HIGH, 0, false, false},
    {3, 5, 4, 6, HIGH, 0, false, false},
    {4, 2, 20, 3, HIGH, 0, false, false},
    {9, 25, 26, 24, HIGH, 0, false, false},
    {10, 28, 29, 27, HIGH, 0, false, false},
    {11, 31, 32, 30, HIGH, 0, false, false},
    {12, 35, 36, 34, HIGH, 0, false, false},
    {13, 38, 39, 37, HIGH, 0, false, false},
    {19, 41, 42, 40, HIGH, 0, false, false},
    {20, 44, 45, 43, HIGH, 0, false, false},
    {21, 47, 48, 46, HIGH, 0, false, false},
    {22, 50, 51, 49, HIGH, 0, false, false},
    {23, 53, A15, 52, HIGH, 0, false, false},
    {29, A13, A12, A14, HIGH, 0, false, false},
    {30, A10, A9, A11, HIGH, 0, false, false},
    {31, A7, A6, A8, HIGH, 0, false, false},
    {32, A4, A3, A5, HIGH, 0, false, false},
    {33, A1, A0, A2, HIGH, 0, false, false}
};

const unsigned long UNLOCK_PULSE_MS = 200;

Adafruit_NeoPixel pixels(NUM_LOCAL_SLOTS, LED_PIN, NEO_RGB + NEO_KHZ800);
bool pixelsDirty = false;
unsigned long lastUartTime = 0;

String esp32Buffer = "";
String board2Buffer = "";

void handleEsp32Cmd(String cmd);
void checkDoorSensors();
void updateLocks();
void handleBoard2Event(String event);
void updateSlotLed(int index);
void initHmiCharging();
void updateHmiCharging();

void setup() {
    Serial.begin(115200);   // Debug
    delay(500);
    Serial1.begin(115200);  // To Board 2
    delay(500);
    Serial2.begin(115200);  // To ESP32
    delay(500);

    // Flush any residual boot/reset glitch bytes from hardware UART RX buffers
    while (Serial1.available() > 0) Serial1.read();
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

    // Initialize HMI Tablet Charging (Pin D21) with EEPROM state recovery
    initHmiCharging();

    Serial.println("Mega Board 1 Ready (Interleaved Slots)");
}

void loop() {
    // Read from ESP32 (UART2)
    while (Serial2.available() > 0) {
        lastUartTime = millis();
        char c = Serial2.read();
        if (c == '\0' || (uint8_t)c > 127) continue; // Ignore NULL bytes and non-ASCII framing errors

        if (c == '\n') {
            esp32Buffer.trim();
            if (esp32Buffer.length() > 0) {
                handleEsp32Cmd(esp32Buffer);
            }
            esp32Buffer = "";
        } else if (c != '\r') {
            esp32Buffer += c;
        }
    }

    // Read from Board 2 (UART1)
    while (Serial1.available() > 0) {
        lastUartTime = millis();
        char c = Serial1.read();
        if (c == '\0' || (uint8_t)c > 127) continue; // Ignore NULL bytes and non-ASCII framing errors

        if (c == '\n') {
            board2Buffer.trim();
            if (board2Buffer.length() > 0) {
                handleBoard2Event(board2Buffer);
            }
            board2Buffer = "";
        } else if (c != '\r') {
            board2Buffer += c;
        }
    }

    checkDoorSensors();
    updateLocks();
    updateHmiCharging();

    // Deferred LED rendering when UART line has been idle for at least 15ms
    if (pixelsDirty && (millis() - lastUartTime >= 15)) {
        pixels.show();
        pixelsDirty = false;
    }
}

void initHmiCharging() {
    pinMode(HMI_CHARGING_PIN, OUTPUT);

    uint8_t magic = EEPROM.read(EEPROM_ADDR_MAGIC);
    if (magic != 0xA5) {
        // First boot / uninitialized EEPROM: default to ON state, minute 0
        hmiState = HMI_STATE_ON;
        hmiElapsedMinutes = 0;
        EEPROM.update(EEPROM_ADDR_MAGIC, 0xA5);
        EEPROM.update(EEPROM_ADDR_STATE, hmiState);
        EEPROM.update(EEPROM_ADDR_MINUTES, hmiElapsedMinutes);
    } else {
        // Restore persisted state across Power-On Reset (POR)
        hmiState = EEPROM.read(EEPROM_ADDR_STATE);
        if (hmiState != HMI_STATE_ON && hmiState != HMI_STATE_OFF) {
            hmiState = HMI_STATE_ON;
        }
        hmiElapsedMinutes = EEPROM.read(EEPROM_ADDR_MINUTES);
        if (hmiElapsedMinutes >= 30) {
            hmiElapsedMinutes = 0;
        }
    }

    digitalWrite(HMI_CHARGING_PIN, hmiState == HMI_STATE_ON ? HIGH : LOW);
    lastHmiMinuteTick = millis();

    Serial.print("HMI Charging Initialized on Pin 21: ");
    Serial.print(hmiState == HMI_STATE_ON ? "ON" : "OFF");
    Serial.print(" (Elapsed: ");
    Serial.print(hmiElapsedMinutes);
    Serial.println(" mins)");
}

void updateHmiCharging() {
    unsigned long now = millis();
    if (now - lastHmiMinuteTick >= HMI_MINUTE_MS) {
        lastHmiMinuteTick = now;
        hmiElapsedMinutes++;

        if (hmiElapsedMinutes >= 30) {
            hmiElapsedMinutes = 0;
            hmiState = (hmiState == HMI_STATE_ON) ? HMI_STATE_OFF : HMI_STATE_ON;
            digitalWrite(HMI_CHARGING_PIN, hmiState == HMI_STATE_ON ? HIGH : LOW);
            EEPROM.update(EEPROM_ADDR_STATE, hmiState);

            Serial.print("HMI Charging Switched: ");
            Serial.println(hmiState == HMI_STATE_ON ? "ON (Charging 30m)" : "OFF (Pausing 30m)");
        }

        // Persist minute progress to EEPROM (EEPROM.update only writes if changed)
        EEPROM.update(EEPROM_ADDR_MINUTES, hmiElapsedMinutes);
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