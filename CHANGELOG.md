# Changelog — splatnet

Note: the early history below is the upstream project (Pretendo Splatoon-Website);
OpenPak work starts at the port/fork commit.

## v0.3.1 — 2026-11-01

- The site's only address is splat.openpak.org (was opensplat.openpak.org): sign-in redirect origin and docs
- Footer: "Part of the OpenPak network", linking to openpak.org

## v0.3.0 — 2026-11-01

- Sign-in through openpak.org single sign-on (`/auth/login`, `/auth/callback`, `/auth/logout`; state and PKCE, server-side code exchange). The top bar has the same Sign in button and account chip as openpak.org; the site has no sign-in form
- Friends tab for a signed-in player, from the Wii U PID the account carries; an account with no Wii U linked is told so, with a link to openpak.org
- Removed the upstream access-token sign-in and its profile and tag-theme endpoints. Tag themes are not offered
- New: `SSO_CLIENT_OPENSPLAT_SECRET`, `PN_SPLATOON_WEBSITE_SSO_URL`, `PN_SPLATOON_WEBSITE_SSO_SESSION_KEY`; `npm test`

## v0.2.5 — 2026-11-01

- Same layout as every Open site: the top bar lists only OpenSplat's pages (Rotations, Splatfest); the footer has OpenPak, OpenSplat, Project and Legal columns

## v0.2.4 — 2026-11-01

- Top bar and footer show only the OpenSplat mark and name (no OpenPak logo or "OpenPak /" prefix)

## v0.1.2 — 2026-11-01

- No "not available yet" note for friends and tag themes; the empty-rotation hint drops the BOSS jargon

## v0.1.1 — 2026-11-01

- The "no rotation yet" notices span the page width like the rest of openpak.org (were capped at 36rem)

## v0.2.3 - 2026-11-01

- Page title is "OpenSplat".

## v0.2.2 - 2026-11-01

- OpenSplat mark: favicon, SVG icon, Apple touch icon, 192 and 512 icons; the top bar shows the OpenPak logo, a slash and the OpenSplat mark with the name. Lint fix for the Judd client.

## v0.2.1 - 2026-11-01

- Fix the v0.2.0 image build: Judd client uses plain fetch (the typed $fetch overflowed the type checker in CI). Content as v0.2.0.

## v0.2.0 - 2026-11-01

- New page `/splatfest`: per-team Splatfest results from two sources, Judd's read API (`PN_SPLATOON_WEBSITE_JUDD_URL`, match results the game uploads) and the game server's competition ranking (`ranking_splatoon` tables in the title database). API: `/api/splatfest`.
- The site is now called OpenSplat (the repo, image and directory keep the name splatnet for now): page title, h1, nav, locales, README and docs. Top bar is the OpenPak logo (links to openpak.org), a slash and the name OpenSplat (links to the site home), visible on mobile too; the old mobile `::after` label is gone.
- New hostname `opensplat.openpak.org` next to `splatnet.openpak.org` on the Traefik router. The 301 from the old name waits until the Cloudflare hostname is live (docs/deploy.md).
- Fix: footer showed the raw key `footer.legal.notices`; it is now `footer.legal_notices`, "Trademarks and takedowns", in all locales.
- Fix: the page lede no longer wraps at 44rem; shortened to "Stage rotations, open gatherings and who's playing in Splatoon on OpenPak."
- Checked every `$t()` key in `app/` against all three locales; the only misses are the dynamic `modes.*` and `stages.*` keys and `titles.friends` in es/ja, which fall back to English.

## v0.1.0 — 2026-11-01

- OpenPak fork: openpak.org look and header/footer, self-hosted font, Pretendo branding removed
- Player names from nn-account `GetUserData` (no `GetPNIDs`); BOSS reached by Host header through an internal URL
- Tag-driven ghcr release, `example.env`, docs
- Merge pull request #17 from PretendoNetwork/fix/111497 [82d090e]
- chore: update nodejs version [f2cc751]
- Merge pull request #16 from PretendoNetwork/fix/matrix-cross-browser-support [a5f7715]
- chore: npm audit fix [684bfd7]
- fix: prevent server crash when account server isn't available [417bd8c]
- fix: [Bug]: Odd colored blocks on all screens and the themes selector Fixes #8 [27aad55]
- chore: set read frequently flag to improve bitmap generation performance [d245336]
- chore: swap to includes cause....yeah [2675296]
- fix: desktop safari vs mobile [aeb9e68]
- fix: increase canvas resolution to fix issues on android [63c5c4c]
- Merge pull request #11 from PretendoNetwork/chore/css-cleanup [231fe8b]
- fix: pull mii name from PNID to avoid bug with friends [f05addc]
