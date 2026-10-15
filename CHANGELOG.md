# Changelog

All notable changes to this app. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and versions follow
[SemVer](https://semver.org/): a MAJOR version means native changes, so it needs
the new APK; anything else arrives as an in-app update.

## [1.1.0] - not released yet

The first version for the phone and the web (1.0.0 was a test build only).

### Added
- Google sign-in, and the recipe book from the recipe server's `/api/v1`.
- Home: cookbooks, recently added recipes, and search.
- Cookbook screen: a book's recipes in page order.
- Recipe screen: Hebrew text, half-star rating, ×1/×2/×3 amounts with the cost
  scaling along, price marks, steps, tags, and "add to shopping list".
- A guided tour of the app. It starts by itself the first time, and
  Settings → "סיור מודרך באפליקציה" plays it again.
- Settings: choose the household book, monthly import count, version and updates.
- Its own icon: an open cookbook with steam rising, on terracotta.
- Recipes from TikTok get a "לסרטון בטיקטוק" button that opens the video.

### Fixed
- "Check for updates" no longer blames the internet connection when there is
  simply no release yet, or when GitHub is busy.
