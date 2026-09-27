# TraceDocs v0.6 Verification Report

**Review date:** 26 September 2026
**Scope:** Jev-led document evidence discovery, HTTP and MCP contracts, daily quota, and deployment readiness.

## Result

The source builds and validates as an ESM Worker artifact. All ten automated tests pass. A local HTTP adapter check, with a mocked Jev response and a temporary quota file, exercised the page, status, full small-document evaluation, MCP claim verification and persisted IP hash. On SiteGround the new page, JavaScript module dependencies and PHP status endpoint responded successfully. The browser opened the prepared case and registered the WebMCP tools. The production evaluation endpoint returned `503 Jev is not configured` for a valid request and did not consume quota. No real Jev call, external MCP client, or production rate-limit behavior has been verified.

## Workflow and source handling

1. Browser parsing turns the prepared research case or an uploaded PDF, DOCX, text, JSON, source file or ZIP into numbered blocks. Blocks preserve section, location and page where extractable. A scanned PDF needs OCR.
2. Questions do not invoke a lexical or vector prefilter. For at most 24 blocks, Jev judges every full block. For larger sources, every contiguous group of at most 12 blocks contributes a structural preview to Jev. Jev selects groups for full-block evaluation. No keyword retriever decides which groups Jev sees.
3. Every selected full-block score is linked to a document, block, section, paragraph/location and page. The visible support thresholds are illustrative. Results are `supported`, `insufficient_evidence`, or `evaluation_incomplete`; the latter never supplies an answer or evidence set.
4. The browser exposes the evidence and exports the JSON trace. The calling LLM can write a cited answer; this deployment does not include an answer-generation model. `verify_claim` checks one proposed claim against a cited block and records the link in the trace.
5. One evaluation request counts as one of ten per IP per UTC day, regardless of its internal Jev call count. Local document inspection does not consume the allowance. Usage is stored server-side as a dated SHA-256 IP hash and count; old dates are removed on a new write.

## Verification matrix

| Check | Method | Result |
| --- | --- | --- |
| Worker and distribution build | `python3 tools/build_worker.py`, `npm run build` | Pass; thirteen embedded assets. |
| Artifact validation | `npm run validate` | Pass; valid ESM with `default.fetch`. |
| Automated tests | `npm test` | 10 passed, 0 failed. |
| No lexical veto | Synthetic four-block source with answer wording absent from question | All four blocks reached Jev; answer block selected. |
| Hierarchical coverage | Synthetic 30-block source with evidence in second group | Three previews reached Jev; all 12 full blocks in the selected group were scored. |
| Abstention and incomplete coverage | Mocked no-support small and large sources | Small source abstains; large missed-preview case returns incomplete. |
| Daily quota | Browser API plus MCP calls, fake UTC clock | Tenth succeeds, eleventh blocked; next UTC day resets. |
| Persistent quota | Concurrent reservations against a temporary file | Exactly ten allowed; dated hash persisted; raw IP absent. |
| Claim linkage | MCP `verify_claim` with a cited block | Supported claim linked to the block in the trace. |
| Local HTTP adapter | Temporary server with mocked Jev | Page and status 200; all small-document blocks judged; MCP claim check; quota count 2 and hashed persistence. |
| ZIP ingestion | Synthetic archive with two source files and credential-like files | Source files indexed; `.env` and credential-named file excluded. |
| Live SiteGround frontend | Public page and module resource checks; open prepared case in browser | 200 page and JavaScript MIME for `.js` dependencies; 12-block demo loads; WebMCP tool registrations observed. |
| Live PHP status | GET `/TraceDocs/api/status` | 200; key unavailable; 0/10 quota; UTC reset timestamp. |
| Live PHP evaluation without key | POST one valid synthetic block | 503 `Jev is not configured`; no false evaluation result. |
| Patch formatting | `git diff --check` | Pass. |

## Limits and observations

- The structural preview contains up to 225 characters from each block. A relevant fact beyond that preview can be missed at group selection. If no group passes, TraceDocs reports `evaluation_incomplete`; when a group passes, evidence in another low-scoring group might still be missed. The trace exposes each group and the count of full blocks scored.
- A request accepts at most 1,200 blocks, 1.5 million text characters, 1.8 MB, and 120 Jev calls. Large selected coverage beyond that budget returns `evaluation_incomplete` rather than a fabricated answer.
- `estimated_cost` is `null` until price or billable-unit telemetry is provided. Jev accuracy, token savings, real latency, and per-request charges are not established by mocked tests.
- The Node adapter selects a client address from reverse-proxy headers. Confirm trusted forwarding and the persistence path on the actual host before treating the ten-per-day rule as a reliable public control. Shared public IPs share the allowance.
- Browser WebMCP requires `document.modelContext`; the public browser registered six tools. HTTP MCP is implemented, but interoperability with external clients remains untested. No real Jev response was available during this verification.
- SiteGround served `.mjs` resources without a JavaScript MIME type; the published frontend uses equivalent `.js` copies and its browser behavior was retested. The production PHP adapter was exercised for status and missing-key rejection, but its Jev path, locking under concurrency and complete JSON-RPC transport remain untested on that server.
- The research case contains twelve prepared English summaries linked to Liu et al., *Lost in the Middle*, TACL 2024. This is a guided demonstration, not a blind benchmark or the full paper text.
- The current SiteGround PHP process reports no TypeSafe key. Real evidence evaluation stays unavailable until a private server-side credential is configured; do not advertise the demo as fully operational before a real evaluation and trace are verified.

## Reproduction

```sh
python3 tools/build_worker.py
npm run build
npm run validate
npm test
npm start
```

Node.js 20+ and Python 3 are required for the Node build. Configure `TYPESAFE_API_KEY` only on the server for real evaluations and `TRACEDOCS_DATA_FILE` on durable private storage for the Node adapter. SiteGround uses the PHP adapter and a private quota directory. The live Jev call, external MCP connection and public beta quota need explicit acceptance checks after the key is installed.

## 27 September deployment update

- The SiteGround release is live at `https://noirway.nite.black/TraceDocs/`. The former `TraceDocs` directory and a separate ZIP backup are stored outside the web root in `tracedocs-release-archive`; the archived directory was checked for its `index.html`, `backend.php`, `.htaccess`, `app.js` and `vendor` files. The live index loads `app.js?v=0.6.3` with a JavaScript MIME type.
- A real 2.6 MB text PDF from the cited paper produced 1,313 line blocks before the fix and 174 page-and-line-linked blocks after deterministic grouping. A 13-file source ZIP produced 1,720 blocks; the UI now displays the 1,200-block limit before an evaluation request. Both files were parsed locally in the live browser. This does not prove Jev evaluation of either document.
- The PHP status endpoint returned HTTP 200 with `jev_available: false`, 0/10 usage and a UTC reset timestamp. The private config file exists, but its key field is empty. HTTP MCP `initialize`, `tools/list` and read-only `inspect_document` succeeded with `curl`: protocol `2025-03-26`, server version `0.6.3`, six tool definitions and all 12 prepared blocks. One PowerShell `Invoke-RestMethod` call received SiteGround 403, so client User-Agent compatibility remains to be checked.
- The Worker built, `node --check public_src/app.js` passed, and all 13 automated tests passed. The Product Hunt listing is an unscheduled, editable draft with three tags, two gallery images, a thumbnail, maker information and an opening comment. Its date picker offers 30 September.
- Still required for a go decision: configure a private TypeSafe key, prove supported evidence and unsupported abstention with real Jev responses, inspect/export a live trace, check quota and PHP MCP behavior, then schedule the listing for 30 September if those checks pass.

## 27 September live Jev and launch update

- A new organization-scoped TypeSafe key is stored only in SiteGround's `tracedocs-private/config.php`, outside `public_html`. The first key created during setup did not expose its one-time secret and was deactivated; the configured key remains active. The public status endpoint reports `jev_available: true`. A direct request for `/tracedocs-private/config.php` returns 404.
- A real PHP `/api/evaluate` call with a one-block fact about Paris returned `supported`, cited that block, and reported one Jev call. The same block queried about Atlantis returned `insufficient_evidence`, `decision: abstain`, zero evidence, and a `tracedocs.trace.v4` record with one block score. PHP MCP `evaluate_supplied_passages` returned supported structured content and the same trace schema. These three calls moved shared IP usage from 0 to 3 of 10.
- The live browser evaluated all 12 prepared research-case blocks for question Q01 and selected c01, with its PDF page reference and an evidence score. WebMCP `get_trace` returned all 12 block scores, the selected evidence, coverage metrics and the answer contract. The browser status and HTTP status later showed 6 of 10 used, confirming shared quota across the API, MCP and UI. Two extra UI evaluations occurred during attempts to download the trace; the download did not surface a file or a browser download event in the in-app browser. The browser's JSON download remains unverified; do not claim that particular action passed.
- Jev marked c07 (`The model should return the matching value`) as possible prompt injection at 0.42 for Q01, despite its being a benign summary of the source task. The trace exposes the score and the selected answer c01 was unaffected. Treat instruction flags as fallible; the warning in the UI should not be interpreted as proof of an attack.
- Product Hunt shows the launch as scheduled for Hypership on 30 September 2026 at 12:01 a.m. PT (09:01 CEST). The listing URL is `https://www.producthunt.com/products/tracedocs?launch=tracedocs`; the pre-launch dashboard shows the countdown. The schedule may be changed before launch. Recheck site status and the trace download in an ordinary browser during the final 29 September go/no-go review.
- Additional live stress cases: an ambiguous question about two differently named projects returned both candidate blocks; contradictory dates for the same project also returned both candidate blocks. A question requiring facts from two separate short blocks returned `insufficient_evidence` because neither block alone passed the evidence rule. All three responses included per-block scores. Usage advanced from 6 to 9 of 10; the allowance resets at 00:00 UTC. TraceDocs does not synthesize across blocks or automatically reconcile conflicts. Version 0.6.4 strengthens the answer contract and visible copy so the calling agent must surface conflict or ambiguity rather than choose silently.
- Version 0.6.4 is deployed at the public `/TraceDocs/` path. The extracted 15-entry release was checked for `.htaccess`, `backend.php`, `app.js`, `index.html` and vendor assets before activation. Its provisional URL returned HTTP 200, `jev_available: true`, MCP server version 0.6.4 and the updated script reference. After activation, the public URL returned the same status and version with 9/10 usage. The former live directory is archived outside the web root as `tracedocs-release-archive/TraceDocs-v063-20260927`. No post-0.6.4 Jev evaluation was made, preserving the last daily allowance for the user; the updated trace text is therefore verified by source review and local tests, not a fresh production result.
- TypeSafe Usage filtered to `TraceDocs Launch Config 2026-09-27` showed 45 requests, 23,628 tokens and estimated spend of $0.0008 for the newly created key. The console warns that stats may be delayed and lists $0.042 per million input tokens with free output. This is account telemetry for the test traffic, not a calibrated per-query cost, and the app continues to report `estimated_cost: null`. The live 12-block prepared-case evaluation took about 3.2–3.4 seconds; single-block calls were under a second in the observed responses.
