---
phase: 02-frontend-connection-test
threats_total: 8
threats_closed: 7
threats_open: 0
accepted_risks: 3
audit_date: 2026-05-05
---

# Security Audit: Phase 2 - Frontend + Connection Test

## Threat Register

### CLOSED

| Threat | Category | Mitigation | Evidence |
|--------|----------|------------|----------|
| T-02-01 | Spoofing | **Frontend:** `new URL()` validation in `handleSave` — SettingsPanel.tsx:55-62. **Backend:** `UpdateSettingsRequest` Pydantic model with typed fields, `extra="forbid"`, URL `field_validator` — config.py:4-22, settings.py:21 |
| T-02-02 | Information Disclosure | API key masked in UI | `type={showApiKey ? 'text' : 'password'}` — SettingsPanel.tsx:166. Toggle button at :175-187. Masked by default via `useState(false)` at :31 |
| T-02-04 | DoS | Abort controller + configurable interval + cleanup on unmount | `AbortController` at useHealth.ts:28,31-36,40. `clearInterval` + `abortPending()` on unmount at :85-92. Configurable via `interval` param at :17, default 5000ms at :14 |
| T-02-05 | DoS | Single-tab polling with abort + configurable interval | Same mechanism as T-02-04 — useHealth.ts:14,17,28,85-92 |
| T-02-08 | DoS | Latency history capped at 10 entries | `MAX_LATENCY_HISTORY = 10` at useHealth.ts:15. `.slice(-MAX_LATENCY_HISTORY)` at :60 |

### ACCEPTED RISKS

| Threat | Category | Rationale |
|--------|----------|-----------|
| T-02-03 | Repudiation | No authentication layer on internal demo tool. Backend writes `.env` file providing a persistent config audit trail. Acceptable for internal-only usage. |
| T-02-06 | Information Disclosure | Model path (`/bmcp_lvm_fs/cusa/models/Qwen3-ASR-1.7B`) is non-sensitive infrastructure information on an internal-only demo. Not exposed to external threat actors. |
| T-02-07 | Manipulation | Latency is measured server-side by the backend; the frontend only displays the `latency_ms` value from the response. Frontend cannot spoof or manipulate the value. |

### OPEN

[none — all threats resolved]

## Audit Trail

### Security Audit 2026-05-05 (Initial)
| Metric | Count |
|--------|-------|
| Threats found | 8 |
| Closed (fully) | 4 |
| Partially closed | 1 (T-02-01 frontend satisfied, backend missing) |
| Accepted | 3 |
| Open | 1 |

### Fix Applied 2026-05-05
- **T-02-01:** Added `UpdateSettingsRequest` Pydantic model with typed fields, `extra="forbid"`, and URL `field_validator`. Replaced untyped `dict` parameter in `PUT /api/settings`. (Commit: 5ff691f)

### Security Audit 2026-05-05 (Post-Fix)
| Metric | Count |
|--------|-------|
| Threats found | 8 |
| Closed | 5 |
| Accepted | 3 |
| Open | 0 |

## Notes

- All polling mitigations (T-02-04, T-02-05) are fully verified: abort controller, cleanup on unmount, configurable interval, and bounded latency history are all present in `useHealth.ts`.
- API key masking (T-02-02) is correctly implemented with password input type, default-hidden state, and toggle button.
- T-02-01 resolved: frontend `new URL()` validation + backend `UpdateSettingsRequest` Pydantic model with `extra="forbid"` provides defense-in-depth.
