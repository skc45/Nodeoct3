# Agent notes

## APK attach (required on every patch)

A change to `index.html`, `styles.css`, `app.js`, or `android/` is incomplete until the sideload APK is rebuilt and committed **in that same patch**.

1. Run `android/build-apk.sh --bump` after the app change.
2. Commit `android/version.properties`, `dist/nodeoct3-ascii.apk`, and `dist/apk-manifest.txt` with the patch.
3. Sideload path is always `dist/nodeoct3-ascii.apk` (package `com.skc45.nodeoct3`).
4. Do not skip the bump. Do not wait for a later “reattach the apk” follow-up.

Details: `android/ATTACHING.md`.
