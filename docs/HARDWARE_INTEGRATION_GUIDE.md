# Smart Charging Station - Hardware Integration Guide

This document provides the definitive API specification to integrate the Charging Station controllers with the Backend Server.

## 1. Connection & Authentication

All hardware requests must include the `x-machine-id` header to identify which physical station is reporting.

- **Base URL:** `http://<server-ip>:3000/api/v1`
- **Required Header:** `x-machine-id: <MACHINE_ID>`
- **Machine ID Format:** Must be 1 Uppercase Letter + 2 Digits (e.g., `A01`, `B12`, `Z99`). IDs like `M1` or `A00` are invalid.

---

## 2. API Endpoints

### A. Report Door State
**Endpoint:** `POST /hardware/door-state`

Used by the controller to report when a door is closed or opened.

**Request Body:**
```json
{
  "slot_number": 1,
  "is_closed": true
}
```

> [!IMPORTANT]
> **Manual Override / Force Open:** The hardware **MUST** send a `POST /door-state` request with `is_closed: false` immediately if the sensor circuit opens unexpectedly (e.g., via the manual mechanical bar or if the door is forced). This allows the server to archive the interrupted session and reset the locker to `AVAILABLE` state automatically.

**Expected Responses:**

| Action | Description | Hardware Requirement |
| :--- | :--- | :--- |
| `ENABLE_CHARGING` | Authorized closure (Session is PENDING). | **Turn Relay ON** and lock door. |
| `UNLOCK_DOOR` | Unauthorized closure (Slot is AVAILABLE). | **Pulse Solenoid** to pop door back open immediately. |
| `NONE` | No action required (Stationary state). | Maintain current state. |

---

### B. Machine State Sync (The "Pulse" Check)
**Endpoint:** `GET /hardware/sync`

Used by the controller on boot-up, after a power failure, or periodically to check for "Remote Unlock" commands (User collecting phone).

**Response Body:**
```json
[
  {
    "slot_number": 1,
    "relay_on": true,
    "lock_engaged": true
  },
  {
    "slot_number": 2,
    "relay_on": false,
    "lock_engaged": false
  }
]
```

**Hardware Requirement:** 
- On Boot: Set all relays and locks immediately based on this array.
- During Operation: If `lock_engaged` for a slot becomes `false` while it was previously `true`, the hardware should **pulse the solenoid** to release the door (User Collection Flow).

---

## 3. The State Machine

1.  **AVAILABLE (IDLE):**
    -   Physical Status: Door Unlocked, Relay OFF.
    -   If an unauthorized user closes the door: Server returns `UNLOCK_DOOR`.
2.  **PENDING (User is at Tablet):**
    -   User has entered credentials and selected this slot.
    -   When user closes the door: Server returns `ENABLE_CHARGING`.
3.  **LOCKED_CHARGING (Active Session):**
    -   Physical Status: Door Locked, Relay ON.
4.  **LOCKED_EXPIRED (Session Ended):**
    -   Physical Status: Door Locked, Relay OFF.
    -   User must enter PIN on tablet. Once entered, the next `/sync` call will show `lock_engaged: false`.

---

## 4. Hardware Best Practices (Minimize Board Strain)

For a device running 24/7, efficiency is key. Follow these guidelines:

### A. Use Hardware Interrupts
Do not use a tight `loop()` with `digitalRead()` if possible. Instead, attach an **Interrupt** to the Door Sensor pins.
- The CPU stays idle.
- When the door closes, the Interrupt triggers the `POST /hardware/door-state` call immediately.

### B. Smart Sync (Avoid Constant Polling)
To avoid "straining" the board with constant network requests while nothing is happening:
- **Idle Mode:** Perform a `/sync` check every **30 to 60 seconds**.
- **Active Mode:** If the tablet is in use (detected via local signal or shorter sync), increase frequency to **every 2 seconds** ONLY until the "Unlock" action is received.

### C. Solenoid Protection
- Never keep the unlock solenoid engaged (HIGH) for more than **200–500ms**.
- Continuous power to a solenoid can cause it to burn out or overheat the controller's MOSFET/Relay.

### D. Power Safety
- The ESP32/Arduino is safe to "listen" 24/7. 
- Keeping the WiFi Radio on is normal and safe, provided the board has basic airflow.

---

## 6. Provisioning (Getting the Machine ID Dynamically)

To avoid hardcoding the `x-machine-id` in the firmware, we recommend a **Setup Mode** flow:

1.  **First Boot:** If the ESP32 has no `machine_id` saved in its NVS (Non-Volatile Storage), it starts a **WiFi Captive Portal** (Access Point mode).
2.  **Configuration:** The administrator connects to the ESP32's hotspot and enters:
    -   `WiFi SSID & Password`
    -   `Backend Server URL`
    -   `Machine ID` (Must follow the **A01-Z99** format, e.g., `A01`)
3.  **Persistence:** The ESP32 saves these values to memory and reboots.
4.  **Operation:** On every subsequent boot, it reads the ID from memory and includes it in the `x-machine-id` header.

---

## 7. Troubleshooting & Safety

-   **Memory Safety:** The `/sync` endpoint is optimized to only return **Active Slots**. Historical records are excluded to prevent buffer overflow on low-memory devices like ESP32.
-   **4xx Errors:** Error in request/ID. Hardware should log and notify admin.
-   **5xx Errors:** Server down. Hardware should **retry every 5 seconds** until a connection is restored.
-   **Relay Safety:** Always implement a physical timeout (watchdog) on the relay/solenoid pins to prevent them from staying ON if the software crashes.
