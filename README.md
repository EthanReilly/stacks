<img src="docs/icon-192.png" width="96" alt="">

# Stacks

Notes, passwords and reminders in one Android app. Notes are grouped into stacks, passwords are encrypted on the phone with a master password, and reminders send real notifications.

## Install on your phone

1. On your Android phone, open **[the latest release](https://github.com/EthanReilly/stacks/releases/latest)** and tap **stacks.apk**.
2. When the download finishes, open it. Android will ask you to allow installs from your browser: tap **Settings**, turn on **Allow from this source**, go back and tap **Install**.
3. Open Stacks. The first time you add a reminder with a date, allow notifications.

Updating works the same way: download the newer **stacks.apk** and install it over the old one. The app also tells you on the Today tab when a new version is out. Your data stays when you update.

## Moving your data from the Claude version

1. In the Claude version, tap the **gear** on the Today tab, then **Save a backup**.
2. In the app, tap the **gear** on Today, then **Restore from a backup**, and pick that file.
3. Unlock Passwords with the same master password you used before.

## Where your data lives

Everything is stored on the phone, in the app's private storage. Nothing is sent anywhere, except a check of this page's latest release for updates. Passwords are encrypted with AES-256 using a key derived from your master password (PBKDF2, 310,000 rounds); the master password itself is never stored.

Save a backup from **Settings** now and then, to Google Drive or Files. If the phone is lost and you have no backup, the data is gone.

## How it's built

- `src/app-body.html` is the whole app (it also runs as a page on claude.ai).
- `src/native.js` connects it to Android through [Capacitor](https://capacitorjs.com): file storage, notifications, the back button, sharing and the clipboard.
- `scripts/build.mjs` builds `www/` with bundled fonts so the app works offline.
- `.github/workflows/android.yml` builds and signs the APK on every push to `main` and publishes it as a release.

The APK is signed with a key kept in the `STACKS_SIGNING` repository secret (`password:base64-of-PKCS12-keystore`, alias `stacks`). Keep a private copy of it: without the same key, a new build can't install over the old app.
