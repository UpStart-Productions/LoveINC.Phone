# Launch and ship commands

Commands below are defined in `package.json` at the project root (`LoveINC/`). Run them with **`npm run <script>`** (for example `npm run cap:run:ios`).

This app targets **iOS/Android devices and simulators**, not the web.

## App version (source of truth)

- **`src/app-version.json`** holds **`version`** (marketing / CFBundleShortVersionString) and **`build`** (integer / CFBundleVersion). The **More** tab shows **`v{version}`**; tap the badge for **build**.
- **`npm run version:patch`** / **`version:minor`** / **`version:major`** — bumps semver and **increments `build`**, writes JSON, and updates **`ios/App/App.xcodeproj/project.pbxproj`** (`MARKETING_VERSION`, `CURRENT_PROJECT_VERSION`).
- **`npm run version:build`** — **increments `build` only** (same marketing version), syncs Xcode — use between App Store uploads when the version string stays the same.
- **`npm run version:sync-ios`** — rewrites Xcode from current `app-version.json` (fix drift after manual edits).
- **`npm run setup:git-hooks`** *(optional)* — installs a **post-merge** hook on **`main`** that runs **`version:patch`** and commits `src/app-version.json` + `project.pbxproj`.

| Command | What it does |
|--------|----------------|
| **`start`** | Runs `ng serve` — Angular dev server (browser). Not the primary workflow for this app. |
| **`build`** | Runs `ng build` — default Angular build into `www` (uses default config; production is favored for device installs unless you need dev maps). |
| **`watch`** | `ng build --watch --configuration development` — rebuilds `www` on file changes; pair with a separate `cap sync` / run when needed. |
| **`cap:sync`** | `ng build` then `npx cap sync` — copies the **default** web build to **all** native projects and updates native Capacitor config from `capacitor.config.ts`. |
| **`cap:run:ios`** | `ng build`, `cap sync`, then `cap run ios` — build, sync, and launch the app on the chosen iOS simulator or device using the **bundled `www`** (no live reload). |
| **`cap:run:ios:live`** | `ionic cap run ios -l --external` — **live reload**: WebView loads from your Mac (LAN URL). Applies small post-install patches (`patches/*.patch`) so this flow works with **Angular esbuild/vite** (`@ionic/cli` 7.2 + **`--external`**). Injects `server` into `ios/App/App/capacitor.config.json`. **Do not ship** an archive built while `server` is present; use **`npm run ship:ios`**. |
| **`cap:test:ios`** | Same as `cap:run:ios` (`ng build && cap sync && cap run ios`). Useful alias for a quick device/simulator run. |
| **`cap:pod:install`** | Runs `pod install` under `ios/App` — run after native dependency changes; not a full launch by itself. |
| **`version:patch`**, **`version:minor`**, **`version:major`**, **`version:build`**, **`version:sync-ios`** | See **App version** above. |
| **`increment-ios-build`** | Same as **`version:build`** (updates `app-version.json` + Xcode). Used by **`ship:ios`**. |
| **`ship:ios`** | **App Store / release pipeline:** runs `scripts/ship-ios-app-store.js` — **`version:build`** (increment build + sync Xcode), production `ng build`, `cap sync ios`, **strips any `server` block** from `ios/App/App/capacitor.config.json` (removes live-reload URL), opens `ios/App/App.xcworkspace` in Xcode for **Archive** and upload. |

## Related scripts (not app launch)

These build **workspace packages** (`@upstart-productions/*`), not the main Ionic app shell:

- `build:goal-tracker`, `build:simple-budget`, `build:verse-of-the-day`, `build:service-unlock`, `build:journal`

## Reference

- Root Capacitor config: `capacitor.config.ts` (no `server` key in repo — correct for release).
- Synced iOS file (generated, gitignored): `ios/App/App/capacitor.config.json` — must **not** contain `server.url` in builds you upload to App Store Connect.
