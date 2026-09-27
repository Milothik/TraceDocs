# TraceDocs × Jev

TraceDocs is a document evidence tool for language model agents. It structures a document into source-linked blocks, lets TypeSafe Jev judge evidence, and returns a cited evidence set with a trace. The calling LLM writes the answer and can use `verify_claim` to check individual claims against cited blocks. TraceDocs does not fabricate an answer when evidence is absent or evaluation coverage is incomplete.

## Evidence flow

1. Open the prepared research case or upload PDF, DOCX, Markdown, JSON, text, source code, or a ZIP project. Parsing and structural indexing take place in the browser. The block IDs retain section, location and page where available.
2. Ask a question. No lexical, vector or keyword retriever filters the blocks before Jev.
3. With 24 or fewer blocks, Jev receives every block. Larger documents are split into contiguous structural groups of at most 12 blocks. Jev judges a preview from **every** group, then receives every full block in the groups whose Jev signals pass a permissive discovery gate. Each preview includes up to 225 characters from every member block. This is a Jev-led hierarchy; it can still miss evidence outside the previews. When no group passes, or the 120-call budget cannot cover selected blocks, the result is `evaluation_incomplete`, never a false claim of exhaustive absence.
4. Full-block Jev signals produce evidence objects with document ID, block ID, section, location, page, scores and source text. An illustrative rule can return `supported` or `insufficient_evidence`; it is not a calibrated truth guarantee. Each result includes coverage and per-block trace information.
5. The calling LLM can compose a cited answer. It must explain conflicting selected evidence or ask for clarification on an ambiguous question rather than silently choose one answer; TraceDocs does not resolve cross-block conflicts. `verify_claim` judges a proposed claim against one selected block and records its link in the trace. The web app shows the evidence set and exports JSON; it does not have a bundled answer-generation model.

An upload can contain at most 1,200 blocks and 1.5 million text characters per evaluation, with a 1.8 MB request limit. PDF text lines are deterministically grouped into page-linked blocks of up to eight lines or about 900 characters. The browser reports oversized sources before evaluation and keeps their block preview available for inspection; it does not submit them to Jev. A very large or expensive document may require a smaller source or an increased deployment budget. Metrics include blocks inspected, full blocks evaluated, Jev calls, evidence blocks selected and latency. Estimated cost remains unavailable until real price or usage data are configured; the UI does not present a fabricated amount.

## Interfaces

The browser registers WebMCP tools when `document.modelContext` is available: `inspect_document`, `evaluate_document_evidence`, `get_evidence`, `get_trace`, `verify_claim`, and a compatibility alias `search_document_evidence` that returns an unfiltered manifest. The HTTP JSON-RPC endpoint `POST /mcp` implements initialization, tool listing and calls:

| Tool | Behavior |
| --- | --- |
| `inspect_document` | Returns all blocks in the prepared case, without Jev or retrieval. |
| `evaluate_document_evidence` | Jev judges the entire prepared case; returns evidence and trace. |
| `verify_claim` | Jev checks a proposed claim against a supplied evidence block. |
| `search_case_evidence` | Compatibility alias for unfiltered case inspection. |
| `evaluate_case_evidence` | Compatibility alias for case-wide Jev evaluation. |
| `evaluate_supplied_passages` | Jev evaluates every supplied block, or uses its structural hierarchy for larger input. |

The prepared case has 12 English summaries linked to Liu et al., *Lost in the Middle*, TACL 2024: <https://aclanthology.org/2024.tacl-1.9.pdf>. It is a guided demo, not a verbatim article or a blind benchmark. An unsupported premise question demonstrates abstention. External MCP clients and browser tool support must be checked independently.

## Daily beta usage

Ten Jev evaluations are available per client IP per UTC day, shared across the browser and HTTP MCP evaluation tools. One evaluation request counts once even when the hierarchy makes several Jev calls. The limit resets at 00:00 UTC. Document inspection does not consume the quota. The Node adapter serializes updates in a private JSON file, stores a SHA-256 IP hash with UTC date and usage count, and removes old days on writes. It never writes raw IPs. People behind a shared public IP share the allowance; IP changes yield a new allowance. The hosting proxy's forwarding rules need validation to prevent IP spoofing. There is no email collection, subscription or payment flow.

The SiteGround PHP adapter (`siteground/backend.php`) uses `REMOTE_ADDR`, an exclusive file lock and the same dated hash records in a directory outside `public_html`. SiteGround needs PHP with cURL and mbstring. Configure `TYPESAFE_API_KEY` as a server environment variable or return `['typesafe_api_key' => '…']` from `tracedocs-private/config.php` outside the web root; never put a key in this repository or the browser bundle. Its `.htaccess` routes `/TraceDocs/api/status`, `/TraceDocs/api/evaluate` and `/TraceDocs/mcp` to the adapter. On hosts that serve `.mjs` without a JavaScript MIME type, publish the `.js` copies of `project_index`, `pdf.min` and `pdf.worker.min`; the web app imports those copies.

## Run locally

Requires Node.js 20 or newer and Python 3.

```sh
npm run build
npm run validate
npm test
npm start
```

The browser app is served at `/TraceDocs/` by default. Set `TRACEDOCS_BASE_PATH` to change the path. Keep `TYPESAFE_API_KEY` only in server environment variables for actual Jev calls. Set `TRACEDOCS_DATA_FILE` to a persistent, private path on hosting that replaces deployment directories. The Worker artifact is `dist/server/index.js`; private site hosting metadata is optional during local builds. The repository includes a source-only demo and no production key or live site URL.

## Document trust and Hypership Day

Uploaded text is untrusted data. Jev scores whether a block attempts to instruct the answering system, and blocks at or above the configured threshold are excluded from the evidence set. Evidence objects retain `source_trust: untrusted_document`; the trace tells a calling LLM to use document text as data, cite selected block IDs and abstain on absent evidence or incomplete coverage. This reduces exposure to prompt injection but cannot guarantee prevention or control an external agent. No raw document text, query, filename, IP or key is written by the aggregate server metric events.

The active interface supports block-level source inspection and JSON trace export, with visible JSON and copy controls if browser downloads are unavailable. Exact fragment highlighting, multi-document comparison, query history, a generated-answer `POST /query` endpoint and an in-app answer model are **not active**. Do not advertise them as shipped. The Product Hunt copy and FAQ are in `PRODUCT_HUNT_COPY.md`; event operations and candidate work are in `HYPERSHIP_DAY_PLAN.md` and `HYPERSHIP_BACKLOG.md`. See `docs/HYPERSHIP_AUDIT.md` for the technical limits, including PDF parsing and serial Jev calls; current live checks are recorded in `docs/VERIFICATION_REPORT.md`.

## Verification limits

Tests mock the Jev response and prove the unfiltered small-document path, Jev-led hierarchy, abstention and incomplete coverage, shared daily quota, reset, persisted hash records and claim linkage. They do not measure Jev accuracy, real token savings, billable cost, production IP forwarding or external model-client interoperability. Review `docs/VERIFICATION_REPORT.md` for commands and results.
