#include "Arduino.h"

/*
- user enters door no. --> lock opens --> charger off
- user closes the door --> lock closes --> charger on
- if during charging, user enters door no. ---> lock opens --> charger off
*/

#define CHARGING_INTERVAL 10000

const int ds_pin = 66;
const int dl_pin = A13;
const int cc_pin = 68;

unsigned long turn_on_timestamp;

String cmd;

void open_dl_off_cc();
void check_dl_close_on_cc();

bool last_ds_state = HIGH;
bool charging_active = false;

void setup()
{
    Serial.begin(9600);
    pinMode(cc_pin, OUTPUT);
    pinMode(dl_pin, OUTPUT);
    pinMode(ds_pin, INPUT_PULLUP); // open == 1 close == 0

    digitalWrite(cc_pin, LOW);

    Serial.println("setup complete");
}

void loop()
{
    if (Serial.available())
    {
        cmd = Serial.readStringUntil('\n');
        cmd.trim();
        Serial.print("Recieved cmd: ");
        Serial.println(cmd);
        if (cmd == "D16")
        {
            open_dl_off_cc();
        }
    }
    delay(100);
    check_dl_close_on_cc();
    delay(100);

    if (charging_active && millis() - turn_on_timestamp >= CHARGING_INTERVAL)
    {
        digitalWrite(cc_pin,LOW);
        charging_active = false;
        Serial.println("Charging stopped after 10 seconds");
    }
}

void open_dl_off_cc()
{
    digitalWrite(dl_pin, HIGH);
    delay(200); // alway set the delay to 200 only
    digitalWrite(dl_pin, LOW);
    delay(500);
    digitalWrite(cc_pin, LOW);
}

void check_dl_close_on_cc()
{
    bool current_ds_state = digitalRead(ds_pin);

    // Detect HIGH -> LOW transition
    if (last_ds_state == HIGH && current_ds_state == LOW)
    {
        digitalWrite(cc_pin, HIGH);
        turn_on_timestamp = millis();
        charging_active = true;
        Serial.println("Charging started");
    }

    last_ds_state = current_ds_state;
}
