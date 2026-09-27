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

- The SiteGround release is live at `https://noirway.nite.black/TraceDocs/`. The former `TraceDocs` directory was retained as `TraceDocs-prelaunch-20260926`, and a separate ZIP backup is in `public_html`. The live index loads `app.js?v=0.6.3` with a JavaScript MIME type.
- A real 2.6 MB text PDF from the cited paper produced 1,313 line blocks before the fix and 174 page-and-line-linked blocks after deterministic grouping. A 13-file source ZIP produced 1,720 blocks; the UI now displays the 1,200-block limit before an evaluation request. Both files were parsed locally in the live browser. This does not prove Jev evaluation of either document.
- The PHP status endpoint returned HTTP 200 with `jev_available: false`, 0/10 usage and a UTC reset timestamp. The private config file exists, but its key field is empty. HTTP MCP `tools/list` returned six tool definitions with `curl`; one PowerShell `Invoke-RestMethod` call received SiteGround 403, so client User-Agent compatibility remains to be checked.
- The Worker built, `node --check public_src/app.js` passed, and all 13 automated tests passed. The Product Hunt listing is an unscheduled, editable draft with three tags, two gallery images, a thumbnail, maker information and an opening comment. Its date picker offers 30 September.
- Still required for a go decision: configure a private TypeSafe key, prove supported evidence and unsupported abstention with real Jev responses, inspect/export a live trace, check quota and PHP MCP behavior, then schedule the listing for 30 September if those checks pass.
