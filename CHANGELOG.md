# Changelog

All notable changes to this app. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and versions follow
[SemVer](https://semver.org/): a MAJOR version means native changes, so it needs
the new APK; anything else arrives as an in-app update.

## [2.1.0] - 2026-10-15

### Added
- Comments on a recipe, shared with the household: how it came out, what to
  change next time.
- A note when sending to a friend. For a recipe it opens a conversation that
  you both see inside the recipe ("שיחה עם …" on yours); for a cookbook it
  shows in their inbox.

## [2.0.0] - 2026-10-15

Needs the new APK (Settings offers the download): Android now hands invite
links to the app.

### Changed
- An invite link opens straight in the app when it's installed, instead of
  in the browser. Without the app it still opens the web version.

## [1.2.0] - 2026-10-15

### Added
- Add a recipe from the app: the + button on Home takes a link (a recipe site
  or a TikTok, Instagram or YouTube video), pasted text, or a photo or PDF of a
  recipe, and can put it straight into your own cookbooks.
- Edit a recipe (the pencil on a recipe): name, photo, tags, categories, source
  link and ingredient prices, and delete it.
- Settings → "המסך והיומנים": link the TRMNL screen to the household with the
  6-digit code it shows (valid 15 minutes), and add, rename or remove the
  calendars on its idle screen. Everyone in the household can manage them.

## [1.1.0] - 2026-10-15

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
- My cookbooks: make your own, shared with the household. A recipe can be in
  several; add it from the recipe screen ("הוספה לספר"). Rename and delete
  from the cookbook screen.
- Friends, separate from households: invite one with a link (WhatsApp or
  copy), then send them a recipe or a whole cookbook. They get their own copy,
  Hebrew and photo included. What friends send waits under "התקבל מחברים"
  to be kept or discarded.

### Fixed
- "Check for updates" no longer blames the internet connection when there is
  simply no release yet, or when GitHub is busy.
