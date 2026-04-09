#include <Arduino.h>

const int row_1 = 23;
const int row_2 = 24;
const int row_3 = 22;

const int column_1 = 53;
const int column_2 = 52;
const int column_3 = 51;
const int column_4 = 50;
const int column_5 = 48;
const int column_6 = 49;
const int column_7 = 46;

void row_out_column_in();
void row_in();

void setup()
{
  Serial.begin(9600);
  row_out_column_in();
}

void loop()
{

  if (!digitalRead(column_1) || !digitalRead(column_2) || !digitalRead(column_3) || !digitalRead(column_4) || !digitalRead(column_5) || !digitalRead(column_6) || !digitalRead(column_7))
  {
    delay(100);
    if (!digitalRead(column_1) || !digitalRead(column_2) || !digitalRead(column_3) || !digitalRead(column_4) || !digitalRead(column_5) || !digitalRead(column_6) || !digitalRead(column_7))
    {

      if (!digitalRead(column_1))
      {
        pinMode(column_1, OUTPUT);
        digitalWrite(column_1, LOW);
        row_in();

        if (!digitalRead(row_1) || !digitalRead(row_2) || !digitalRead(row_3))
        {
          delay(100);
          if (!digitalRead(row_1) || !digitalRead(row_2) || !digitalRead(row_3))
          {
            if (!digitalRead(row_1))
            {
              Serial.println("row 1 column 1 button pressed!");
            }
            if (!digitalRead(row_2))
            {
              Serial.println("row 2 column 1 button pressed!");
            }
            if (!digitalRead(row_3))
            {
              Serial.println("row 3 column 1 button pressed!");
            }
          }
        }
        row_out_column_in();
      }

      if (!digitalRead(column_2))
      {
        pinMode(column_2, OUTPUT);
        digitalWrite(column_2, LOW);
        row_in();

        if (!digitalRead(row_1) || !digitalRead(row_2) || !digitalRead(row_3))
        {
          delay(100);
          if (!digitalRead(row_1) || !digitalRead(row_2) || !digitalRead(row_3))
          {
            if (!digitalRead(row_1))
            {
              Serial.println("row 1 column 2 button pressed!");
            }
            if (!digitalRead(row_2))
            {
              Serial.println("row 2 column 2 button pressed!");
            }
            if (!digitalRead(row_3))
            {
              Serial.println("row 3 column 2 button pressed!");
            }
          }
        }

        row_out_column_in();
      }

      if (!digitalRead(column_3))
      {
        pinMode(column_3, OUTPUT);
        digitalWrite(column_3, LOW);
        row_in();

        if (!digitalRead(row_1) || !digitalRead(row_2) || !digitalRead(row_3))
        {
          delay(100);
          if (!digitalRead(row_1) || !digitalRead(row_2) || !digitalRead(row_3))
          {
            if (!digitalRead(row_1))
            {
              Serial.println("row 1 column 3 button pressed!");
            }
            if (!digitalRead(row_2))
            {
              Serial.println("row 2 column 3 button pressed!");
            }
            if (!digitalRead(row_3))
            {
              Serial.println("row 3 column 3 button pressed!");
            }
          }
        }
        row_out_column_in();
      }

      if (!digitalRead(column_4))
      {
        pinMode(column_4, OUTPUT);
        digitalWrite(column_4, LOW);
        row_in();

        if (!digitalRead(row_1) || !digitalRead(row_2) || !digitalRead(row_3))
        {
          delay(100);
          if (!digitalRead(row_1) || !digitalRead(row_2) || !digitalRead(row_3))
          {
            if (!digitalRead(row_1))
            {
              Serial.println("row 1 column 4 button pressed!");
            }
            if (!digitalRead(row_2))
            {
              Serial.println("row 2 column 4 button pressed!");
            }
            if (!digitalRead(row_3))
            {
              Serial.println("row 3 column 4 button pressed!");
            }
          }
        }
        row_out_column_in();
      }

      if (!digitalRead(column_5))
      {
        pinMode(column_5, OUTPUT);
        digitalWrite(column_5, LOW);
        row_in();

        if (!digitalRead(row_1) || !digitalRead(row_2) || !digitalRead(row_3))
        {
          delay(100);
          if (!digitalRead(row_1) || !digitalRead(row_2) || !digitalRead(row_3))
          {
            if (!digitalRead(row_1))
            {
              Serial.println("row 1 column 5 button pressed!");
            }
            if (!digitalRead(row_2))
            {
              Serial.println("row 2 column 5 button pressed!");
            }
            if (!digitalRead(row_3))
            {
              Serial.println("row 3 column 5 button pressed!");
            }
          }
        }
        row_out_column_in();
      }

      if (!digitalRead(column_6))
      {
        pinMode(column_6, OUTPUT);
        digitalWrite(column_6, LOW);
        row_in();

        if (!digitalRead(row_1) || !digitalRead(row_2) || !digitalRead(row_3))
        {
          delay(100);
          if (!digitalRead(row_1) || !digitalRead(row_2) || !digitalRead(row_3))
          {
            if (!digitalRead(row_1))
            {
              Serial.println("row 1 column 6 button pressed!");
            }
            if (!digitalRead(row_2))
            {
              Serial.println("row 2 column 6 button pressed!");
            }
            if (!digitalRead(row_3))
            {
              Serial.println("row 3 column 6 button pressed!");
            }
          }
        }
        row_out_column_in();
      }

      if (!digitalRead(column_7))
      {
        pinMode(column_7, OUTPUT);
        digitalWrite(column_7, LOW);
        row_in();

        if (!digitalRead(row_1) || !digitalRead(row_2) || !digitalRead(row_3))
        {
          delay(100);
          if (!digitalRead(row_1) || !digitalRead(row_2) || !digitalRead(row_3))
          {
            if (!digitalRead(row_1))
            {
              Serial.println("row 1 column 7 button pressed!");
            }
            if (!digitalRead(row_2))
            {
              Serial.println("row 2 column 7 button pressed!");
            }
            if (!digitalRead(row_3))
            {
              Serial.println("row 3 column 7 button pressed!");
            }
          }
        }
        row_out_column_in();
      }

      row_out_column_in();
    }
  }
}

void row_out_column_in()
{

  pinMode(row_1, OUTPUT);
  pinMode(row_2, OUTPUT);
  pinMode(row_3, OUTPUT);

  pinMode(column_1, INPUT_PULLUP);
  pinMode(column_2, INPUT_PULLUP);
  pinMode(column_3, INPUT_PULLUP);
  pinMode(column_4, INPUT_PULLUP);
  pinMode(column_5, INPUT_PULLUP);
  pinMode(column_6, INPUT_PULLUP);
  pinMode(column_7, INPUT_PULLUP);

  digitalWrite(row_1, LOW);
  digitalWrite(row_2, LOW);
  digitalWrite(row_3, LOW);
}

void row_in()
{
  pinMode(row_1, INPUT_PULLUP);
  pinMode(row_2, INPUT_PULLUP);
  pinMode(row_3, INPUT_PULLUP);
}