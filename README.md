# OpenPak OpenSplat

OpenSplat is OpenPak's replacement for Nintendo's SplatNet, the Splatoon 1 companion service for the Wii U.

| | |
| --- | --- |
| Network | Wii U |
| Role | Web site: stage rotations, active matches, player tags |
| Depends on | [`nn-boss`](https://github.com/openpak/nn-boss), [`nn-account`](https://github.com/openpak/nn-account), [`nn-friends`](https://github.com/openpak/nn-friends), the Splatoon title database ([`nex`](https://github.com/openpak/nex)), MongoDB |
| Image | `ghcr.io/openpak/splatnet` |
| Public host | `opensplat.openpak.org` (`splatnet.openpak.org` until the redirect is set) |
| Based on | [Pretendo `Splatoon-Website`](https://github.com/PretendoNetwork/Splatoon-Website) (AGPL-3.0) |
| Licence | AGPL-3.0-only |

## What it shows

| Page | Source |
| --- | --- |
| Regular and Ranked Battle stages | `VSSetting.byaml` from BOSS (task `schdat2`, app `rjVlM7hUXPxmYQJh`), decrypted with the BOSS keys and cached for an hour |
| Gatherings | Open sessions in the Splatoon title database (`matchmaking` schema), player names from the account server |
| Friends | Signed in through openpak.org, by the account's Wii U PID; see [Deploy](docs/deploy.md) |

## Run

```sh
cp example.env .env   # fill it in first
npm ci
npm run build
npm start
```

Settings are in [`example.env`](example.env). The container listens on 8080.

## Docs

- [Deploy](docs/deploy.md)
- [Notes](docs/notes.md)
- [Upstream README](docs/upstream.md)
- [Docs index](docs/README.md)

## Licence

AGPL-3.0-only. See [LICENSE](LICENSE).
