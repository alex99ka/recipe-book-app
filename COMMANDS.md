# Commands

Run from the repo root. Angular needs Node 24: `NG="npx -y node@24 node_modules/@angular/cli/bin/ng.js"`.

| Command | What it does |
|---|---|
| `npx -y node@24 node_modules/@angular/cli/bin/ng.js serve --port 8100` | Dev server on an origin the API allows. |
| `… ng.js lint` / `… ng.js build` | Lint, production build. Both must be clean. |
| `npx -y node@24 --test test/unit/scaling.test.ts` | Unit tests. |
| `git tag X.Y.Z && git push origin X.Y.Z` | Releases (APK + web + Hosting). Bump `package.json` + CHANGELOG first. |
| `gh workflow run release.yml -f publish=false` | Test build of a signed APK without publishing. |
| Server tests (from `cld`) | `tar -c --exclude=server/.venv --exclude=__pycache__ server \| ssh pi '…pytest in capped containers…'`, see cld history. |
| `python3 ~/docker/recipe-backup/backup.py --verify` (Pi) | Restore test of the newest Drive backup. |

## Don't

| | Why |
|---|---|
| Change `com.alex99ka.recipes` or the signing key | Installed apps can't update; everyone reinstalls. |
| Copy `server/.venv` to the Pi or run test containers without `--memory` | `/tmp` is RAM; it took the Pi down on 2026-10-15. |
| Fire hundreds of API calls at once | Mealie's 15-connection pool hangs (now throttled to 6, still don't). |
| Hard power-off the Pi | The SD card corrupted Mealie's image once. |
