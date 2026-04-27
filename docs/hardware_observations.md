# Hardware Compatibility Observations: SARY XG-07A Lock

This document analyzes the alignment between the **Smart Charging Station Backend** and the **SARY XG-07A Solenoid Lock** specifications.

## 1. Physical & Electrical Alignment
| Parameter | SARY XG-07A Requirement | Current System Implementation | Status |
| :--- | :--- | :--- | :--- |
| **Type** | Fail-secure (Power ON to unlock) | Matches. System logic pulses power to release. | ✅ Identical |
| **Pulse Duration** | "Brief duration" to avoid burn-out | Guide specifies **200ms – 500ms** pulse. | ✅ Safe |
| **Current Draw** | 1.5A (5V) to 2.4A (12V) | Handled by ESP32 + Relay/MOSFET. | ⚠️ Note Below |
| **Feedback** | Short = Locked / Open = Unlocked | Handled by `is_closed` boolean. | ✅ Compatible |

> [!IMPORTANT]
> **Electrical Note:** The SARY XG-07A requires high current (up to 2.4A). Standard ESP32 GPIOs cannot drive this directly. The hardware team **must** use a Relay or a Logic-Level MOSFET (like IRLZ44N) to switch the external DC power supply.

---

## 2. API Architecture Comparison
The SARY Guide proposes two different architectural approaches. We must decide if our current flow remains superior:

### Approach A: SARY "Controller-as-Server" (Proposed in your snippet)
- **Flow:** Backend -> Request -> ESP32 API -> Lock.
- **Pros:** Real-time execution.
- **Cons:** Requires the ESP32 to have a static/public IP or a complex VPN/Tunnel to be reachable by the backend. High security risk if exposed.

### Approach B: Current "Server-as-Source" (Our Implementation)
- **Flow:** ESP32 -> Polling/Sync -> Backend -> Action Response.
- **Pros:** Highly secure (no inbound ports open on hardware). Works on any WiFi/Mobile network. History/State is managed centrally.
- **Cons:** Slight delay based on polling frequency (managed via "Smart Sync").

**Observation:** Our current **Approach B** is better for commercial deployment, as it handles thousands of kiosks without needing complex network configurations for each one.

---

## 3. Logic Gaps & Recommendations

### A. Manual Override Detection
- **SARY Fact:** The lock has a manual override bar.
- **Observation:** If someone uses the manual bar, the feedback circuit will show "Unlocked/Open" without the server ever sending an unlock command.
- **Recommendation:** Our `hardwareController.js` should be updated to log a "SECURITY_ALERT" if the door opens (`is_closed: false`) while the slot is in a `LOCKED_CHARGING` or `LOCKED_EXPIRED` state without a pending unlock command.

### B. Diagnostic Rule
- **SARY Rule:** If power is applied but feedback remains "Locked", it's a failure.
- **Observation:** Our current system doesn't "verify" the unlock.
- **Recommendation:** The ESP32 code should report a failure to the `POST /door-state` endpoint if the pulse doesn't result in an open circuit, allowing the Admin Dashboard to flag the machine for maintenance.

---

## 4. Final Verdict
We are **90% aligned**. The core logic is correct, but we should add "Malicious/Manual Opening Detection" to the backend to take full advantage of the SARY feedback line.

---

## 5. Slot Lifecycle & Record Management

To maintain a full audit trail, each "cycle" of a locker creates a unique database record. A single physical Slot (e.g., Slot 34) will eventually have many records in the database.

### The Cycle Flow:
1. **Creation:** When a machine is first created, it has one `AVAILABLE` record for each slot.
2. **Assignment:** When a user selects the slot, that record transitions to `PENDING`.
3. **Usage:** Hardware reports closure -> record transitions to `LOCKED_CHARGING`.
4. **Collection:** User retrieves phone -> record transitions to `COMPLETED` (This is now **History**).
5. **Respawn:** The system immediately creates a **NEW** `AVAILABLE` record for the same slot number.

### ⚠️ Technical Rule for Developers:
All backend queries targeting a physical slot **MUST** include the filter `{ status: { $ne: 'COMPLETED' } }` to ensure you are interacting with the "Live" session and not a historical record from a previous user.
