# Hypership Day operations · 30 September 2026

Time zone: Europe/Madrid (CEST). Product Hunt's daily cycle begins at midnight Pacific time, 09:00 CEST in September. Confirm the scheduled launch time in the Product Hunt UI before the event. Hypership Day asks makers to ship in response to real, actionable feedback; do not invent feedback or ship a feature merely to create activity.

## Go/no-go by 29 September

- Public URL and mobile flow load; TypeSafe key is detected on the server; one real Jev evaluation returns block evidence and a trace. Run an unsupported question and confirm abstention. Do not promote a mock result as a live result.
- Verify 10 evaluations per IP per UTC day, including MCP and the web UI. Confirm quota storage survives a deployment. Check that no API key or private file is publicly accessible.
- Verify PDF and ZIP upload, JSON trace download, and SiteGround PHP routes. Rehearse a rollback using the archived release. Check real Jev latency and credits without claiming an estimated cost that is unavailable.
- Prepare Product Hunt listing, media, maker comment, FAQ and the correct 30 September schedule. Check eligibility: no launch in the prior three months. Featured status is controlled by Product Hunt.

## Launch day

| CEST | Action | Decision gate |
| --- | --- | --- |
| 08:30–09:00 | Final smoke test, backup release, confirm Product Hunt schedule and support availability. | Stop if Jev or trace is broken. |
| 09:00 | Launch goes live if scheduled; post the prepared maker comment. | Verify live listing and product URL. |
| 09:00–11:00 | Watch failures, quota, latency, browser uploads and authentic feedback. | P0: fix or roll back immediately. |
| 11:00 | Triage feedback using `HYPERSHIP_BACKLOG.md`; reproduce before coding. | Pick one P1 or small P2 item, if justified. |
| 11:00–14:00 | Implement, test and stage first change. | Preserve Jev-first evidence and abstention. |
| 14:00 | Deploy if tests and smoke check pass; update Product Hunt with a factual change note. | Otherwise keep the stable release. |
| 14:00–18:00 | Second observation and iteration cycle. | Prioritize verified friction over feature count. |
| 18:00 | Optional second deploy and factual update. | Skip if no worthwhile validated change. |
| 18:00–22:00 | Monitor and respond to comments; record requests with links and timestamps. | No fabricated user stories or performance claims. |
| 22:00–09:00 next day | Maintain coverage where possible; preserve logs and rollback path. | Escalate P0, otherwise queue work. |

If feedback is sparse, use reproducible bugs, UX observations, and aggregate telemetry. A no-change update is preferable to shipping a speculative feature. Product Hunt's day and the Jev quota use different clocks: launch follows Pacific midnight; the quota resets at 00:00 UTC.

## Release procedure

1. Record the user report or observation, category, priority, reproducible steps and expected outcome. Remove document contents and personal data from tickets.
2. Make one isolated change, run `npm test && npm run build && npm run validate`, and check the PHP adapter separately where PHP is available.
3. Deploy only TraceDocs files within `public_html/TraceDocs/`; keep `tracedocs-private/config.php` outside the web root untouched. Do not modify other SiteGround sites or projects.
4. Smoke test `/TraceDocs/`, `/TraceDocs/api/status`, one supported and one unsupported evaluation if the daily test budget allows, trace export, and MCP tools.
5. If broken, rename the active `public_html/TraceDocs` directory to a dated failed-release name, move `tracedocs-release-archive/TraceDocs-prelaunch-20260926` back under `public_html`, rename it `TraceDocs`, and smoke test the public URL and status endpoint. The archive also holds a ZIP backup. Record the incident and its effect. Publish a Product Hunt update only when the change is live and verified.

## What to avoid during the 24 hours

- No new retriever with veto power before Jev, no schema rewrite or bulk migration, no untested provider change.
- No production key rotation, payment system, account system, or public document retention without a dedicated review.
- No claims of guaranteed prompt-injection prevention, calibrated scores, zero hallucinations, exact token savings, or an in-app LLM answer when those are unmeasured or absent.

Official event announcement: <https://www.producthunt.com/p/producthunt/introducing-hypership-day-build-fast-and-ship-same-day-on-product-hunt>.
