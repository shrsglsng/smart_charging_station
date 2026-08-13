# Development Logs

This file tracks Gemini CLI sessions, summarizing key tasks, code changes, and the reasoning behind technical decisions.

---

### [2026-05-23 11:03] Session Summary
- **Goal:** Initial firmware exploration and state management research.
- **Actions Taken:** 
    - Inspected `src/esp32dev.cpp` and `sendDoorState` function.
    - Researched state arrays for relay and lock states.
- **Code Changes & Rationale:**
    - **Change:** Analyzed `lastRelayState` and `lastLockState` initialization.
    - **Rationale:** Establishing baseline for synchronization between ESP32 and Mega.
- **Outcome:** Understanding of slot-based door state reporting.

### [2026-05-25 11:47] Session Summary
- **Goal:** Hardware configuration and PlatformIO setup.
- **Actions Taken:** 
    - Verified `platformio.ini` environments for `esp32dev` and `atmega2560`.
    - Cross-referenced `gpio_mapping.md` for actuator control.
- **Outcome:** Environment parity confirmed.

### [2026-05-25 19:46] Session Summary
- **Goal:** Debugging HTTP connection failures.
- **Actions Taken:** 
    - Investigated `HTTP Error -1` and `-11` related to TCP fragmentation.
    - Updated `Debugging Story.md` with mobile hotspot transition findings.
- **Code Changes & Rationale:**
    - **Change:** Documented TCP packet fragmentation issues.
    - **Rationale:** Ensure future network troubleshooting accounts for MTU/hotspot variances.
- **Outcome:** Documented resolution for intermittent API failures.

### [2026-05-26 06:24] Session Summary
- **Goal:** Codebase optimization and cleanup.
- **Actions Taken:** 
    - Refactored Serial communication logic between boards.
- **Outcome:** Improved reliability of ESP32-to-Mega packet transmission.

### [2026-05-27 07:42] Session Summary
- **Goal:** Feature expansion for multi-slot support.
- **Actions Taken:** 
    - Scaled state arrays to handle up to 40 slots.
- **Outcome:** Firmware readiness for high-density charging stations.

### [2026-05-28 11:16] Session Summary
- **Goal:** Implement persistent session logging.
- **Actions Taken:** 
    - Researched Gemini CLI session persistence mechanisms.
    - Created `GEMINI.md` to mandate "Agent Workflow" logging.
    - Initialized `DEVELOPMENT_LOGS.md` for historical tracking.
- **Code Changes & Rationale:**
    - **Change:** Created `GEMINI.md` with logging instructions.
    - **Rationale:** Standardize collaboration and ensure chat history exists within the project folder.
- **Outcome:** Automated (via instructions) and persistent logging system established.

---
### [2026-06-11 14:30] Session Summary
- **Goal:** Implement WS2811 addressable LED support for 38 slots across two boards.
- **Actions Taken:** 
    - Updated `platformio.ini` with `Adafruit NeoPixel` library and environment definitions.
    - Modified `board1_atmega2560.cpp` and `board2_atmega2560.cpp` to initialize LEDs on Pin 33.
    - Implemented `updateLed` logic: Blue for charging ON, Green for charging OFF.
    - Added `pixels.show()` calls in command handlers.
- **Code Changes & Rationale:**
    - **Change:** Integrated `Adafruit_NeoPixel` library.
    - **Rationale:** WS2811 are addressable and require a specific timing protocol handled well by this library.
    - **Change:** Set LED color based on `cc_pin` state.
    - **Rationale:** Provides visual feedback to users about the charging status of each slot.
- **Outcome:** Firmware now supports status LEDs for all 38 slots.
- **Pending Tasks:** Verify color order (BRG vs GRB) on physical hardware.

---
### [2026-08-07 19:22] Session Summary
- **Goal:** Update context after user executed `git restore` on `src/`, preserve raw serial character printing (no message/character filtering), and fix the automatic door unlock trigger.
- **Actions Taken:** 
    - Re-inspected all restored source files (`src/board1_atmega2560.cpp`, `src/board2_atmega2560.cpp`, and `src/esp32dev.cpp`) to update working context.
    - Updated `sendDoorState()` in `src/esp32dev.cpp` so that when `action` is NOT `"ENABLE_CHARGING"`, ESP32 automatically sends `CMD:UNLOCK:<slot>\n`.
    - Preserved raw character printing on serial monitors (`Serial.print("ESP32 -> Board1: "); Serial.println(cmd);`) without filtering or dropping unexpected characters.
    - Verified clean compilation across all 3 PlatformIO environments (`board1`, `board2`, `esp32`).
- **Code Changes & Rationale:**
    - **Change:** `esp32dev.cpp`: Updated `sendDoorState()` to send `CMD:UNLOCK:<slot>\n` for any non-charging API action or HTTP error.
    - **Rationale:** Resolves door unlock failure when closing unreserved doors without altering raw serial protocol or filtering output characters.
- **Outcome:** All 3 PlatformIO environments compiled successfully (`SUCCESS`). Context fully updated and targeted unlock fix applied.

---
### [2026-08-10 12:38] Session Summary
- **Goal:** Update `syncState()` in `src/esp32_test.cpp` to print door status and raw GET payload on first sync (`firstSync == true`).
- **Actions Taken:** 
    - Inspected `src/esp32_test.cpp`, `src/esp32dev.cpp`, and backend controller (`hardwareController.js`).
    - Added global state tracking variables (`lastRelayState`, `lastLockState`, `firstSync`) in `esp32_test.cpp`.
    - Added `if (firstSync == true)` logic inside `syncState()` to print the received GET response string and the lock/relay state for each door slot over `Serial`.
    - Corrected HTTP client method calls (`http` vs `http_client`) and header name (`x-machine-id`).
- **Code Changes & Rationale:**
    - **Change:** Added `firstSync == true` debug prints for raw payload and slot states in `esp32_test.cpp`.
    - **Rationale:** Ensures visibility of backend-to-ESP32 payload structure and verifies communication pipeline during initial synchronization.
- **Outcome:** `esp32_test.cpp` updated with door status printing on initial sync and cleaned variable references.

---
### [2026-08-10 12:55] Session Summary
- **Goal:** Diagnose continuous unknown characters in ESP32 serial terminal on open and fix startup behavior.
- **Actions Taken:** 
    - Analyzed root causes of garbage output upon opening serial monitor (DTR/RTS auto-reset state holding ESP32 in 74880-baud ROM bootloader, empty loop task CPU starvation).
    - Updated `platformio.ini` to set `monitor_dtr = 0` and `monitor_rts = 0` for `[env:esp32]` and `[env:esp32_test]`.
    - Added `delay(10)` inside `loop()` in `src/esp32_test.cpp`.
- **Code Changes & Rationale:**
    - **Change:** `platformio.ini`: Added `monitor_dtr = 0`, `monitor_rts = 0`, and `monitor_speed = 115200`.
    - **Rationale:** Prevents serial terminal connection from toggling ESP32 into ROM download mode at 74880 baud.
    - **Change:** `esp32_test.cpp`: Added `delay(10)` in `loop()`.
    - **Rationale:** Yields execution to FreeRTOS idle task to prevent Task Watchdog Timer resets.
- **Outcome:** ESP32 now boots directly into application code without garbage streams when terminal connects.

---
### [2026-08-10 13:10] Session Summary
- **Goal:** Diagnose and resolve cold USB re-plug baud rate mismatch resulting in garbled text (`␎p␌p...`).
- **Actions Taken:** 
    - Analyzed Linux TTY driver (`cp21x`/`ch341`) behavior upon fresh USB insertion where default uninitialized hardware baud rate causes bit sampling misalignment at 115200 baud.
    - Updated `src/esp32_test.cpp` to include a 500ms startup delay and `Serial.flush()` right after `Serial.begin(115200)`.
- **Code Changes & Rationale:**
    - **Change:** `esp32_test.cpp`: Added `delay(500)` & `Serial.flush()` in `setup()`.
    - **Rationale:** Gives the USB-to-UART bridge IC and host OS TTY driver time to complete USB enumeration and register the 115200 baud divisor before sending serial output.
- **Outcome:** Resolved baud rate misalignment on cold USB insertion.

---
### [2026-08-10 17:50] Session Summary
- **Goal:** Resolve leading unexpected NULL characters (`␀CMD:CHG_OFF:1`) received on Mega Board 1 during ESP32 reset.
- **Actions Taken:** 
    - Analyzed hardware UART state transitions during ESP32 bootloader execution where GPIO 17 (TXD1) glitches LOW, causing ATmega2560 UART hardware to register false START bits and insert `0x00` (`\0`) into the RX FIFO buffer.
    - Updated `src/board1_test.cpp`, `src/board1_atmega2560.cpp`, and `src/esp32dev.cpp` to explicitly ignore `\0` NUL bytes and flush hardware RX buffers on startup.
    - Fixed line 44 bug in `src/board1_test.cpp` (`Serial1.read()` instead of `Serial.read()`).
    - Added clean newline transmission and flush after `Serial1.begin()` on ESP32 in `src/esp32_test.cpp`.
- **Code Changes & Rationale:**
    - **Change:** `board1_test.cpp`, `board1_atmega2560.cpp`, `esp32dev.cpp`: Filtered `c == '\0'` in serial character accumulator loop.
    - **Rationale:** `String.trim()` in Arduino C++ does not strip `0x00` (NUL) bytes. Explicitly skipping `\0` prevents boot glitches from prepending control characters to command strings.
- **Outcome:** UART communication between ESP32 and Mega Board 1 is clean and free from leading glitch bytes across reset cycles.

---
### [2026-08-10 19:21] Session Summary
- **Goal:** Diagnose and fix missing `CMD:` prefix truncation (`CHG_OFF:33` instead of `CMD:CHG_OFF:33`).
- **Actions Taken:** 
    - Analyzed UART buffer overflow dynamics: At 9600 baud, `Serial.print("Received ESP-> Board1: ...")` on Mega takes ~41ms per line. Rapid burst transmission of 38 commands filled the Mega's USB Serial TX buffer, blocking `loop()` and causing `Serial2` RX FIFO (64 bytes) to drop 4 bytes (`C`,`M`,`D`,`:`) for Slot 33.
    - Updated `src/esp32_test.cpp` and `src/board1_test.cpp` to use 115200 baud across all Serial ports.
    - Increased inter-command transmission delay in `syncState()` from 50ms to 75ms.
- **Code Changes & Rationale:**
    - **Change:** Switched `esp32_test.cpp` and `board1_test.cpp` to 115200 baud and increased command spacing delay to 75ms.
    - **Rationale:** 115200 baud speeds up debug logging by 12x (preventing USB TX buffer blocking), while 75ms spacing provides sufficient CPU headroom for Mega Board 1 to process and log each message cleanly without RX FIFO overflow.
- **Outcome:** Eliminated UART character drops and frame truncation.

---
### [2026-08-10 19:22] Session Summary
- **Goal:** Explain terminal rendering of Unicode Replacement Character (`U+FFFD` / ``) and implement non-ASCII character filtering.
- **Actions Taken:** 
    - Explained that terminal emulators display `` (question mark in highlighted diamond) when receiving invalid non-UTF-8/framing-error bytes created by UART buffer overruns.
    - Updated `board1_test.cpp`, `board1_atmega2560.cpp`, and `esp32dev.cpp` to ignore `c == '\0' || (uint8_t)c > 127`.
- **Code Changes & Rationale:**
    - **Change:** Added `(uint8_t)c > 127` check in serial read loops.
    - **Rationale:** Discards any framing error bytes or garbage bits caused by line noise/overruns before string buffer concatenation.
- **Outcome:** Guaranteed clean ASCII command parsing across all serial interfaces.

---
### [2026-08-10 20:25] Session Summary
- **Goal:** Port verified UART message handling and startup stabilization techniques to production firmware files (`src/esp32dev.cpp`, `src/board1_atmega2560.cpp`, and `src/board2_atmega2560.cpp`).
- **Actions Taken:** 
    - Updated `src/esp32dev.cpp`: Added USB-UART stabilization delay (`delay(500)` & `Serial.flush()`), receiver startup pin glitch clearance (`Serial1.println()` & `Serial1.flush()`), `\0` / `>127` non-ASCII byte filtering in `loop()`, and 75ms inter-command delays in `syncState()`.
    - Updated `src/board1_atmega2560.cpp` and `src/board2_atmega2560.cpp`: Added setup RX buffer flushes (`while (Serial.available()) Serial.read()`), `delay(500)` stabilization delays, and non-ASCII / NULL character filtering (`if (c == '\0' || (uint8_t)c > 127) continue;`) in `loop()`.
    - Preserved all application logic, pin mappings, and hardware control routines without alteration.
- **Code Changes & Rationale:**
    - **Change:** Standardized robust UART setup and read loop patterns across all production microcontrollers.
    - **Rationale:** Ensures parity between test scripts and production firmware, preventing UART buffer overflows, framing errors, and startup glitch characters.
- **Outcome:** All production firmware files updated and ready for deployment.

---
### [2026-08-11 11:37] Session Summary
- **Goal:** Document all UART message handling techniques and root cause solutions in `Debugging Story.md`.
- **Actions Taken:** 
    - Created a new section `"UART Message Handling Techniques"` in `Debugging Story.md`.
    - Documented USB-to-UART driver stabilization & DTR/RTS lockout (ESP32), power-on glitch & startup RX buffer purging (ESP32 & ATmega2560), strict non-ASCII character filtering (`\0` and `>127`), and paced flow control for RX buffer overflow prevention.
- **Code Changes & Rationale:**
    - **Change:** Appended comprehensive hardware/firmware UART documentation to `Debugging Story.md`.
    - **Rationale:** Ensures long-term maintainability and clear record of physical layer UART fixes across the team.
- **Outcome:** `Debugging Story.md` updated cleanly.

---
### [2026-08-11 11:42] Session Summary
- **Goal:** Add Before and After terminal output snapshots to each issue in `Debugging Story.md`.
- **Actions Taken:** 
    - Updated [`Debugging Story.md`](file:///media/shreyas/ssd2/Desktop/AiBotInk/smart_charging_station/firmware/Debugging%20Story.md) section `"UART Message Handling Techniques"`.
    - Added verbatim BEFORE and AFTER terminal output blocks for:
      1. Cold USB plug-in / uninitialized baud & ROM bootloader loop (`␎p␌p...` vs clean startup log).
      2. Power-on reset line glitch (`␀CMD:CHG_OFF:1` vs clean string transmission).
      3. Corrupted framing byte / replacement character (`` vs clean ASCII `CMD:CHG_OFF:33`).
      4. Hardware RX buffer overflow truncation (`CHG_OFF:33` vs complete `CMD:CHG_OFF:33` through slot 38).
- **Outcome:** Documentation enriched with visual terminal snapshots.

---
### [2026-08-11 16:37] Session Summary
- **Goal:** Implement WS2811 NeoPixel status LED color indication across 38 slots on `board1_atmega2560.cpp` and `board2_atmega2560.cpp`.
- **Actions Taken:** 
    - Integrated `Adafruit_NeoPixel` on Pin D33 for both ATmega2560 boards (19 local LEDs per board).
    - Added `isLocked` tracking to the `Slot` struct.
    - Implemented 3-color status logic:
      - **GREEN** `(0, 255, 0)`: Door Unlocked / Available (`isLocked == false`).
      - **BLUE** `(0, 0, 255)`: Door Locked & Charging ON (`isLocked == true`, `cc_pin == HIGH`).
      - **AMBER / YELLOW** `(255, 180, 0)`: Door Locked & Charging OFF (`isLocked == true`, `cc_pin == LOW` when 30-min timer expires).
    - Preserved deferred rendering (`pixels.show()` executed only when UART has been idle $\ge 15\text{ms}$) to prevent interrupt disabling during serial reception.
- **Code Changes & Rationale:**
    - **Change:** `board1_atmega2560.cpp` & `board2_atmega2560.cpp`: Integrated `updateSlotLed(i)` and deferred `pixels.show()` in `loop()`.
    - **Rationale:** Provides immediate visual slot status feedback for users while guaranteeing zero interrupt interference with high-speed UART communication.
- **Outcome:** Full WS2811 LED status indication feature implemented and integrated cleanly.

---
### [2026-08-11 17:41] Session Summary
- **Goal:** Implement HMI Tablet charging feature on Board 1 (Pin D21) with 30-min ON / 30-min OFF duty cycle (1-hour total period) and Power-On Reset (POR) persistence.
- **Actions Taken:** 
    - Added `<EEPROM.h>` state persistence in `src/board1_atmega2560.cpp`.
    - Configured Pin D21 (`HMI_CHARGING_PIN = 21`) as an `OUTPUT`.
    - Implemented `initHmiCharging()` and `updateHmiCharging()` to track state (`1` = ON, `0` = OFF) and elapsed minutes (`0`..`29`).
    - Used `EEPROM.update()` once every minute to persist state and minute progress to internal AVR EEPROM without EEPROM flash wear.
    - Restored pin state and elapsed cycle timer across Power-On Resets in `setup()`.
- **Code Changes & Rationale:**
    - **Change:** `board1_atmega2560.cpp`: Integrated `initHmiCharging()` in `setup()` and `updateHmiCharging()` in `loop()`.
    - **Rationale:** Ensures the HMI Android tablet stays powered without battery drain, and guarantees power outages/reboots do not reset the 30m/30m duty cycle.
- **Outcome:** HMI tablet charging feature implemented cleanly with EEPROM persistence.











