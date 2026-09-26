# Product Hunt launch draft · 30 September 2026

## Listing copy

**Name:** TraceDocs × Jev

**Tagline:** Jev discovers cited evidence across structured documents

**Pricing:** Free beta. Ten Jev evaluations per IP per UTC day.

**Short description:** TraceDocs structures a document, lets Jev judge its evidence, and gives AI agents a cited evidence set and verifiable trace. Try a research case or upload your own PDF or project ZIP.

**First comment / maker story:**

I built TraceDocs to give document evidence a clear role in an agent's workflow. A conventional search index can miss the passage that matters before a model ever sees it. TraceDocs structures the source, asks Jev to judge every block in a small document, and uses Jev to choose which sections of a larger source deserve full block evaluation. It returns cited evidence, coverage metrics and a JSON trace. The calling LLM can produce an answer from those references or abstain when the evidence is insufficient.

The guided case uses prepared summaries linked to the 2024 *Lost in the Middle* paper. Each IP can run ten Jev evaluations per UTC day during beta. Structural previews and uncalibrated thresholds still have limits; I am not claiming measured accuracy or token savings. I would value feedback on coverage, citations and the agent tool contract.

## Launch media and checks

- Record question → structured document → Jev section scan → evidence set → cited agent answer → trace.
- Use scores captured from a real Jev run, with the original source open for inspection.
- Verify the public product path, server key, the ten-per-day quota, proxy client-IP headers and persistent usage storage.
- Check a real Jev evaluation, an unsupported question, a large-document incomplete result, mobile layout and the exported JSON trace.
- Test WebMCP in a supported browser and the HTTP MCP endpoint with an external client before claiming universal model access.
- Submit or schedule the Product Hunt listing from the owner's account. This draft is not a submission.

**Official event post:** https://www.producthunt.com/p/producthunt/introducing-hypership-day-build-fast-and-ship-same-day-on-product-hunt
