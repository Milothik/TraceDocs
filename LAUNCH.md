# TraceDocs × Jev · Product Hunt launch handoff

**Scheduled:** 30 September 2026, 12:01 a.m. PDT (09:01 Europe/Madrid). Product Hunt controls the actual publication and featuring.

**Live product:** <https://noirway.nite.black/TraceDocs/> · v0.6.9 on SiteGround.

**Scheduled listing:** <https://www.producthunt.com/products/tracedocs?launch=tracedocs>.

The SiteGround key is held in private configuration outside the web root. The immediate v0.6.8 rollback is preserved at `tracedocs-release-archive/TraceDocs-v068-20260928`; v0.6.6 remains archived as an older fallback. A former v0.6.7 public preview was archived before launch; it is no longer a second public entry point. The active beta limit is ten Jev evaluations per IP per UTC day.

Local release ZIPs v0.6.4–v0.6.9 and the PDF smoke fixture are at `D:\TraceDocs-launch-backups`; the v0.6.9 ZIP is also uploaded in SiteGround's domain root. C: currently reports 0 free bytes. The launch working copy is `D:\TraceDocs-launch-backups\TraceDocs-launch-checklist-work`. The v0.6.9 source at `095f254` passed all 15 tests, build and artifact validation when `TEMP`, `TMP` and npm's cache were directed to D:. Later commits contain documentation updates only. Use that copy for event-time code changes and keep release artifacts on D:.

The current listing copy, FAQ and maker comment are in [PRODUCT_HUNT_COPY.md](PRODUCT_HUNT_COPY.md). Follow [HYPERSHIP_DAY_PLAN.md](HYPERSHIP_DAY_PLAN.md) for the go/no-go gate, event schedule and rollback steps. [docs/VERIFICATION_REPORT.md](docs/VERIFICATION_REPORT.md) distinguishes verified production behavior from remaining checks. [HYPERSHIP_BACKLOG.md](HYPERSHIP_BACKLOG.md) is a candidate-work menu; ship only in response to reproducible feedback.

**Open gates as of 28 September:** confirm the maker account age and any related launches within the event/relaunch windows; verify JSON file saving in an ordinary browser; run the mobile check; and check host-specific setup if an intended MCP app is identified. The in-app browser ignored a 390×844 viewport override and remained 1280×720, so mobile behavior is unverified. PDF and ZIP imports were smoke-tested in the public v0.6.9 page without using a Jev evaluation; the ZIP correctly showed the 1,200-block limit, and the quota remained at 3/10. The real supported and abstention results already cover the v0.6.9 PHP adapter, whose release version is the only difference in the compared adapters; do not repeat Jev evaluations unless code or configuration changes. See [the verification report](docs/VERIFICATION_REPORT.md). The official TypeScript MCP client 2.1.0 has already negotiated with the live endpoint, listed all six tools and read the 12-block case. Product Hunt featuring cannot be assumed from a scheduled listing. Recheck web, Jev status, quota, trace and Product Hunt at launch time.
