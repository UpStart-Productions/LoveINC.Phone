# @upstart-productions/verse-of-the-day

Angular/Ionic Verse of the Day component. Fetches the daily verse from Christian Context API (getcontext.xyz), with optional SQLite caching for push notification consistency.

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

### 2. Provide optional cache (recommended for push consistency)

Implement `VerseOfTheDayCache` and provide it:

```ts
// app.config.ts or providers
import {
  VERSE_OF_THE_DAY_CACHE,
  VerseOfTheDayCache,
  VerseOfTheDay,
} from '@upstart-productions/verse-of-the-day';

// Your implementation using SQLite, etc.
const cacheImpl: VerseOfTheDayCache = {
  async get(dateKey: string) { /* ... */ },
  async set(dateKey: string, verse: VerseOfTheDay) { /* ... */ },
};

providers: [
  { provide: VERSE_OF_THE_DAY_CACHE, useValue: cacheImpl },
  // ...
]
```

### 3. Provide YouTube embed base URL (for sermon videos in Capacitor)

Fixes Error 152/153 when embedding YouTube in native apps:

```ts
import { VERSE_OF_THE_DAY_YOUTUBE_EMBED_BASE_URL } from '@upstart-productions/verse-of-the-day';

providers: [
  { provide: VERSE_OF_THE_DAY_YOUTUBE_EMBED_BASE_URL, useValue: 'https://api.grovlink.com/embed' },
]
```

### 4. Provide share handler (optional)

When provided, the share button is shown:

```ts
import { VERSE_OF_THE_DAY_SHARE, VerseOfTheDay } from '@upstart-productions/verse-of-the-day';

providers: [
  {
    provide: VERSE_OF_THE_DAY_SHARE,
    useFactory: (sharingService: SharingService) => async (verse: VerseOfTheDay) => {
      const htmlContent = `...`; // Build from verse
      await sharingService.shareContent({ title: `Verse of the Day: ${verse.reference}`, htmlContent, ... });
    },
    deps: [SharingService],
  },
]
```

### 5. Provide back button default href (optional)

Default is `/tabs/more`. Override if your app uses a different structure:

```ts
{ provide: VERSE_OF_THE_DAY_BACK_DEFAULT_HREF, useValue: '/tabs/more' }
```

### 6. Typography

The package uses host app typography classes: `.app-body`, `.app-body-secondary`, `.app-link`, `h2`. Ensure your app defines these in global typography. The host should also style `.verse-of-the-day-content h2` for the verse reference and section headers.

### 7. Use the data anywhere

Inject `VerseOfTheDayService` and call `getVerseOfTheDay()` to render the verse in any component (card, list, modal, etc.):

```ts
import { VerseOfTheDayService, VerseOfTheDay } from '@upstart-productions/verse-of-the-day';

verse$ = this.verseOfTheDayService.getVerseOfTheDay();
```

## Exports

- `VerseOfTheDayPage` – full page component
- `VerseOfTheDayService` – service for fetching data
- `VerseOfTheDay` – interface for display
- `VerseOfTheDayCache` – interface for cache adapter
- `ChristianContextResponse` – API response type
- `VERSE_OF_THE_DAY_CACHE` – injection token for cache
- `VERSE_OF_THE_DAY_YOUTUBE_EMBED_BASE_URL` – injection token for YouTube embed
- `VERSE_OF_THE_DAY_SHARE` – injection token for share handler
- `VERSE_OF_THE_DAY_BACK_DEFAULT_HREF` – injection token for back button href

## Publishing

See `LoveINC/docs/VERSE-OF-THE-DAY-PUBLISH.md` in the repo for GitHub Packages publish and update instructions.
