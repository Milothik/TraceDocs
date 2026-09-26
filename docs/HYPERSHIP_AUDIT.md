# TraceDocs audit · 26 September 2026

## Baseline and decision

The current source has no embedding, BM25, keyword or lexical top-k veto before Jev. Browser extraction produces source-linked blocks. At 24 blocks or fewer, Jev scores all blocks. Above that, each structural group of at most 12 blocks is represented by a 225-character preview per member; Jev scores **every** group, then full blocks of Jev-selected groups. This is not equivalent to reading every word of a large corpus. A relevant sentence beyond a preview can be missed; the current `evaluation_incomplete` path catches missing group signal and the call budget, but a positive selected group does not prove perfect global recall. Preserve the hierarchy and disclose this limit.

| Area | Current behavior | Launch action / limit |
| --- | --- | --- |
| Frontend | Browser extracts PDF, DOCX, text, JSON and ZIP; source dialog shows block, section and PDF page. | Keep. Exact text offsets/highlighting remain inactive. |
| Evidence | Jev outputs four numeric signals per block; code applies fixed thresholds and abstains or returns selected evidence. | Keep rule visible; scores are not calibrated truth. |
| Answer | API returns `answer: null`; an external LLM can compose an answer and `verify_claim` can evaluate one cited block. | Do not advertise a built-in answer generator. |
| MCP/WebMCP | Browser WebMCP exposes current document; HTTP MCP exposes the prepared case and caller-supplied blocks. | Do not claim universal model support; test each client. |
| Upload privacy | Extraction occurs in the browser; text blocks are sent to the backend and TypeSafe on evaluation. No uploaded binary archive is created. | Do not claim that no data leaves the browser. Review TypeSafe retention terms separately. |
| PHP hosting | `.htaccess` routes status, evaluate and MCP to `backend.php`; key and daily hash quota are intended outside `public_html`. | Current public status reports Jev unconfigured; no real run verified. |
| Rate limit | PHP uses `REMOTE_ADDR`, SHA-256 hash and locked JSON records, 10 Jev requests per UTC day; Node uses serialized private storage. | Tested locally. Shared public IPs share quota; verify hosting persistence and clock. |
| Observability | Evaluation and failure counts, Jev calls, latency, evidence count and injection flags can be logged without raw document or IP. | No LLM failure metric until an LLM is integrated. No measured billable cost yet. |
| PDF | Text extraction groups by vertical coordinate, retaining page but not exact line or table geometry. | Scanned PDFs require OCR. Headers/footers, columns and tables can distort order. Long lines are truncated at 3,500 characters per block; document this as a launch risk. |
| Cost/latency | One quota use can generate up to 120 serial Jev calls; each upstream call has a 20-second timeout. | No configured unit price. Large documents can be slow/expensive; do not claim speedups. |

## Prompt-injection boundary

Document content is data. Jev receives it with `source_type: user_provided_document` and returns a `prompt_injection` signal; a block scoring at or above 0.4 is excluded from the evidence set. Evidence and trace now mark source trust as `untrusted_document`, include an answer contract for calling LLMs and count flagged full blocks. This is a risk reduction, not a guarantee. The external LLM is outside TraceDocs' control, the detector can miss attacks, and stage-one previews can contain instruction text. Do not claim prevention until red-team tests with actual agents support a narrower statement.

## Technical constraints and work deliberately deferred

- `POST /query` cannot truthfully return an answer without choosing and integrating an answer model. Existing `POST /api/evaluate` and MCP return evidence with `answer: null`.
- Multi-document comparison needs namespaced block IDs and a decision rule across both sources, with a cost bound. No existing search index should veto blocks before Jev.
- Source highlighting needs exact offsets from extractors. Current cards show blocks; an exact fragment highlight based on string matching alone could point to the wrong passage.
- Query history should default to in-memory session state; local persistence could retain sensitive questions and is not enabled.
- Feature flags should accompany complete, tested implementations. A flag for an absent feature would create a misleading promise.

## Validation matrix

| Scenario | Evidence today | Remaining gate |
| --- | --- | --- |
| Short document, unrelated first block | Mock integration test proves all blocks reached Jev and correct later block selected. | Real Jev run. |
| Long document, evidence in middle | Mock integration test proves every structural preview reached Jev; selected group's full blocks judged. | Real latency/cost and missed-preview study. |
| Missing answer | Mock test returns `insufficient_evidence`; long preview miss returns `evaluation_incomplete`. | Real Jev and ambiguous question. |
| Instruction-bearing block | Mock test excludes the high-scoring attack and records trust boundary. | Actual prompt-injection red-team with downstream LLM. |
| Quota | Mock and persistent-store tests prove 10 per UTC day and hash-only records. | SiteGround from multiple clients / proxy behavior. |
| PDF, tables and contradictory sources | Parser/source paths reviewed. | Real fixtures and Jev evaluation; no claim of passing yet. |

There is no destructive SiteGround migration in this audit. Keep the current release until a new artifact passes the production smoke test and the private key is detected. The public status endpoint reported `jev_available: false` at audit time.
