/* This file is to test the communication link between esp32 <--> board1 and board1 <---> board2 */
#include "Arduino.h"

String esp32_buffer = "";
String board2_buffer = "";

void setup()
{
    Serial.begin(115200);
    delay(500);
    Serial1.begin(115200); // board2
    delay(500);
    Serial2.begin(115200); // esp32
    delay(500);

    // Flush any residual boot/reset glitch bytes from hardware UART buffers
    while (Serial1.available() > 0) Serial1.read();
    while (Serial2.available() > 0) Serial2.read();

    Serial.println("Mega Board 1 communication test scripts");

    Serial1.print("Test msg from esp32\n");
}

void loop()
{
    while (Serial2.available())
    {
        char c = Serial2.read();
        if (c == '\0' || (uint8_t)c > 127) continue; // Ignore NULL bytes and invalid non-ASCII framing error bytes

        if (c == '\n')
        {
            esp32_buffer.trim();
            if (esp32_buffer.length() > 0)
            {
                Serial.print("Received ESP-> Board1: ");
                Serial.println(esp32_buffer);
            }
            esp32_buffer = "";
        }
        else if (c != '\r')
        {
            esp32_buffer += c;
        }
    }

    while (Serial1.available())
    {
        char c = Serial1.read();
        if (c == '\0' || (uint8_t)c > 127) continue; // Ignore NULL bytes and invalid non-ASCII framing error bytes

        if (c == '\n')
        {
            board2_buffer.trim();
            if (board2_buffer.length() > 0)
            {
                Serial.print("Received Board2->Boad1: ");
                Serial.println(board2_buffer);
            }
            board2_buffer = "";
        }
        else if (c != '\r')
        {
            board2_buffer += c;
        }
    }
}