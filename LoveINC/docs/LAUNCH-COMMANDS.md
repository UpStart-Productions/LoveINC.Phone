# Launch and ship commands

Commands below are defined in `package.json` at the project root (`LoveINC/`). Run them with **`npm run <script>`** (for example `npm run cap:run:ios`).

This app targets **iOS/Android devices and simulators**, not the web.

## App version (source of truth)

- **`src/app-version.json`** holds **`version`** (marketing string; CFBundleShortVersionString on iOS, `versionName` on Android) and **`build`** (integer; CFBundleVersion on iOS, `versionCode` on Android — **shared across both platforms**, so it only ever increases). The **More** tab shows **`v{version}`**; tap the badge for **build**.
- **`npm run version:patch`** / **`version:minor`** / **`version:major`** — bumps semver and **increments `build`**, writes JSON, and updates **both** **`ios/App/App.xcodeproj/project.pbxproj`** (`MARKETING_VERSION`, `CURRENT_PROJECT_VERSION`) and **`android/app/build.gradle`** (`versionName`, `versionCode`).
- **`npm run version:build`** — **increments `build` only** (same marketing version), syncs both native projects — use between store uploads when the version string stays the same.
- **`npm run version:sync-ios`** / **`npm run version:sync-android`** — rewrites one native project from current `app-version.json` (fix drift after manual edits), without bumping anything.
- **`npm run setup:git-hooks`** *(optional)* — installs a **post-merge** hook on **`main`** that runs **`version:patch`** and commits `src/app-version.json` + `project.pbxproj` + `android/app/build.gradle`.

| Command | What it does |
|--------|----------------|
| **`start`** | Runs `ng serve` — Angular dev server (browser). Not the primary workflow for this app. |
| **`build`** | Runs `ng build` — default Angular build into `www` (uses default config; production is favored for device installs unless you need dev maps). |
| **`watch`** | `ng build --watch --configuration development` — rebuilds `www` on file changes; pair with a separate `cap sync` / run when needed. |
| **`cap:sync`** | `ng build` then `npx cap sync` — copies the **default** web build to **all** native projects and updates native Capacitor config from `capacitor.config.ts`. |
| **`cap:run:ios`** | `ng build`, `cap sync`, then `cap run ios` — build, sync, and launch the app on the chosen iOS simulator or device using the **bundled `www`** (no live reload). |
| **`cap:run:android`** | Same, for Android — first **boots an emulator automatically if none is connected** (`scripts/ensure-android-emulator.js`, default AVD `Pixel_7a`), then `ng build`, `cap sync`, `cap run android`. |
| **`cap:run:ios:live`** | `ng build` then `ionic cap run ios -l --external` — **live reload**: WebView loads from your Mac (LAN URL). Applies small post-install patches (`patches/*.patch`) so this flow works with **Angular esbuild/vite** (`@ionic/cli` 7.2 + **`--external`**). Injects `server` into `ios/App/App/capacitor.config.json`. **Do not ship** an archive built while `server` is present; use **`npm run ship:ios`**. |
| **`cap:run:android:live`** | Same, for Android — injects `server` into `android/app/src/main/assets/capacitor.config.json`. **Do not ship** a bundle built while `server` is present; use **`npm run ship:android`**. |
| **`cap:test:ios`** | Same as `cap:run:ios` (`ng build && cap sync && cap run ios`). Useful alias for a quick device/simulator run. |
| **`cap:test:android`** | Same as `cap:run:android` (including the auto-boot). Useful alias for a quick device/emulator run. |
| **`cap:pod:install`** | Runs `pod install` under `ios/App` — run after native dependency changes; not a full launch by itself. **No Android equivalent needed** — Gradle resolves native dependencies automatically on every build. |
| **`version:patch`**, **`version:minor`**, **`version:major`**, **`version:build`**, **`version:sync-ios`**, **`version:sync-android`** | See **App version** above. |
| **`increment-ios-build`** | Same as **`version:build`** (updates `app-version.json` + Xcode). Used by **`ship:ios`**. |
| **`increment-android-build`** | Same as **`version:build`** (updates `app-version.json` + `android/app/build.gradle`). Used by **`ship:android`**. |
| **`ship:ios`** | **App Store / release pipeline:** runs `scripts/ship-ios-app-store.js` — **`version:build`** (increment build + sync Xcode), production `ng build`, `cap sync ios`, **strips any `server` block** from `ios/App/App/capacitor.config.json` (removes live-reload URL), opens `ios/App/App.xcworkspace` in Xcode for **Archive** and upload. |
| **`ship:android`** | **Play Store / release pipeline:** runs `scripts/ship-android-play-store.js` — **`version:build`** (increment build + sync `build.gradle`), production `ng build`, `cap sync android`, **strips any `server` block** from `android/app/src/main/assets/capacitor.config.json`, then runs `./gradlew bundleRelease` — **fully CLI, no Android Studio needed.** Produces a **signed** `.aab` at `android/app/build/outputs/bundle/release/app-release.aab` (signing config comes from the gitignored `android/keystore.properties`) — upload that file to Play Console → your release track manually. |
| **`ship:ios:build`** / **`ship:ios:minor`** / **`ship:ios:major`**, **`ship:android:build`** / **`ship:android:minor`** / **`ship:android:major`** | Same pipelines, with an explicit bump type instead of the default `patch`. |
| **`ota`** | **OTA bundle for GrovLink admin:** bumps semver (patch), production `ng build`, zips `www` → `dist-ota/loveinc-{version}.zip`, prints SHA-256. Does **not** touch either native project — OTA is JS/UI only and **shared by both platforms** (same zip, same GrovLink admin upload, updates whichever native shell is installed). Variants: `npm run ota -- minor`, `npm run ota -- 1.0.9`, **`ota:no-bump`**. |

## Android emulator auto-boot

`cap:run:android` and `cap:run:android:live` run `scripts/ensure-android-emulator.js` first: if `adb devices` already shows a connected device or emulator, it does nothing; otherwise it boots an AVD and waits until Android reports `sys.boot_completed`, before the build/sync/run proceeds.

- **Default AVD:** `Pixel_7a`. Override per-run with `--avd "Name"` (e.g. `npm run cap:run:android -- --avd "Medium_Phone_API_36.0"`) or set `ANDROID_AVD` in your shell.
- **SDK location** comes from `android/local.properties` (`sdk.dir`, kept current by Android Studio automatically), falling back to `$ANDROID_HOME` / `$ANDROID_SDK_ROOT`.
- First boot of a given AVD takes a minute or two; subsequent runs are fast since the script skips booting once something's already connected.

Android build tooling note: `ship:android` calls `./gradlew` directly, which needs a JDK on `JAVA_HOME` (or in `PATH`). If it can't find one, point `JAVA_HOME` at Android Studio's bundled JDK, typically `/Applications/Android Studio.app/Contents/jbr/Contents/Home` on macOS.

## OTA updates (test on device)

OTA pushes JS/UI (and SQLite migrations) without a store release — same mechanism, same zip, on both iOS and Android. Upload the zip in **GrovLink admin → affiliate → OTA Updates** (super admin). Set **Active Bundle**, **Rollout 100%**, kill switch off, save rollout.

### One-time setup

1. Install a **bundled** build on the phone — **`npm run cap:run:ios`** or **`npm run cap:run:android`** (pick device). **Not** the `:live` variants (dev server breaks OTA).
2. Note baseline version in **More** (e.g. **v1.0.8**).
3. In admin, confirm affiliate **`mobileAppId`** is **`org.loveincnewberg.app`**.

### Each test

1. Make a visible change in the app.
2. **`npm run ota`** — produces `dist-ota/loveinc-{version}.zip` (semver bumped; must differ from what’s on the device).
3. Admin: upload zip, enter matching version, save rollout (active bundle + 100%).
4. On phone: **force-quit → reopen** (download), **force-quit → reopen** (apply).
5. **Pass:** visible change + **More** shows new version.

### If nothing updates

- Rollout not saved, or kill switch on.
- Uploaded version matches device’s current version.
- **Minimum Native Build** higher than device build (leave blank for testing).
- Phone can reach **`https://api.grovlink.com/api/public-ota/update-check`**.

## Related scripts (not app launch)

These build **workspace packages** (`@upstart-productions/*`), not the main Ionic app shell:

- `build:goal-tracker`, `build:simple-budget`, `build:verse-of-the-day`, `build:service-unlock`, `build:journal`

## Reference

- Root Capacitor config: `capacitor.config.ts` (no `server` key in repo — correct for release).
- Synced iOS file (generated, gitignored): `ios/App/App/capacitor.config.json` — must **not** contain `server.url` in builds you upload to App Store Connect.
- Synced Android file (generated, gitignored): `android/app/src/main/assets/capacitor.config.json` — must **not** contain `server.url` in builds you upload to Play Console.
- Android signing key (gitignored): `android/keystore/loveinc-upload-key.jks` + `android/keystore.properties` — back these up somewhere durable outside git. Losing them means going through Google's key-reset process to keep shipping updates.
