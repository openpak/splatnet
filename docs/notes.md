# Notes: splatnet

## Differences from upstream

- Look: openpak.org's console system UI (tokens copied by hand from the website's `input.css`), the
  website's header and footer, self-hosted M PLUS Rounded 1c. Pretendo's logo, colours, fonts and the
  Splatoon-styled page chrome are gone; the stage images are kept as content.
- Player names use `nn-account` `GetUserData` per pid. OpenPak's account server has no `GetPNIDs`.
- BOSS is reached with a pinned `Host` header (`BOSS_INTERNAL_URL`), because BOSS picks its service by host and
  the public `*.openpak.org` BOSS names resolve only for consoles.
- Sign-in is not wired. Upstream takes a Pretendo `access_token` cookie and asks the `api` gRPC service about
  it; OpenPak's account server does not serve that service. Without a sign-in the friends and tag views stay
  hidden. Setting `PUBLIC_LOGIN_DOMAIN` shows upstream's sign-in link again.

## Open

- BOSS needs the Wii U AES and HMAC keys and the Splatoon `schdat2` task seeded (and a current
  `VSSetting.byaml`, which `games/rotationator` generates) before a rotation shows.
