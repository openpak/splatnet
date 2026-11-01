# Changelog — splatnet

Note: the early history below is the upstream project (Pretendo Splatoon-Website);
OpenPak work starts at the port/fork commit.

## v0.1.1 — 2026-11-01

- The "no rotation yet" notices span the page width like the rest of openpak.org (were capped at 36rem)

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
