# Phase 5: Cache & Polish - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-06
**Phase:** 5-cache-polish
**Areas discussed:** Cache Info Display, Cache Comparison Tool, Error Handling Polish, UI Consistency & Edge Cases

---

## Cache Info Display

| Option | Description | Selected |
|--------|-------------|----------|
| Inline on ResultCard | Badge alongside language badge in existing card header | ✓ |
| New Cache Stats Tab | Dedicated tab with cache metrics table | |
| Per-results expandable section | Collapsible cache details below each result | |

**User's choice:** Inline on ResultCard (Recommended)

| Option | Description | Selected |
|--------|-------------|----------|
| Badge + token count | Green badge with cache_read_tokens number | ✓ |
| Simple hit/miss badge | Colored indicator only | |
| You decide | Agent picks | |

**User's choice:** Badge + token count (Recommended)
**Notes:** User wants both quick visual scan (badge color) and precise data (token count).

## Cache Comparison Tool

| Option | Description | Selected |
|--------|-------------|----------|
| Re-run same file | Upload file, then re-send for comparison | ✓ |
| Dedicated benchmark panel | New tab with benchmark controls | |
| Integrated into File Upload tab | Auto-run second time after completion | |

**User's choice:** Re-run same file (Recommended)

| Option | Description | Selected |
|--------|-------------|----------|
| On ResultCard footer | "Compare" button in completed ResultCard footer | ✓ |
| Separate section above results | Dedicated comparison section in tab | |
| You decide | Agent picks | |

**User's choice:** On ResultCard footer (Recommended)
**Notes:** Contextual, self-contained approach — user triggers comparison from the specific result they care about.

## Error Handling Polish

| Option | Description | Selected |
|--------|-------------|----------|
| Retry buttons + better messages | Inline retry with actionable error messages | ✓ |
| Error boundary component | React ErrorBoundary fallback for crashes | |
| Both A and B | Retry + ErrorBoundary | |
| You decide | Agent scopes | |

**User's choice:** Retry buttons + better messages (Recommended)
**Notes:** Focus on user recovery (retry) over crash protection (ErrorBoundary). Error messages are centralized and actionable.

## UI Consistency & Edge Cases

| Option | Description | Selected |
|--------|-------------|----------|
| Empty states + loading skeletons | Friendly empty states and skeleton loaders | ✓ |
| Cross-panel styling audit | Visual consistency audit | |
| Both A and B | Empty states + styling audit | |
| You decide | Agent scopes | |

**User's choice:** Empty states + loading skeletons (Recommended)
**Notes:** Functional polish (empty/loading states) over cosmetic polish (styling audit).

---

## Agent Discretion

- Exact cache badge styling (icon, color tokens, placement)
- Comparison card layout details
- Skeleton animation specifics
- Exact retry button copy and placement
- Whether to add global error boundary

## Deferred Ideas

None — discussion stayed within phase scope.
