[![CI](https://github.com/alex99ka/recipe-book-app/actions/workflows/ci.yml/badge.svg)](https://github.com/alex99ka/recipe-book-app/actions/workflows/ci.yml)
[![Release](https://github.com/alex99ka/recipe-book-app/actions/workflows/release.yml/badge.svg)](https://github.com/alex99ka/recipe-book-app/actions/workflows/release.yml)

# ספר מתכונים

The family recipe book for Android and the web: Hebrew recipes from a link, a
video or a photo, cookbooks, servings scaling and ingredient prices. It is for
family and invited friends only; the server refuses everyone else.

- **Android**: install the APK from the [latest release](https://github.com/alex99ka/recipe-book-app/releases/latest).
  It updates itself in the background.
- **Web (PC)**: https://alex-recipe-book.web.app

## How it fits together

- Ionic 9, Angular 22 and Capacitor 8, with the app shell (sign-in, updates,
  release pipeline) taken from [todo-shopping](https://github.com/alex99ka/todo-shopping).
- Sign-in is Google through the `alex-todo-shopping` Firebase project, and a
  household there is a shared recipe book.
- All data comes from the recipe server's JSON API (`/api/v1`, published through
  Tailscale Funnel), which checks every request's Firebase ID token. The app
  holds no recipes and no secrets.

## Develop

Needs Node 24 (or 22.22+).

```sh
npm ci
npm start          # http://localhost:8100, an origin the API allows
npm run lint
npm run build
```

## Release

Set `version` in `package.json`, move the CHANGELOG's Unreleased entries under
it, commit, and push a tag with the same number (`1.2.3`). The release workflow
builds and signs the APK, scans the APK and `www.zip` for secrets, publishes the
GitHub release, and deploys the web build to Firebase Hosting.

Repository settings it needs: the `ANDROID_KEYSTORE_BASE64`,
`ANDROID_KEYSTORE_PASSWORD` and `FIREBASE_SERVICE_ACCOUNT` secrets and the
`ANDROID_KEY_ALIAS` variable.

## Licence

MIT, see [LICENSE.md](LICENSE.md).
