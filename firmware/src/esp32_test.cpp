/* This file is to test the uart communication flow between backend <---> esp32 <---> board1 */

#include "WiFi.h"
#include "WiFiClientSecure.h"
#include "HTTPClient.h"
#include "ArduinoJson.h"

const char *WIFI_SSID = "AibotInk workshop";
const char *WIFI_PASS = "Aibotink@123";

const char *SERVER_BASE_URL = "http://72.61.141.178:3000/api/v1";
const char *MACHINE_ID = "M01";

// State tracking
bool lastRelayState[41] = {false};
bool lastLockState[41] = {false};
bool firstSync = true;

void syncState();
void setHeaders(HTTPClient &http_client);

void setup()
{
    Serial.begin(115200);                      // for debugging
    delay(500);                                // Allow USB-UART chip and host driver baud rate to stabilize after USB plug-in
    Serial.flush();

    Serial1.begin(115200, SERIAL_8N1, 16, 17); // communication to board1
    delay(100);
    Serial1.println();                        // Send newline to clear any startup pin glitch state on receiver
    Serial1.flush();

    delay(1000);

    Serial.printf("\n\n************************************************\n");
    Serial.printf("SMART CHARGING STATION TEST SCRIPT\n");
    Serial.printf("Machine ID: %s\n", MACHINE_ID);
    Serial.printf("\n\n************************************************\n");

    Serial.printf("Connecting to WiFi: %s", WIFI_SSID);
    WiFi.begin(WIFI_SSID, WIFI_PASS);
    while (WiFi.status() != WL_CONNECTED)
    {
        Serial.print(".");
        delay(300);
    }
    Serial.printf("\n Wifi connected! IP: %s\n", WiFi.localIP().toString().c_str());

    syncState();

    delay(500);

    Serial1.print("Test msg from esp32\n");
}

void loop()
{
    delay(10);
}

void setHeaders(HTTPClient &http_client)
{
    http_client.addHeader("Content-Type", "application/json"); // tells the backend to encode the POST request in JSON format
    http_client.addHeader("x-machine-id", MACHINE_ID);
    http_client.addHeader("Connection", "keep-alive"); // keep-alive tells the http server to not close the tcp socket connection after the request. Reduces subsequent tcp handshake latency
    http_client.setTimeout(1000);                             // ensures that slow network responses dont immediately throw HTTP_ERROR_READ_TIMEOUT
}

void syncState()
{
    WiFiClient wifi_client;
    HTTPClient http_client;
    String url = String(SERVER_BASE_URL) + "/hardware/sync";

    if (http_client.begin(wifi_client, url))
    {
        setHeaders(http_client);

        int httpCode = http_client.GET();

        if (httpCode == HTTP_CODE_OK)
        {
            String responseStr = http_client.getString();

            if (firstSync == true)
            {
                Serial.println("[SYNC] First sync payload received from GET request:");
                Serial.println(responseStr);
            }

            JsonDocument doc;
            DeserializationError err = deserializeJson(doc, responseStr);

            if (!err && doc.is<JsonArray>())
            {
                JsonArray arr = doc.as<JsonArray>();

                if (firstSync == true)
                {
                    Serial.println("[SYNC] Door Statuses:");
                }

                for (JsonObject obj : arr)
                {
                    int slot = obj["slot_number"];
                    if (slot < 1 || slot > 40)
                        continue;

                    bool relay_on = obj["relay_on"];
                    bool lock_engaged = obj["lock_engaged"];

                    if (firstSync == true)
                    {
                        Serial.printf("  Slot %d -> Lock Engaged: %s, Relay On: %s\n",
                                      slot,
                                      lock_engaged ? "true" : "false",
                                      relay_on ? "true" : "false");
                    }

                    /* Detection of unlock (transition from engaged to release) */
                    if (!firstSync && lastLockState[slot] == true && lock_engaged == false)
                    {                                            // when last lock state is 'locked' but the payload from backend says lock state is 'unlock'
                        Serial1.printf("CMD:UNLOCK:%d\n", slot); // command string to respective board
                        Serial.printf("[SYNC] Unlock triggered for Slot %d\n", slot);
                        delay(75);
                    }

                    if (firstSync || lastRelayState[slot] != relay_on)
                    {
                        Serial1.printf("CMD:%s:%d\n", relay_on ? "CHG_ON" : "CHG_OFF", slot);
                        lastRelayState[slot] = relay_on;
                        delay(75);
                    }

                    lastLockState[slot] = lock_engaged;
                }
                firstSync = false;
            }
            else
            {
                Serial.printf("[SYNC] JSON Error: %s\n", err.c_str());
            }
        }
        else
        {
            Serial.printf("[SYNC] GET failed, code: %d\n", httpCode);
        }
        http_client.end();
    }
    else
    {
        Serial.println("[SYNC] Failed to begin HTTP connection");
    }
}

