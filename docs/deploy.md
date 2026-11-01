# Deploy: splatnet

Fork of Pretendo's `Splatoon-Website` (AGPL-3.0). Image: `ghcr.io/openpak/splatnet`, built on a `v*.*.*` tag.
Settings are in `example.env`; every one is prefixed `PN_SPLATOON_WEBSITE_`.

## Where it gets its data

| Data | From | How |
| --- | --- | --- |
| Stage rotation | `nn-boss`, task `schdat2` of app `rjVlM7hUXPxmYQJh` | Tasksheet over HTTP with the public `npts` name as `Host` (set `BOSS_INTERNAL_URL` to reach BOSS on the container network); the file is decrypted with the console-dumped BOSS Wii U AES and HMAC keys and cached for an hour in `FILE_CACHE_DIR` |
| Gatherings | Splatoon title database (`splatoonwiiu`, `matchmaking.gatherings` and `matchmake_sessions`) | Read-only SQL; the `splatoon` title in the shared `nex` image already writes this schema |
| Player names | `nn-account`, `account.v2` `GetUserData` per pid | gRPC with the account API key |
| Friends | `nn-friends` gRPC, by the Wii U PID the signed-in account carries | Only for a signed-in player whose account has a Wii U linked |

## Production

Quadlet `openpak-splatnet` on the primary box, network `openpak.network`, HTTP 8080, Traefik router
`splatnet-web` on the `web` entrypoint for `splat.openpak.org` and `splatnet.openpak.org`. Once the owner confirms the Cloudflare name `splat.openpak.org` (tunnel to `http://localhost:20120`) is live, add a `redirectRegex` middleware on the `splatnet-web` router sending `^https?://splatnet.openpak.org/(.*)` to `https://splat.openpak.org/${1}` (permanent). The public name is a Cloudflare
hostname; see [Notes](notes.md) for what the owner has to add there.

## Sign-in (openpak.org single sign-on)

Client `opensplat`; the contract is `docs/sso.md` in the website repo. `/auth/login` redirects to
`https://openpak.org/account/sso/authorize` (state and PKCE in a short-lived signed cookie), `/auth/callback`
swaps the code at `POST $PN_SPLATOON_WEBSITE_SSO_URL/internal/sso/token`, `GET /auth/logout` ends only the site session and
redirects (303) to `/`; openpak.org stays signed in. Needed in the container environment (sign-in is hidden unless all are set):

| Variable | Value |
| --- | --- |
| `SSO_CLIENT_OPENSPLAT_SECRET` | the same value as in the website's `.env` |
| `PN_SPLATOON_WEBSITE_SSO_URL` | `http://openpak-website:20010` |
| `PN_SPLATOON_WEBSITE_SSO_SESSION_KEY` | 32+ random characters, signs the session cookies |
| `PN_SPLATOON_WEBSITE_PUBLIC_HOSTNAME` | `https://splat.openpak.org` (the registered redirect origin) |

On the box these live in `deploy/splatnet.env` (mode 0600), next to the shared `.env`. `npm test` runs the sign-in tests.
Tag themes (the upstream splash-tag editor) are not built: this site has no splash-tag renderer, so nothing offers them.
