# APK attach standard

Every patch that changes the web app or Android wrapper must ship a matching sideload APK in the same change. Do not leave the rebuild for a follow-up.

## Sideload path

- File: `dist/nodeoct3-ascii.apk`
- Package: `com.skc45.nodeoct3`
- App name: ASCII Notes
- Version: `android/version.properties` (`versionCode` + `versionName`)

That path is stable. Overwrite it on each patch. Do not add extra versioned APKs to git.

## Attach a patch

From the repo root:

```bash
android/build-apk.sh --bump
```

Then commit, together with the rest of the patch:

- `android/version.properties`
- `dist/nodeoct3-ascii.apk`
- `dist/apk-manifest.txt`

`--bump` increments `versionCode` by 1 and the last `versionName` component (for example `2.3` → `2.4`). Rebuilds without a version change may use `android/build-apk.sh` with no flags.

The script copies current `index.html`, `styles.css`, and `app.js` into the APK, checks those assets match the repo, and writes `dist/apk-manifest.txt` (version, SHA-256, git commit).

## Pull requests

GitHub Actions workflow **Attach APK** builds the same package on every pull-request update and uploads artifact `nodeoct3-ascii`. That is the CI attach. The git attach is still `dist/nodeoct3-ascii.apk` so the APK can be sideloaded from the branch without waiting on Actions.
