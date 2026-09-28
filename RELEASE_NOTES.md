# Release Notes — Event ID Field Guide

## v2.0 — September 28, 2026 (current)

A layout and navigation pass — the first release to reorganize how the guide is browsed, not just what it covers.

- **The word cloud now comes before the Event ID collection**, and it's a real filter, not just a search shortcut: click any word and the table right below it updates to show only the Event IDs matching that keyword — same underlying search engine as the search box, just entered from the vocabulary itself.
- **Trimmed the top bar to three icons** — About, Release Notes and Settings — replacing both the old text-label buttons and the in-page "Explore / Field Notes / Attack Playbook" anchor links, which added clutter without adding navigation most people used. Each is now a small inline-SVG icon button (an info circle, a document, and a gear) with a hover tooltip and an accessible label, instead of a text link.
- **Added a "Customize your own Windows audit policy" section to About**, linking out to Microsoft's own *Advanced security audit policy settings* reference — a reminder that this guide documents what an Event ID means once logged, not how to turn its logging on, and a pointer to where to actually do that (Group Policy / `auditpol.exe`).
- Bumped to **2.0** to mark this as a structural/navigation change rather than an additive feature — nothing about the underlying data or its scope changed in this release.

## v1.7 — September 28, 2026

- Added **Docker support**: a `Dockerfile` (nginx:alpine serving the self-contained `index.html`, with gzip, a few standard security headers, and a container healthcheck) and a `docker-compose.yml`, both built and test-run successfully (`docker compose up -d` → healthy container serving the app with gzip active) before being handed off.
- The compose file's host binding is configurable via `HOST_IP` / `HOST_PORT` environment variables (see `.env.example`) — set to the same values as the **Interface IP** / **Port** fields in the app's own ⚙ Settings panel, so the Access URL Settings shows you is the address Docker actually serves.
- The Settings panel's **Launch command** now offers both options side by side: a ready-to-copy `HOST_IP=... HOST_PORT=... docker compose up -d` (recommended) and the existing `python3 -m http.server` one-liner for a quick test without Docker.

## v1.6 — September 28, 2026

- Added **Export** — "⬇ CSV" and "⬇ TXT" buttons above the results table, next to the results count. Export is scoped to exactly what's currently on screen: whatever combination of search, habitat, threat-level, family-chart-click and "real examples only" filters is active, only those rows are written to the file (e.g. filter down to 10 specimens, export exactly those 10).
- Added a **Settings** panel (⚙ Settings, next to About and Release Notes) for local network deployment: enter the interface IP and port you plan to host this app at, and it remembers them (per browser), shows the resulting Access URL, and gives you a ready-to-copy launch command (`python3 -m http.server <port> --bind <ip>`) to actually serve the file there. Once set, a small banner on the main page shows the configured Access URL to anyone using that browser.
- Worth noting honestly: this is a self-contained page with no server of its own, so Settings can't make the page itself start listening on a network interface — that still requires running the generated command (or your own web server) on the machine you want to host it from. Settings just remembers the address and generates that command for you.

## v1.5 — September 12, 2026

- Reworked the **search engine**: search by Windows Event ID number (e.g. `4625`) or by any keyword (e.g. `powershell`, `privileges`) — matches across the ID, summary, category, subcategory, full field-notes text, log source and attack-playbook tags, with matched terms **highlighted** directly in the results table.
- The results count now reads **"N results for '\<query\>'"** while a search is active, so it's always clear the table reflects the current search.
- Added a **"Remove Search Filter"** button (plus an inline ✕ inside the search box) that clears just the search term — the log/severity/family filter chips you already had active stay exactly as they were. The broader "Clear all filters" button still resets everything at once.

## v1.4 — September 12, 2026

- Added **real-world log examples**: researched Fortinet's FortiSIEM "Sample Windows Agent Logs" documentation (https://docs.fortinet.com/document/fortisiem/7.6.0/user-guide/229261/sample-windows-agent-logs) and linked genuine, field-captured log lines to Event IDs already in the guide, marked with a 🧾 "verified capture" badge — Security **4703** & **4798**, System **7036**, Application **16384**, PowerShell **600** & **403**, and Sysmon **1** & **13**.
- Added two new Event IDs discovered via that research that weren't yet catalogued: PowerShell **600** (Provider Lifecycle) and **403** (Engine Lifecycle — Stopped), plus Application **16384** (Security-SPP).
- Added a **"🧾 Real examples only"** filter chip and a small 🧾 marker next to the ID in the table.
- The **About** panel now explicitly states the guide's scope — **Windows Auditing (Security) Logs and Sysmon Logs** at its core, with supporting System/Application/PowerShell coverage — and explains the real-world-example feature.
- Total catalogue grows from 459 to **462 specimens**.

## v1.3 — September 12, 2026

- Added a **Windows version coverage** section to the About panel — which Windows / Windows Server release each part of the catalogue requires, from the Vista/Server 2008 Security-auditing baseline through Windows 11/Server 2022, plus Sysmon and PowerShell-Operational (which are version-dependent rather than OS-specific).
- Added an OS-coverage banner to the **main page**, under the stat tiles — click it to open the full breakdown in About.
- The About panel now also explains what's explicitly **out of scope**: the legacy pre-Vista Event ID numbering used on Windows 2000, XP and Server 2003.

## v1.2 — September 12, 2026

- Completed the **Sysmon** habitat: added all 21 previously-missing Sysmon-Operational event IDs (2, 4, 5, 6, 9, 12, 14, 15, 16, 17, 18, 19, 20, 21, 23, 24, 25, 26, 27, 28, 29, 255) — including **28 "File Block Shredding"**, flagged as missing during review — bringing Sysmon coverage from 8 to the full 30 documented event types.
- Added Security Event ID **1102** ("The audit log was cleared") — generated by the Eventlog service itself rather than the audit-subcategory subsystem, so it wasn't in the source spreadsheet, but it's one of the highest-value log-tampering indicators in the whole Security log.
- Expanded the Attack Playbook with all the newly-added IDs (WMI persistence, named-pipe C2, process tampering, timestomping, file-block events, and more).
- Total catalogue grows from 436 to **459 specimens**.

## v1.1 — September 12, 2026

- Added an in-app **Release Notes** viewer (this document, rendered in the app).
- Added an **About** panel — the application's objective, the full technology stack, and every research source used to compile the Windows Event ID data.
- Minor copy and credit updates.

## v1.0 — September 12, 2026

- Initial release: **436 Event ID specimens** — 407 from the Security-log audit taxonomy (Microsoft's official Security Auditing spreadsheet), plus 29 curated System, Application, PowerShell-Operational and Sysmon events.
- Interactive **population-by-family**, **threat-level** and **habitat** charts, click-to-filter.
- Live **search** plus log-source and severity **filter chips**.
- A sortable specimen **table** with color-coded family and severity badges.
- A **word cloud** of Windows-auditing vocabulary — click a word to search it.
- The **Attack Playbook** — 15 offensive techniques (brute force, Kerberoasting, DCSync, PowerShell abuse, persistence, log tampering, and more) mapped to the Event IDs that reveal them.
- A per-event **detail panel**: full field-by-field description, a synthesized realistic Event Viewer–style log example, related attack tags, minimum supported OS, and an outbound "Learn more" link.
- Full **light / dark theme** support.

---

Built by Claude AI (Anthropic) from an idea and direction by Rafael Righi — rrighi@fortinet.com.
