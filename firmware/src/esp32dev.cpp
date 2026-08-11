#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

// --- Configuration ---
const char* WIFI_SSID = "AibotInk workshop";
const char* WIFI_PASS = "Aibotink@123";
const char* SERVER_BASE_URL = "http://72.61.141.178:3000/api/v1";
const char* MACHINE_ID = "M01";
const char* FIRMWARE_VER = "1.0.0-ESP32";

// --- Timing ---
unsigned long lastSyncTime = 0;
const unsigned long SYNC_INTERVAL = 2000; // Reduced to 2 seconds for better responsiveness

// --- State Tracking ---
bool lastRelayState[41] = {false};
bool lastLockState[41] = {false};
bool firstSync = true;
String inputBuffer = "";

// --- Forward Declarations ---
void handleMegaEvent(String event);
void sendDoorState(int slot, bool isClosed);
void syncState();
void setHeaders(HTTPClient &http);
void setup() {
    Serial.begin(115200);   // Debug
    delay(500);             // Allow USB-UART chip and host driver baud rate to stabilize after USB plug-in
    Serial.flush();

    Serial1.begin(115200, SERIAL_8N1, 16, 17); // Communication with Mega (RX=16, TX=17)
    delay(100);
    Serial1.println();      // Clear startup pin glitch state on receiver
    Serial1.flush();

    delay(1000);
    Serial.println("\n\n========================================");
    Serial.printf("  SMART CHARGING STATION - ESP32\n");
    Serial.printf("  Version: %s\n", FIRMWARE_VER);
    Serial.printf("  Machine ID: %s\n", MACHINE_ID);
    Serial.println("========================================\n");

    // Initialize state arrays
    for(int i=0; i<=40; i++) {
        lastRelayState[i] = false;
        lastLockState[i] = false;
    }

    // Connect WiFi
    Serial.printf("Connecting to WiFi: %s ", WIFI_SSID);
    WiFi.begin(WIFI_SSID, WIFI_PASS);
    while (WiFi.status() != WL_CONNECTED) {
        delay(500);
        Serial.print(".");
    }
    Serial.printf("\nWiFi Connected! IP: %s\n", WiFi.localIP().toString().c_str());

    syncState(); // Initial sync
    
}

void loop() {
    // Read events from Mega
    while (Serial1.available() > 0) {
        char c = Serial1.read();
        if (c == '\0' || (uint8_t)c > 127) continue; // Ignore NULL bytes and non-ASCII framing errors

        if (c == '\n') {
            inputBuffer.trim();
            if (inputBuffer.length() > 0) {
                handleMegaEvent(inputBuffer);
            }
            inputBuffer = "";
        } else if (c != '\r') {
            inputBuffer += c;
        }
    }

    // Periodic Sync
    if (millis() - lastSyncTime >= SYNC_INTERVAL) {
        syncState();
        lastSyncTime = millis();
    }
}

void setHeaders(HTTPClient &http) {
    http.addHeader("Content-Type", "application/json");
    http.addHeader("x-machine-id", MACHINE_ID);
    http.addHeader("Connection", "keep-alive"); // Changed to keep-alive for better performance
    http.setTimeout(10000); // Increased timeout to 10s to avoid code -11
}

void handleMegaEvent(String event) {
    Serial.print("MEGA -> ESP32: ");
    Serial.println(event);

    // Protocol: EVENT:DOOR:<SLOT>:<STATE>
    // State: 0 = Closed, 1 = Open
    if (event.startsWith("EVENT:DOOR:")) {
        int firstColon = 11;
        int secondColon = event.indexOf(':', firstColon);
        if (secondColon != -1) {
            int slot = event.substring(firstColon, secondColon).toInt();
            bool isClosed = (event.substring(secondColon + 1) == "0");
            sendDoorState(slot, isClosed);
        }
    }
}

void sendDoorState(int slot, bool isClosed) {
    Serial.printf("[API] Reporting door state: Slot %d, Closed: %s\n", slot, isClosed ? "YES" : "NO");
    
    WiFiClient client;
    HTTPClient http;
    String url = String(SERVER_BASE_URL) + "/hardware/door-state";
    
    if (http.begin(client, url)) {
        setHeaders(http);
        
        JsonDocument doc;
        doc["slot_number"] = slot;
        doc["is_closed"] = isClosed;
        
        String payload;
        serializeJson(doc, payload);
        
        int httpCode = http.POST(payload);
        if (httpCode == HTTP_CODE_OK) {
            String responseStr = http.getString();
            JsonDocument response;
            DeserializationError err = deserializeJson(response, responseStr);
            if (!err) {
                const char* action = response["action"];
                Serial.printf("[API] Response Action: %s\n", action ? action : "NONE");
                
                if (action && strcmp(action, "ENABLE_CHARGING") == 0) {
                    Serial1.printf("CMD:CHG_ON:%d\n", slot);
                    lastRelayState[slot] = true;
                    lastLockState[slot] = true; // Mark as locked
                } 
                else if (action && strcmp(action, "UNLOCK_DOOR") == 0) {
                    Serial1.printf("CMD:UNLOCK:%d\n", slot);
                    lastLockState[slot] = false; // Mark as released
                }
            }
        } else {
            Serial.printf("[API] POST failed, code: %d\n", httpCode);
        }
        http.end();
    }
}

void syncState() {
    
    WiFiClient client;
    HTTPClient http;
    String url = String(SERVER_BASE_URL) + "/hardware/sync";
    
    
    if (http.begin(client, url)) {
        setHeaders(http);
        
        
        int httpCode = http.GET();
        

        if (httpCode == HTTP_CODE_OK) {
            
            String responseStr = http.getString();
            
            
            JsonDocument doc;
            
            DeserializationError err = deserializeJson(doc, responseStr);
            
            if (!err && doc.is<JsonArray>()) {
                JsonArray arr = doc.as<JsonArray>();
                
                for (JsonObject obj : arr) {
                    int slot = obj["slot_number"];
                    if (slot < 1 || slot > 40) continue;

                    bool relay_on = obj["relay_on"];
                    bool lock_engaged = obj["lock_engaged"];
                    
                    // 1. Detection of Unlock (Transition from Engaged to Released)
                    if (!firstSync && lastLockState[slot] == true && lock_engaged == false) {
                        Serial1.printf("CMD:UNLOCK:%d\n", slot);
                        Serial.printf("[SYNC] Unlock triggered for Slot %d\n", slot);
                        delay(75); // 75ms delay to prevent buffer overflow on Mega
                    }

                    // 2. Update Relay State (Only if changed)
                    if (firstSync || lastRelayState[slot] != relay_on) {
                        Serial1.printf("CMD:%s:%d\n", relay_on ? "CHG_ON" : "CHG_OFF", slot);
                        lastRelayState[slot] = relay_on;
                        delay(75); // 75ms delay to prevent buffer overflow on Mega
                    }

                    lastLockState[slot] = lock_engaged;
                }
                firstSync = false;
                
            } else {
                Serial.printf("[SYNC] JSON Error: %s\n", err.c_str());
            }
        } else {
            Serial.printf("[SYNC] GET failed, code: %d\n", httpCode);
        }
        http.end();
    } else {
        Serial.println("[SYNC] Failed to begin HTTP connection.");
    }
}