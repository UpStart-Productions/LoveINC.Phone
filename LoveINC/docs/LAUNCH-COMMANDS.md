# Launch and ship commands

Commands below are defined in `package.json` at the project root (`LoveINC/`). Run them with **`npm run <script>`** (for example `npm run cap:run:ios`).

This app targets **iOS/Android devices and simulators**, not the web.

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
| **`increment-ios-build`** | Increments `CURRENT_PROJECT_VERSION` in `ios/App/App.xcodeproj/project.pbxproj` only. Used by **`ship:ios`**; rarely needed alone. |
| **`ship:ios`** | **App Store / release pipeline:** runs `scripts/ship-ios-app-store.js` — bumps iOS build number, production `ng build`, `cap sync ios`, **strips any `server` block** from `ios/App/App/capacitor.config.json` (removes live-reload URL), opens `ios/App/App.xcworkspace` in Xcode for **Archive** and upload. |

## Related scripts (not app launch)

These build **workspace packages** (`@upstart-productions/*`), not the main Ionic app shell:

- `build:goal-tracker`, `build:simple-budget`, `build:verse-of-the-day`, `build:service-unlock`, `build:journal`

## Reference

- Root Capacitor config: `capacitor.config.ts` (no `server` key in repo — correct for release).
- Synced iOS file (generated, gitignored): `ios/App/App/capacitor.config.json` — must **not** contain `server.url` in builds you upload to App Store Connect.
