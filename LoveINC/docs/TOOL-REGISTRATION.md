# Tool Registration & Add-on Architecture

This document describes how tools (add-on modules) are integrated into the app. Use it when building a new tool package or adding an existing one.

## Overview

Tools appear on the **Tools** page (More → Tools) and can have their own tab bar that replaces the main app tab bar when active. The architecture is designed for plug-and-play: add the package and register it in one place.

### Key Files

| File | Purpose |
|------|---------|
| `src/app/registered-tools.ts` | **Single registration point** – routes and tool cards for all tools |
| `src/app/tabs/tabs.routes.ts` | Spreads `REGISTERED_TOOL_ROUTES` into tab children |
| `src/app/tabs/tabs.page.ts` | Hides main tab bar when a tool has `data: { hideMainTabBar: true }` |
| `src/app/shared/utils/route-utils.ts` | `shouldHideMainTabBar(router)` – reads route data, no path coupling |

## Adding a New Tool

### 1. Install the package (if from npm)

```bash
npm install @upstart-productions/some-tool
```

### 2. Register in `registered-tools.ts`

Add **two entries**:

**A. Route config** (in `REGISTERED_TOOL_ROUTES`)

- If the tool has its **own tab bar** (e.g. Habits | FAB | Statistics), add `data: { hideMainTabBar: true }`.
- If it's a simple page with no custom tabs, omit `data`.

```typescript
// Tool with custom tab bar – main app tab bar is swapped
{
  path: 'some-tool',
  data: { hideMainTabBar: true },
  loadComponent: () => import('./some-tool-tabs/some-tool-tabs.page').then(m => m.SomeToolTabsPage),
  children: [
    { path: 'tab1', loadComponent: () => ... },
    { path: 'tab2', loadComponent: () => ... },
    { path: '', redirectTo: 'tab1', pathMatch: 'full' },
  ],
}

// Simple tool – no tab bar swap
{
  path: 'simple-tool',
  loadComponent: () => import('@upstart-productions/simple-tool').then(m => m.SimpleToolPage),
},
```

**B. Tool card** (in `REGISTERED_TOOL_CARDS`)

```typescript
{
  category: 'Life Skills',
  categoryIcon: 'trophy-outline',
  title: 'Some Tool',
  detail: 'Short description',
  iconName: 'trophy-outline',
  iconBackgroundColor: '#eaa535',
  route: '/tabs/some-tool',  // Omit for placeholders
},
```

### 3. Done

No changes needed in `tabs.page.ts` or `tabs.routes.ts`. They are driven by `registered-tools.ts`.

## Tool Types

### Simple tool (single page)

- One route, one component.
- Uses main app tab bar (back button returns to More).
- Example: Verse of the Day.

### Tool with custom tab bar

- Parent route with `data: { hideMainTabBar: true }`.
- Child routes for each tab.
- When active, the main app tab bar (Home, About, Updates, More) is hidden and the tool's tab bar is shown.
- Example: Goal Tracker (Habits | FAB | Statistics).

## Building a New Tool Package

When creating a new npm package for a tool:

1. **Package structure** – Follow `packages/goal-tracker` as reference.
2. **Exports** – Export the main page(s), services, and types from `public_api.ts`.
3. **Optional: self-registration** – The package can export `routeConfig` and `toolCard` objects. The host app imports them in `registered-tools.ts`:

   ```typescript
   import { goalTrackerRouteConfig, goalTrackerToolCard } from '@upstart-productions/goal-tracker';
   export const REGISTERED_TOOL_ROUTES = [goalTrackerRouteConfig, ...];
   export const REGISTERED_TOOL_CARDS = [goalTrackerToolCard, ...];
   ```

4. **Tab bar layout** – If the tool has its own tabs, create a tabs shell (e.g. `goal-tracker-tabs.page`) with `ion-tabs`, `ion-tab-bar`, and `ion-router-outlet`. Style it to match the main app tab bar pattern (see `goal-tracker-tabs.page.scss`).

## ToolCard Interface

```typescript
interface ToolCard {
  category?: string;
  categoryIcon?: string;
  categoryExtra?: string;
  title: string;
  detail?: string;
  imageUrl?: string;
  iconName?: string;
  iconBackgroundColor?: string;
  route?: string;  // Omit for placeholders (not yet implemented)
}
```

## Icons

All icons must be registered in `app.component.ts` (see `.cursorrules`). Add new icons to the `addIcons()` call before using them in tool tab bars or cards.
