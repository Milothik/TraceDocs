# Changelog

## 26 September 2026 · Hypership preparation

- Audited the existing Jev-led hierarchy, browser extraction, PHP/Node adapters, MCP/WebMCP, quota and hosting. Preserved the no-retriever-veto architecture.
- Marked selected evidence and trace as untrusted document data, exposed a narrow answer contract and a count of blocks flagged by Jev for attempted instructions. Added a regression test that excludes a high-scoring instruction-bearing block. This is not a guarantee against prompt injection.
- Added privacy-minimal evaluation metrics and failure events to both server adapters. No raw questions, document text, filenames, IPs or keys are logged by the new metric events.
- Prepared the 30 September operations plan, triage backlog, Product Hunt copy and audit. Inactive features remain explicitly inactive.
- Local checks: 11 mocked integration/unit tests pass; Worker builds and validates. PHP CLI is not installed in the local runtime; live Jev remains unverified until the SiteGround key is recognized.

## Earlier beta

- Replaced lexical top-k preselection with Jev scoring of all small-document blocks and Jev-led structural previews for larger sources.
- Added source-linked evidence, abstention, JSON trace, WebMCP/HTTP MCP and 10 evaluations per IP per UTC day.
