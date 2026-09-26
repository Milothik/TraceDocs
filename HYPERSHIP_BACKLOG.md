# Hypership Day backlog and feedback triage

This is a menu of candidate work, not a record of user feedback or a promise to ship every item. Activate a feature only after a real request, reproducible friction or measured failure supports it.

## Intake

Record: time, source/link, category, reproduction, expected behavior, actual behavior, impact, estimated effort, risk, owner, status, release commit. Do not copy private document text, IPs or API keys into an issue.

Categories: `BUG`, `UX`, `FEATURE REQUEST`, `DOCUMENT SUPPORT`, `JEV / RETRIEVAL`, `PERFORMANCE`, `API`, `OTHER`.

Priorities: **P0** breaks the product or exposes data; fix or roll back immediately. **P1** seriously impedes use; same-day attempt if safe. **P2** clear improvement under 1–2 hours; consider after P0/P1. **P3** later backlog. Escalate uncertain security issues instead of shipping a rushed patch.

| Candidate | Category | Impact | Time | Risk | Trigger / gate |
| --- | --- | --- | --- | --- | --- |
| Better unsupported-answer copy | UX | Medium | <30 min | Low | Users mistake abstention for an error. |
| Copy evidence block ID and citation | UX | Medium | <30 min | Low | Users need to cite a source manually. |
| Show flagged instruction attempts in trace summary | JEV / RETRIEVAL | Medium | 30–60 min | Low | Real confusion about omitted blocks; never expose private model reasoning. |
| Exact text highlight inside an extracted block | FEATURE REQUEST | High | 1–2 h | Medium | Requested with a reproducible span; requires offset data, not text matching guesses. |
| Better PDF page/line and table extraction | DOCUMENT SUPPORT | High | >2 h | High | A real PDF fails; test multiple layouts and scanned-PDF message. |
| Session-only query history | FEATURE REQUEST | Medium | 30–60 min | Medium | Requested; keep content out of persistent storage by default. |
| Compare two documents with Jev evidence per source | FEATURE REQUEST | High | >2 h | High | Real comparative use case; preserve source IDs and assess combined cost. |
| Experimental `POST /query` endpoint | API | Medium | >2 h | High | Clear agent demand; needs an answer generator, authentication and precise semantics. |
| Aggregate counters and latency dashboard | PERFORMANCE | Medium | 1–2 h | Medium | Logs show an operational need; avoid content and IP retention. |
| Retry/backoff for TypeSafe rate or transient errors | JEV / RETRIEVAL | Medium | 1–2 h | Medium | Reproducible upstream failures; cap attempts and latency. |

## Feature readiness

| Feature | Current status | Safe next seam |
| --- | --- | --- |
| Source inspection | Active at block/page/section level | Add exact offsets before enabling highlighting. |
| Evidence view | Active: evidence cards, scores, source dialog, trace JSON | Group panels without changing decision logic. |
| JSON export | Active: full trace | Add answer and source summary only when answer generation exists. |
| Multi-document comparison | Inactive | Add document-scoped block IDs, then Jev judging of both sources; no pre-Jev search. |
| Query history | Inactive | Session memory or opt-in browser storage; no server retention by default. |
| PDF | Active for extractable text | Improve tables/reading order; OCR remains out of scope. |
| `POST /query` | Inactive | Existing `POST /api/evaluate` returns evidence, `answer: null`; do not pretend it generates an answer. |

Avoid a global flag that advertises an unimplemented feature. Introduce `FEATURE_SOURCE_HIGHLIGHTING`, `FEATURE_COMPARE_DOCS`, `FEATURE_QUERY_HISTORY`, `FEATURE_API` only alongside working code, tests and a deployment check. The existing JSON export remains active.
