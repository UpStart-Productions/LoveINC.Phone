# @upstart-productions/verse-of-the-day

Angular/Ionic Verse of the Day component. Fetches the daily verse from NET Bible API, then optionally enriches it with ESV cross-references and footnotes.

## Installation

```bash
npm install @upstart-productions/verse-of-the-day
```

## Usage

### 1. Add the route

```ts
// app.routes.ts or tabs.routes.ts
{
  path: 'verse-of-the-day',
  loadComponent: () =>
    import('@upstart-productions/verse-of-the-day').then(m => m.VerseOfTheDayPage),
}
```

### 2. Provide the ESV API key (optional)

For cross-references and footnotes, get a free key at [api.esv.org](https://api.esv.org/account/create-application/) and add it to your app config:

```ts
// main.ts or app.config.ts
import { VERSE_OF_THE_DAY_ESV_API_KEY } from '@upstart-productions/verse-of-the-day';

bootstrapApplication(AppComponent, {
  providers: [
    { provide: VERSE_OF_THE_DAY_ESV_API_KEY, useValue: environment.esvApiKey },
    // ...other providers
  ],
});
```

Without the key, the component uses NET Bible text only.

### 3. Typography

The package has no custom font styles. It uses host app typography classes:

- `.app-title` – verse reference
- `.app-body` – verse text and HTML content
- `.app-body-secondary` – error message

Ensure your app defines these classes (or equivalent) in your global typography styles.

### 4. Add to your menu

```ts
{
  name: 'Verse of the Day',
  icon: 'book-outline',
  route: '/tabs/verse-of-the-day',
}
```

## Exports

- `VerseOfTheDayPage` – full page component
- `VerseOfTheDayService` – service for fetching data
- `VerseOfTheDay` – interface for display
- `VERSE_OF_THE_DAY_ESV_API_KEY` – injection token for ESV key

## Publishing

### Step 1: Repo

The package lives in [LoveINC.Phone](https://github.com/UpStart-Productions/LoveINC.Phone) at `LoveINC/packages/verse-of-the-day`.

### Step 2: Build

The package has no devDependencies; build from the LoveINC app (which has Ionic, Angular, ng-packagr):

```bash
cd LoveINC && npm run build:verse-of-the-day
```

### Step 3: Publish to GitHub Packages

1. Create a [GitHub Personal Access Token](https://github.com/settings/tokens) with `write:packages` scope.

2. Login to GitHub Packages:
   ```bash
   npm login --registry=https://npm.pkg.github.com
   # Username: your-github-username
   # Password: paste-your-token (not your GitHub password)
   # Email: your email
   ```

3. Publish:
   ```bash
   cd LoveINC/packages/verse-of-the-day/dist
   npm publish
   ```

4. Consumers add to their project `.npmrc`:
   ```
   @upstart-productions:registry=https://npm.pkg.github.com
   ```

### Versioning

Bump `version` in `package.json` before each publish. Use [semver](https://semver.org/).
