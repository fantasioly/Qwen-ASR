# Phase 3: File Upload Transcription - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-05
**Phase:** 3-File Upload Transcription
**Areas discussed:** Upload Interaction, Progress & Feedback, Result Display, Error & Edge Cases

---

## Upload Interaction

| Question | Options | Selected |
|----------|---------|----------|
| How should users select audio files? | Drag-drop + click / Click-only file picker / You decide | ✓ Drag-drop + click |
| Single or multiple files? | Single file only / Multiple files / You decide | ✓ Multiple files |
| Results display for multiple files? | Sequential queue / Replace single view / Accordion list | ✓ Sequential queue |
| File size limit behavior? | No explicit limit / Client-side size check / You decide | ✓ Client-side size check |

**Notes:** User chose multiple files despite PROJECT.md noting "single-file upload, not enterprise pipeline" is out of scope. Sequential queuing keeps results visible together.

---

## Progress & Feedback

| Question | Options | Selected |
|----------|---------|----------|
| Upload progress per file? | Inline progress bar / Global progress indicator / You decide | ✓ Inline progress bar |
| Status label alongside progress bar? | Yes, label + bar / Visual only (icon) / You decide | ✓ Yes, status label + progress bar |
| Show processing_time_ms? | Yes in result stats / No, hidden / You decide | ✓ Yes, in result stats |

**Notes:** Clear per-file status throughout the three-stage pipeline (uploading → processing → complete).

---

## Result Display

| Question | Options | Selected |
|----------|---------|----------|
| Result card header contents? | Filename + language / Filename + timestamp / Both | ✓ Both filename + language + timestamp |
| Copy to clipboard? | Copy icon in header / Select-all on click / You decide | ✓ Copy icon button in header |
| Token usage stats display? | Inline footer / Collapsible / Always-visible badges | ✓ Always-visible metadata badges |

**Notes:** Complete context per result card — filename, language badge, timestamp in header. Stats as badges for cross-file comparison.

---

## Error & Edge Cases

| Question | Options | Selected |
|----------|---------|----------|
| Timeout message style? | Specialized with guidance / Generic error toast / You decide | ✓ Specialized timeout message |
| Unsupported format handling? | Block at client / Let server handle / You decide | ✓ Block at upload with toast |
| Empty transcription result? | 'No speech detected' placeholder / Error toast / You decide | ✓ Placeholder in result card |

**Notes:** Distinguishes between three error categories: timeout (504), format rejection (client-side), and empty result (not an error — just no speech detected).

---

## Agent's Discretion

No areas deferred to agent discretion — all decisions made by user.

## Deferred Ideas

None — discussion stayed within phase scope.
