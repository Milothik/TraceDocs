# Product Hunt listing draft · TraceDocs

Schedule for **30 September 2026** after the live Jev smoke test. Product name: **TraceDocs**. Product link: <https://noirway.nite.black/TraceDocs/>. The launch is for Hypership Day; eligibility and featured placement are determined by Product Hunt. All copy below describes the current evidence service, which returns `answer: null` until a calling LLM composes a response.

## Tagline alternatives

1. **Jev finds the evidence. Your agent writes the answer.** (recommended)
2. **Document evidence, selected by Jev and linked to its source.**
3. **Find cited document evidence before your agent answers.**

Avoid “deterministic answer” as a blanket promise: code applies explicit thresholds to Jev scores, but the model's stability and factual accuracy are not guaranteed.

## Short description

Document AI can miss the right passage before the answering model ever sees it. TraceDocs structures a PDF, text file or code project and asks Jev to judge evidence across all blocks for a small document. For larger sources, Jev scans structural previews first and selects groups for full evaluation. Your agent receives cited evidence, coverage and a JSON trace, then can answer from that evidence or abstain.

**Product Hunt description field (under 260 characters):** TraceDocs lets Jev judge structured document blocks before an agent answers. Inspect cited evidence, source locations and a JSON trace. Small sources are evaluated in full; large ones use Jev-led section previews. Free beta: 10 evaluations per IP daily.

## Full description

In a common document pipeline, text is chunked, embeddings or search select a few passages, and an LLM answers from that shortlist. A relevant passage excluded at search time cannot be reconsidered downstream.

TraceDocs keeps structural chunking and makes Jev the evidence judge. Small documents send every block to Jev; larger ones send a preview of every structural group to Jev, then full blocks from Jev-selected groups. Code applies explicit evidence thresholds and returns block IDs, section/page links, scores and a trace. It reports incomplete coverage when the hierarchy cannot support a confident absence claim. The external or calling LLM can write an answer using only selected evidence and verify individual claims. The hosted web app does not generate its own LLM answer.

Try the guided research case or upload an extractable-text PDF, DOCX, Markdown/JSON/text file, or project ZIP. Parsing runs in the browser; the structured text is sent to Jev only when an evaluation is requested. The beta allows 10 Jev evaluations per client IP per UTC day. No accounts, billing or server-side document archive are provided. Document text is untrusted data, and Jev also scores attempted instructions in it; this reduces exposure but is not a guarantee against prompt injection.

## First maker comment

I built TraceDocs because I wanted an agent to know *which part of a document actually supports its answer*. In a conventional retrieval pipeline, the right passage can disappear before the evidence judge sees it. Jev was interesting to me as a structured decision layer: it can score document blocks and let explicit code rules assemble a traceable evidence set.

The current beta evaluates every block for small documents. With larger ones, Jev reviews structural previews and decides which groups receive full-block evaluation. That hierarchy has a real limitation: a preview can miss a relevant detail, and we report incomplete coverage rather than claim certainty. The web app exposes evidence and its source; a connected LLM writes the answer. I would value specific feedback on PDFs, evidence inspection, abstention and the MCP/API contract during Hypership Day. I'll ship changes in response to real reports and share what actually changed.

## FAQ

**How is this different from RAG?** TraceDocs does not let an embedding or keyword retriever veto which blocks Jev can inspect. Small sources are scored in full; large ones use a Jev-led hierarchy with an explicit coverage limit.

**What is Jev?** TypeSafe's structured decision model. Here it scores relevance, answer support, premise contradiction and attempted document instructions for each evaluated block.

**Does TraceDocs hallucinate?** The service does not generate an answer. It can abstain when no block passes its rule or coverage is incomplete. A connected LLM can still make mistakes; citations and claim verification help inspect them.

**Can I upload PDFs?** Yes, PDFs with extractable text. Scanned image PDFs need OCR, which this beta does not provide. Complex tables and reading order may be imperfect.

**Are documents stored?** The browser structures your upload locally, then sends structured text for Jev evaluation when you ask a question. The beta does not create a server-side document archive. The external Jev service receives evaluated text according to its own processing terms.

**Can developers use an API?** `POST /api/evaluate` and an HTTP MCP endpoint return evidence and trace. A future `POST /query` with a generated answer is planned, not active.

**What happens to my files?** File extraction occurs in the browser. The service receives text blocks on evaluation, not the original binary file. Keep highly sensitive material out of the beta until its end-to-end retention and provider policies have been reviewed.

**Does it prevent prompt injection?** It treats document text as untrusted and excludes blocks with high Jev injection scores from the selected evidence. It cannot guarantee detection or control an external agent that ignores the returned trust contract.

## Media plan

- Prepared square thumbnail: `media/thumbnail.png` (240×240). Prepared gallery illustrations: `media/gallery_workflow.png` and `media/gallery_trace.png` (1270×760 each). They explain the workflow and are labelled as illustrations, not fabricated product screenshots.
- Short screen recording: upload or guided case, evaluate, inspect evidence, export JSON; use only a verified live Jev result.
- Screenshot: abstention on an unsupported question and clear quota state.
- No fabricated customer reviews, benchmark numbers, token savings or live answer generation.

Official Hypership announcement: <https://www.producthunt.com/p/producthunt/introducing-hypership-day-build-fast-and-ship-same-day-on-product-hunt>.
