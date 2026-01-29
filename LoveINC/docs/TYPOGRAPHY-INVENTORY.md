# Typography Inventory & Standardization Plan

**Reference:** Tools page / `content-card` component (font sizes and colors you want to standardize on).

---

## 1. Reference: Tools / Content-Card Typography

| Role | Font size | Font weight | Color | Line height | Usage |
|------|-----------|-------------|-------|-------------|--------|
| **Category icon** | 14px | (default) | `var(--ion-color-medium)` | — | Small icon in category row |
| **Category / label** | 13px | (default) | `var(--ion-color-medium)` | — | "Guided Scripture", "Day 5", etc. |
| **Title** | 17px | 600 | `#000` | 1.35 | Main card headline |
| **Detail icon** | 14px | (default) | `#000` | — | Play icon before "2-5 min" |
| **Detail / supporting** | 13px | (default) | `var(--ion-color-medium)` | — | "2-5 min", metadata |
| **Decorative icon** | 36px | (default) | `#fff` | — | Large icon on colored bg |

**Summary:**
- **Primary text (titles):** 17px, 600, black
- **Secondary / metadata:** 13px, medium gray
- **Small icons / labels:** 14px
- **Line height:** 1.35 for titles; 1.4–1.5 for body when needed

---

## 2. Proposed CSS Variables (variables.scss or global.scss)

Add these so components can use shared tokens instead of hardcoded values:

```scss
:root {
  /* Typography - aligned with Tools / content-card */
  --app-font-size-caption: 12px;    /* pills, tiny labels */
  --app-font-size-body-sm: 13px;    /* detail, metadata, category */
  --app-font-size-body: 14px;       /* body, list secondary */
  --app-font-size-body-lg: 15px;    /* slightly larger body */
  --app-font-size-title-sm: 16px;   /* list titles, small headings */
  --app-font-size-title: 17px;      /* card title, primary heading */
  --app-font-size-title-lg: 18px;   /* section headings */
  --app-font-size-display-sm: 20px; /* page subheads */
  --app-font-size-display: 24px;    /* page titles, big headings */
  --app-font-size-display-lg: 28px; /* hero, icons */
  --app-font-size-display-xl: 32px; /* onboarding, impact numbers */

  --app-font-weight-medium: 500;
  --app-font-weight-semibold: 600;
  --app-font-weight-bold: 700;

  --app-line-height-tight: 1.35;
  --app-line-height-body: 1.4;
  --app-line-height-relaxed: 1.5;
  --app-line-height-loose: 1.6;

  /* Text colors - use Ionic vars where possible */
  --app-text-primary: var(--ion-text-color);      /* or #000 for light theme */
  --app-text-secondary: var(--ion-color-medium);
  --app-text-accent: var(--ion-color-primary);
}
```

---

## 3. Inventory by File

### Global (`src/global.scss`)

| Selector / context | Font size | Weight | Color | Notes |
|--------------------|-----------|--------|-------|-------|
| `.pill-button` | 18px | 600 | — | Primary CTA |
| `.pill-button ion-icon` | 24px | — | — | |
| `ion-header` | — | — | `#ffffff` | Toolbar |
| Header icons | 1.2rem | — | `#ffffff` | |
| `ion-item[detail="true"]` detail icon | 13px | — | `--ion-color-medium` | **Matches ref** |
| Accordion toggle icon | 13px | — | — | **Matches ref** |
| `.action-pill`, `.item-pill` | 12.6px | 600 | — | Odd value; consider 13px |
| `ion-item ion-label h2`, `.user-type-title` | 16.2px | — | — | **Close to ref title**; 10% smaller than 18px |
| Action sheet title / h1 | 20px | 600 | `--ion-color-primary` | |
| Action sheet button text | 14px | — | — | **Matches ref body** |
| Action sheet Donate button | 16px | 600 | `#ffffff` | |
| Action sheet group titles | 24px | — | `--ion-color-primary` | |
| Action sheet body / list text | 16px | — | `--ion-color-dark` | |
| Services list item icons | 24px | — | — | |
| Share list item icons | 24px | — | — | |

---

### Components

#### `content-card` (reference)
Already documented in §1. Uses 13px / 14px / 17px, 600, `#000` / `--ion-color-medium`.

#### `card` (app-card)
| Element | Size | Weight | Color |
|---------|------|--------|-------|
| Badge | 12px | 600 | — |
| Badge icon | 14px | — | — |
| `ion-card-title` | 18px | 700 | `--ion-color-dark` |
| `ion-card-subtitle` | 14px | 500 | `--ion-color-medium` |
| Card content | 14px | — | `--ion-text-color` |
| Action icons | 21.6px | — | `--ion-color-dark` |

**Vs reference:** Title 18px/700 vs 17px/600; uses `--ion-color-dark` instead of `#000`.

#### `alerts-modal`
| Element | Size | Weight | Color |
|---------|------|--------|-------|
| Modal title | 1.25rem (~20px) | 600 | `#000` |
| Empty state icon | 64px | — | `--ion-color-medium` |
| Empty state title | 1.25rem | 600 | `--ion-color-dark` |
| Empty state text | 0.9375rem (15px) | — | `--ion-color-medium` |
| Notification title | 0.9375rem | 600 | `#000` |
| Notification message | 0.875rem (14px) | — | `--ion-color-dark` |
| NEW badge | 0.75rem (12px) | 600 | `--ion-color-dark` |
| Date | 0.75rem | — | `--ion-color-medium` |
| Mark all button | — | 600 | `#ffffff` |

**Vs reference:** Uses **rem**; title 15px vs 17px; mix of `#000` and `--ion-color-dark`.

#### `user-type-card`
| Element | Size | Weight | Color |
|---------|------|--------|-------|
| Icon | 28px | — | — |
| Title | — | 600 | — |
| Subtitle | 14px | — | — |
| Line height | — | — | 1.4 |

---

### Pages

#### `about`
| Element | Size | Weight | Color |
|---------|------|--------|-------|
| Section label | 18px | 600 | `--ion-color-primary` |
| Hero icon | 24px | — | — |
| Body | — | — | `--ion-color-dark` |
| Service item title | 16px | 600 | `--ion-color-primary` |
| Service item desc | 14px | — | — |
| Intro paragraph | 15px | — | `--ion-color-medium-shade` |
| Service icon | 28px | — | — |
| Stat value | 32px | 700 | — |
| Stat label | 12px | — | — |
| Accordion body | 14px | — | — |
| Accordion footer | 13px | — | — |
| Statement of Faith title | 24px | 700 | — |
| Statement body | 15px | — | — |
| CTA title | 24px | — | `--ion-color-primary` |

#### `developer-options`
| Element | Size | Weight | Color |
|---------|------|--------|-------|
| Card title | 20px | 600 | `--ion-color-primary` |
| Card icon | 24px | — | — |

#### `home`
| Element | Size | Weight | Color |
|---------|------|--------|-------|
| Card badge | 12px | 600 | — |
| Badge icon | 14px | — | — |
| Card title | 18px | 700 | `--ion-color-dark` |
| Card subtitle | 14px | 500 | `--ion-color-medium` |
| Card content | 14px | — | `--ion-text-color` |

#### `more`
| Element | Size | Weight | Color |
|---------|------|--------|-------|
| Menu icon | 24px | — | — |
| Menu label | 14px | 600 | — |

#### `services`
| Element | Size | Weight | Color |
|---------|------|--------|-------|
| List item icon | 24px | — | `--ion-color-primary` |

#### `donate-goods`
| Element | Size | Weight | Color |
|---------|------|--------|-------|
| Section title | 20px | 500 | `--ion-color-medium` |
| Item title | 18px | 600 | `--ion-color-dark` |
| Item meta | 14px | — | — |
| Secondary meta | 13px | — | `--ion-color-medium` |
| Item pill | 12px | 500 | — |

#### `donate-money`
| Element | Size | Weight | Color |
|---------|------|--------|-------|
| Amount option | 16px | 500 | `--ion-color-dark` |
| Other amount label | 14px | — | `--ion-color-medium` |
| Other amount input | 16px | — | — |
| Form label | 14px | — | `--ion-color-medium` |
| Disclaimer | 12px | — | `--ion-color-medium` |

#### `faq`
| Element | Size | Weight | Color |
|---------|------|--------|-------|
| Section title | 1.5rem (24px) | — | `--ion-color-medium` |
| Accordion title | 0.95rem (~15px) | 500 | `--ion-color-dark` |
| Accordion body | 0.9rem (~14px) | — | `--ion-color-dark` |

#### `profile`
| Element | Size | Weight | Color |
|---------|------|--------|-------|
| Avatar | 48px | — | — |
| Name | 24px | 700 | — |
| Meta | 14px | — | — |
| Section titles | 24px, 18px | 700, 600 | — |
| List details | 12px, 16px | —, 500 | — |
| Logout | 32px | 700 | — |
| Developer link | 16px | 600 | — |

#### `gap-ministries` (duplicated structure in org-services)
| Element | Size | Weight | Color |
|---------|------|--------|-------|
| Section title | 20px | 500–700 | `--ion-color-medium` |
| Item title | 18px | 600 | `--ion-color-dark` |
| Meta | 14px, 13px | 600 | `--ion-color-medium` |

#### `transformation-class-detail`
| Element | Size | Weight | Color |
|---------|------|--------|-------|
| Breadcrumb | 15px | — | `--ion-color-dark` |
| Class icon | 24px | — | — |
| Meta label | 14px | 600 | `--ion-color-medium` |
| Title | 16px | — | `--ion-color-dark` |
| Desc | 14px | — | `--ion-color-medium` |

#### `onboarding` (steps 1–3)
| Element | Size | Weight | Color |
|---------|------|--------|-------|
| Hero title | 32px | 700 | — |
| Body | 18px | 600 | — |
| Buttons | 18px, 24px | 600 | — |
| Small text | 14px | — | `--ion-color-medium` |

#### `contact`
| Element | Size | Weight | Color |
|---------|------|--------|-------|
| Page title | 32px | 700 | — |

#### `tabs` (tab bar)
| Element | Size | Weight | Color |
|---------|------|--------|-------|
| Tab icon | 2rem | bold | — |
| Tab label | 0.6rem | 500 | — |
| (other) | 1.36rem | — | — |

#### Sandbox pages (`sandbox-*`)
Wide variation: 12px–64px, 600–700, various colors. Good candidates to migrate to tokens during consolidation.

#### `explore-container`
| Element | Size | Weight | Color |
|---------|------|--------|-------|
| Title | 20px | — | — |
| Body | 16px | — | — |

---

## 4. Inconsistencies Summary

| Issue | Where | Recommendation |
|-------|--------|----------------|
| **Units** | Mix of **px** (content-card, most pages) vs **rem** (alerts-modal, faq, tabs) | Standardize on **px** to match Tools, or pick one unit and convert all. |
| **Title size** | 16px, 16.2px, 17px, 18px, 20px, 24px for “titles” | Use **17px** (ref) for card/list titles; **18px** for section headings; **24px** for page titles. |
| **Title weight** | 500, 600, 700 | Use **600** for titles (ref). Reserve 700 for display/hero. |
| **Primary text color** | `#000`, `#000000`, `--ion-color-dark`, `--ion-text-color` | Use **`var(--ion-text-color)`** or a single `--app-text-primary` token. |
| **Secondary color** | `--ion-color-medium`, `--ion-color-medium-shade` | Use **`var(--ion-color-medium)`** consistently. |
| **Odd values** | 12.6px, 16.2px, 21.6px, 0.9375rem | Replace with standard scale (12px, 16px, 20px, 15px). |
| **Duplicate definitions** | Same role styled in global, component, and page SCSS | Move to **variables** + **global** typography classes; components/pages use classes or vars. |
| **List item titles** | Global `ion-item h2` 16.2px vs card title 17px | Align with **17px** or **16px** and same weight (600). |
| **Pills/badges** | 12px, 12.6px, 13px | Pick **12px** (caption) or **13px** (body-sm); use one for pills/badges. |

---

## 5. Consolidation Checklist

- [ ] Add typography (and optional color) variables to `variables.scss` (§2).
- [ ] Add global utility classes in `global.scss` if desired (e.g. `.app-title`, `.app-body`, `.app-caption`) that use those vars.
- [ ] Replace hardcoded font-size / font-weight / color in **global.scss** (list items, action sheets, pills) with vars.
- [ ] Update **content-card** to use vars (optional; it’s the reference).
- [ ] Update **card** (app-card) to match ref: 17px/600 for title; 13px/14px for secondary.
- [ ] Update **alerts-modal**: rem → px; align title/body with ref.
- [ ] Update **user-type-card** to use vars and match ref roles.
- [ ] Page-by-page: **about**, **home**, **more**, **services**, **donate-goods**, **donate-money**, **faq**, **profile**, **developer-options**, **gap-ministries**, **transformation-class-detail**, **onboarding**, **contact**, **tabs**.
- [ ] Sandbox pages: migrate to tokens when touching them.
- [ ] Remove redundant typography from page/component SCSS once global + vars cover it.
- [ ] Smoke-test light/dark theme with `--ion-text-color` / `--ion-color-medium`.

---

## 6. Files to Touch (high level)

| Priority | File(s) | Action |
|----------|---------|--------|
| 1 | `variables.scss` | Add typography (and optional color) variables |
| 2 | `global.scss` | Use vars for list items, pills, action sheets; add utility classes if used |
| 3 | `content-card` | Optional: switch to vars |
| 4 | `card` | Align with ref; use vars |
| 5 | `alerts-modal` | px + vars; align with ref |
| 6 | `user-type-card` | Use vars |
| 7 | `about`, `home`, `more`, `services` | Replace local type styles with vars/global |
| 8 | `donate-*`, `faq`, `profile` | Same |
| 9 | `developer-options`, `gap-ministries`, `transformation-class-*` | Same |
| 10 | `onboarding`, `contact`, `tabs` | Same |
| 11 | Sandbox pages | Migrate as you go |

---

*Generated for Love INC app typography standardization. Use Tools / content-card as the single source of truth for sizes and colors.*
