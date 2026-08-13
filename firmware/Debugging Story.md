
### HTTP request failures ( HTTP Error -1 and -11 from HTTPClient.h) when switching WiFi providers (Router to Mobile hotspot) -- TCP Packet fragmentation

*Scenario:* 

I switched the wifi provider from the workshops wifi router to mobile hotspot on the esp32 runnning the charging station firmware. After this switch, I noticed HTTP error -1 and -11 alternatively.

*Reason:*

---

### ESP32 to Mega Board Serial Corruption (`"==I4:0`, `Q"==I9:0`) -- AVR Interrupt Blocking during NeoPixel (`pixels.show()`) & UART Desynchronization

*Scenario:*
Serial monitor on Board 1 reported mangled incoming commands like `ESP32 -> Board1: "==I4:0` instead of `CMD:CHG_OFF:4` or `CMD:UNLOCK:4`.

*Reason & Root Cause:*
1. **AVR Hardware Baud Rate Clock Error (-3.55%)**: At 16 MHz, setting ATmega2560 UART to 115200 baud creates a **-3.55% clock error** ($UBRR=8 \rightarrow 111,111\text{ baud}$). Over 15–20 byte string bursts, the sampling clock drifts past bit boundaries, causing start-bit loss and a 1-bit phase shift ($0\text{x}45 \text{ 'E'} \rightarrow 0\text{x}22 \text{ '"'}$). At **38400 baud** ($UBRR=25 \rightarrow 38,461.5\text{ baud}$), the hardware clock error is virtually zero (**0.16%**).
2. **ESP32 `Serial1` Peripheral Routing**: ESP32 `Serial1` defaults to internal SPI flash pins (9 & 10). Remapping `Serial1` to 16 & 17 caused peripheral matrix glitches, whereas native `Serial2` owns GPIO 16 & 17 natively.
3. `Adafruit_NeoPixel::show()` on ATmega2560 disables CPU interrupts (`cli()`) during WS2811 bit-banging (~600 µs for 19 LEDs).

*Resolution:*
1. **Baud Rate Optimization (38400 Baud)**: Switched all inter-board UART communication (`Serial1` & `Serial2`) to **38400 baud**, reducing hardware UART baud error on ATmega2560 from -3.55% to 0.16%.
2. **Native ESP32 Hardware UART (`Serial2`)**: Switched ESP32 firmware from `Serial1` to native `Serial2` on pins 16 (RX) and 17 (TX).
3. **Strict `<...>` Frame Buffer Parsing**: Hardened frame buffer reader to reset buffer on `<` and process complete frames on `>`, ignoring any framing noise or newline characters outside delimiters.
4. **Deferred NeoPixel Rendering:** Updated `board1_atmega2560.cpp` and `board2_atmega2560.cpp` to queue LED updates with a `pixelsDirty` flag and only invoke `pixels.show()` when serial lines have been idle for at least 15ms.
5. **Paced Flow Control:** Added an 80ms delay between commands in ESP32 `syncState()`.

---

## UART Message Handling Techniques

This section documents the end-to-end UART reliability and string-handling techniques implemented across the ESP32 and ATmega2560 microcontrollers, detailing the hardware/software symptoms they resolve along with terminal output snapshots before and after each fix.

### 1. USB-to-UART Driver Stabilization & Bootloader Mode Lockout (ESP32)
* **Symptom / Problem:**
  - On cold USB insertion or serial monitor connection, the host OS (Linux) USB-to-UART bridge (`cp21x`/`ch341`) baud rate divisor registers are initially uninitialized, resulting in a continuous stream of garbled/replacement characters (`xx␀x...` or `␎p␌p...`).
  - Toggling DTR/RTS upon opening serial monitors held the ESP32 in ROM bootloader mode at 74,880 baud.
  - Empty `loop()` functions caused FreeRTOS CPU starvation and Task Watchdog Timer (TWDT) resets.

* **Terminal Output BEFORE Fix (Cold USB Plug-in / Uninitialized Baud):**
```text
␎p␌p␌`␌p␜p␌p␌`␌p␜p␌p␌`␌p␜p␌p␌`␌p␜p␌p␌`␌p␜p宿p␎␌p␜␎p␀␌p␌␎`p␜`␎p␌p⌌`␌p␜p...
```
*(Also encountered continuous `xx␀x␀xxxxxxxx␀x...` bootloader stream when DTR/RTS held GPIO0 LOW).*

* **Terminal Output AFTER Fix (With Stabilization Delay & DTR/RTS Lockout):**
```text
ets Jul 29 2019 12:21:46

rst:0x1 (POWERON_RESET),boot:0x13 (SPI_FAST_FLASH_BOOT)
configsip: 0, SPIWP:0xee
clk_drv:0x00,q_drv:0x00,d_drv:0x00,cs0_drv:0x00,hd_drv:0x00,wp_drv:0x00
mode:DIO, clock div:2
load:0x3fff0030,len:4640
load:0x40078000,len:15660
load:0x40080400,len:3164
entry 0x4008059c


************************************************
SMART CHARGING STATION TEST SCRIPT
Machine ID: M01


************************************************
Connecting to WiFi: AibotInk workshop......
 Wifi connected! IP: 192.168.31.223
[SYNC] First sync payload received from GET request:
[{"slot_number":1,"relay_on":false,"lock_engaged":false}, ...]
[SYNC] Door Statuses:
  Slot 1 -> Lock Engaged: false, Relay On: false
```

* **Techniques & Fixes:**
  - **USB Stabilization Delay:** `Serial.begin(115200); delay(500); Serial.flush();` in `setup()` allows host TTY drivers and bridge IC clocks to stabilize before data transmission starts.
  - **FreeRTOS Yielding:** Added `delay(10);` in `loop()` to yield execution to the FreeRTOS idle task and prevent TWDT resets.
  - **DTR/RTS Lockout:** Added `monitor_dtr = 0` and `monitor_rts = 0` in `platformio.ini` to prevent auto-reset into ROM download mode when opening monitors.

---

### 2. Power-On/Reset Line Glitch & Startup RX Buffer Purging (ESP32 & ATmega2560)
* **Symptom / Problem:**
  - During ESP32 reset or bootloader execution, GPIO 17 (UART TXD) momentarily glitches LOW before hardware initialization.
  - The ATmega2560 UART receiver interprets this LOW pulse as a false START bit, pushing `0x00` (NUL `\0`) bytes into its hardware RX buffer. Since `String.trim()` in Arduino C++ does not strip `0x00`, messages were printed with leading NUL characters (`␀CMD:CHG_OFF:1`).

* **Terminal Output BEFORE Fix (On ATmega2560 `Serial2` Receiver):**
```text
Initial serial monitor:
Mega Board 1 communication test scripts
Received ESP-> Board1: ␀CMD:CHG_OFF:1
Received ESP-> Board1: CMD:CHG_OFF:2

after first esp32 reset:
Received ESP-> Board1: ␀␀CMD:CHG_OFF:1
Received ESP-> Board1: CMD:CHG_OFF:2

after second esp32 reset:
Received ESP-> Board1: ␀CMD:CHG_OFF:1
Received ESP-> Board1: CMD:CHG_OFF:2
```

* **Terminal Output AFTER Fix (Clean Transmission Across Resets):**
```text
Mega Board 1 communication test scripts
Received ESP-> Board1: CMD:CHG_OFF:1
Received ESP-> Board1: CMD:CHG_OFF:2
Received ESP-> Board1: CMD:CHG_OFF:3
Received ESP-> Board1: CMD:CHG_OFF:4
```

* **Techniques & Fixes:**
  - **Transmitter Glitch Flushing (ESP32):** `Serial1.begin(115200, SERIAL_8N1, 16, 17); delay(100); Serial1.println(); Serial1.flush();` immediately sends a clean newline to settle the line and terminate any partial glitch frame on the receiver.
  - **Hardware RX Buffer Purging (ATmega2560):** `while (Serial1.available() > 0) Serial1.read(); while (Serial2.available() > 0) Serial2.read();` during `setup()` clears any residual boot noise before starting the main event loop.

---

### 3. Strict Character Filtering & Replacement Character Elimination (ATmega2560 & ESP32)
* **Symptom / Problem:**
  - Transient hardware line noise or mid-character frame truncations introduce `0x00` (NUL) bytes or non-ASCII bytes (`> 127`).
  - Terminal emulators display these non-UTF-8 / framing error bytes as `` (Unicode Replacement Character `U+FFFD` - white question mark in highlighted diamond/triangle), or copy-paste them as invisible/space characters before valid command strings.

* **Terminal Output BEFORE Fix (Corrupted Framing Byte / Replacement Character ``):**
```text
Received ESP-> Board1:  CHG_OFF:33
```
*(In the physical serial monitor, the leading space displayed as `` - question mark in a highlighted diamond symbol due to UART frame corruption).*

* **Terminal Output AFTER Fix (Strict `c == '\0' || (uint8_t)c > 127` Filter):**
```text
Received ESP-> Board1: CMD:CHG_OFF:33
```

* **Techniques & Fixes:**
  - **Byte Filtering:** Added `if (c == '\0' || (uint8_t)c > 127) continue;` in all serial reading loops to discard NULL bytes and non-ASCII framing-error noise.
  - **Delimiter Handling:** Stripped `\r` (carriage return) and processed valid command payloads strictly on `\n` line boundaries.

---

### 4. Paced Flow Control & Hardware RX Buffer Overflow Prevention (ESP32 -> ATmega2560)
* **Symptom / Problem:**
  - During initial GET synchronization (`syncState()`), the ESP32 rapidly bursts commands for all 38 slots.
  - Debug logging over 9600 baud caused the ATmega2560 USB TX buffer to fill up and block the main loop for ~41ms per line. While blocked, the Mega's 64-byte `Serial2` hardware RX FIFO overflowed, dropping leading characters (e.g. `CMD:CHG_OFF:33` truncated to `CHG_OFF:33`).

* **Terminal Output BEFORE Fix (Prefix Truncation at Slot 33):**
```text
Received ESP-> Board1: CMD:CHG_OFF:30
Received ESP-> Board1: CMD:CHG_OFF:31
Received ESP-> Board1: CMD:CHG_OFF:32
Received ESP-> Board1: CHG_OFF:33
Received ESP-> Board1: CMD:CHG_OFF:34
Received ESP-> Board1: CMD:CHG_OFF:35
```

* **Terminal Output AFTER Fix (115200 Baud + 75ms Inter-Command Delay):**
```text
Received ESP-> Board1: CMD:CHG_OFF:30
Received ESP-> Board1: CMD:CHG_OFF:31
Received ESP-> Board1: CMD:CHG_OFF:32
Received ESP-> Board1: CMD:CHG_OFF:33
Received ESP-> Board1: CMD:CHG_OFF:34
Received ESP-> Board1: CMD:CHG_OFF:35
Received ESP-> Board1: CMD:CHG_OFF:36
Received ESP-> Board1: CMD:CHG_OFF:37
Received ESP-> Board1: CMD:CHG_OFF:38
```

* **Techniques & Fixes:**
  - **High-Speed Debug Logging:** Set all debug serial monitors to 115200 baud, reducing logging blocking time by 12x (< 3ms).
  - **Paced Command Spacing:** Added a `75ms` delay (`delay(75);`) between slot commands in ESP32 `syncState()`. This provides sufficient CPU time for ATmega2560 to parse commands, trigger relays/locks, forward frames to Board 2, and emit debug output without overflowing hardware RX buffers.