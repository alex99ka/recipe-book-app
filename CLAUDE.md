# ספר מתכונים (recipe-book-app)

The family recipe book for Android and the web. Ionic 9 / Angular 22 / Capacitor 8,
being migrated to Flutter on `app-shell`: see `docs/standard-plan.md` (phases, in order).

## Context
- All data comes from the recipe server on the Pi (`C:\claude projects\cld\server`,
  `/api/v1` through Tailscale Funnel): recipes in Mealie, the rest in Postgres. The app
  holds no recipes and no secrets. Firebase project `alex-todo-shopping` (shared with the
  to-do app) is used for Auth only; households come from its Firestore.
- Users: the household (Alex, Avital) and invited friends, at most about 8 people.

## Decided, don't re-ask
- Own cookbooks belong to the household; a recipe can be in several.
- Sending to a friend sends a copy (Hebrew, photo and prices included); a cookbook goes
  as a copy too. Household members are never friends.
- Comments are the book's; on a sent copy they're also the conversation with the sender.
- The TRMNL screen belongs to one book, linked with a 6-digit code from the screen.
- MAJOR version = native change = new APK, installed from inside the app (4.0.0+).
- Tag = `package.json` version, no `v`.

## Run
- Node 24 for Angular: `npx -y node@24 node_modules/@angular/cli/bin/ng.js …` (system Node is 22).
- Server tests run on the Pi in capped containers; never ship `server/.venv` there
  (`/tmp` on the Pi is RAM). See COMMANDS.md.
