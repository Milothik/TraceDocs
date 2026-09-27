# Changelog

## 27 September 2026 · v0.6.4 live verification

- Connected the private SiteGround configuration to a new TypeSafe key. Real HTTP, MCP and browser Jev evaluations now return cited evidence, abstention and traces. Product Hunt is scheduled for 30 September Hypership.
- Live ambiguous and contradictory cases returned multiple candidate blocks. The answer contract and web copy now tell calling agents to explain conflicting evidence or ask for clarification rather than silently choose. Cross-block conflict detection and multi-section synthesis remain unsupported.
- A prepared summary was falsely flagged as a possible instruction by Jev; scores are treated as fallible. The in-app browser did not expose a downloaded trace file, although WebMCP returned the complete JSON trace.
- Standard `npm test` and `npm run build` now select an available Python 3 executable on Windows and Unix, so launch-day checks run from the documented commands on the maintainer's Windows machine.

## 26 September 2026 · Hypership preparation

- Audited the existing Jev-led hierarchy, browser extraction, PHP/Node adapters, MCP/WebMCP, quota and hosting. Preserved the no-retriever-veto architecture.
- Marked selected evidence and trace as untrusted document data, exposed a narrow answer contract and a count of blocks flagged by Jev for attempted instructions. Added a regression test that excludes a high-scoring instruction-bearing block. This is not a guarantee against prompt injection.
- Added privacy-minimal evaluation metrics and failure events to both server adapters. No raw questions, document text, filenames, IPs or keys are logged by the new metric events.
- Prepared the 30 September operations plan, triage backlog, Product Hunt copy and audit. Inactive features remain explicitly inactive.
- Local checks: 13 mocked integration/unit tests pass, including two-section, ambiguous/contradicted-premise and 1,200-block scenarios; Worker builds and validates. PHP CLI is not installed in the local runtime; live Jev remains unverified until the SiteGround key is recognized.

## Earlier beta

- Replaced lexical top-k preselection with Jev scoring of all small-document blocks and Jev-led structural previews for larger sources.
- Added source-linked evidence, abstention, JSON trace, WebMCP/HTTP MCP and 10 evaluations per IP per UTC day.
