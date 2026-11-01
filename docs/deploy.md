# Deploy: splatnet

Fork of Pretendo's `Splatoon-Website` (AGPL-3.0). Image: `ghcr.io/openpak/splatnet`, built on a `v*.*.*` tag.
Settings are in `example.env`; every one is prefixed `PN_SPLATOON_WEBSITE_`.

## Where it gets its data

| Data | From | How |
| --- | --- | --- |
| Stage rotation | `nn-boss`, task `schdat2` of app `rjVlM7hUXPxmYQJh` | Tasksheet over HTTP with the public `npts` name as `Host` (set `BOSS_INTERNAL_URL` to reach BOSS on the container network); the file is decrypted with the console-dumped BOSS Wii U AES and HMAC keys and cached for an hour in `FILE_CACHE_DIR` |
| Gatherings | Splatoon title database (`splatoonwiiu`, `matchmaking.gatherings` and `matchmake_sessions`) | Read-only SQL; the `splatoon` title in the shared `nex` image already writes this schema |
| Player names | `nn-account`, `account.v2` `GetUserData` per pid | gRPC with the account API key |
| Friends | `nn-friends` gRPC | Only for a signed-in player |
| Tag themes | MongoDB `splatnet` | Only for a signed-in player |

## Production

Quadlet `openpak-splatnet` on the primary box, network `openpak.network`, HTTP 8080, Traefik router
`splatnet-web` on the `web` entrypoint for `splatnet.openpak.org`. The public name is a Cloudflare
hostname; see [Notes](notes.md) for what the owner has to add there.
