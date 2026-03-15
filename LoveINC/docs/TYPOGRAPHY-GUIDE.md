# Mobile App Typography Guide

**Canonical reference** for font sizes and typography in the Love INC mobile app. Follow this guide to avoid typography drift and maintain consistency.

---

## 1. Design Principles

- **Use few font sizes.** Material Design mobile uses ~4–5 sizes; iOS clusters around a handful. Hierarchy comes from **weight and color**, not many size steps.
- **All sizes use `rem`** for accessibility (respects user font-size preferences).
- **Never hardcode font sizes** in components. Always use CSS variables or typography utility classes.
- **Use semantic roles** (caption, body, title, display) rather than fine numeric gradations.

---

## 2. Text Size Scale (6 sizes)

Defined in `src/theme/variables.scss`:

| Variable | Value | Role | Use for |
|----------|-------|------|---------|
| `--app-font-size-caption` | 0.75rem | Caption | Pills, badges, metadata, overlines, form errors |
| `--app-font-size-body-sm` | 0.875rem | Body small | Secondary text, labels, smaller body copy |
| `--app-font-size-body` | 1rem | Body | Default body, list secondary, buttons, inputs |
| `--app-font-size-title` | 1.0625rem | Title | Card titles, list item titles, section headings |
| `--app-font-size-display` | 1.25rem | Display | Page titles, action-sheet headers |
| `--app-font-size-display-lg` | 1.5rem | Display large | Hero text, onboarding headlines, big numbers |

**Special-purpose:**
| Variable | Value | Use for |
|----------|-------|---------|
| `--app-font-size-input` | 0.85rem | Form input text, placeholder, labels |
| `--app-font-size-tab-label` | 0.6rem | Tab bar icon labels |

---

## 3. Icon Size Scale (6 sizes + special)

| Variable | Value | Use for |
|----------|-------|---------|
| `--app-icon-size-sm` | 0.875rem | List chevrons, accordion toggles, small badges |
| `--app-icon-size-md` | 1rem | Card badges, body-sized icons |
| `--app-icon-size-lg` | 1.25rem | Display-sized icons, action icons |
| `--app-icon-size-xl` | 1.5rem | Action sheet icons, pill icons |
| `--app-icon-size-2xl` | 2.25rem | Card placeholder icons, content card icons |
| `--app-icon-size-3xl` | 3rem | Voucher placeholder, empty state |
| `--app-icon-size-4xl` | 4rem | Scan success, no alerts, hero empty states |

**Special-purpose:**
| Variable | Value | Use for |
|----------|-------|---------|
| `--app-icon-size-header` | 1.2rem | Toolbar, back button, donate button |
| `--app-icon-size-tab` | 1.36rem | Tab bar icons |
| `--app-icon-size-fab` | 2rem | Floating action button |

---

## 4. Font Weights

| Variable | Value | Use for |
|----------|-------|---------|
| `--app-font-weight-medium` | 300 | Body text, subtitles |
| `--app-font-weight-semibold` | 600 | Titles, buttons, labels |
| `--app-font-weight-bold` | 700 | Display, hero, emphasis |

---

## 5. Typography Utility Classes

Defined in `src/theme/typography.scss`. Use these instead of inline font-size styles:

| Class | Size | Weight | Color |
|-------|------|--------|-------|
| `.app-title` | title | semibold | primary |
| `.app-body` | body | normal | primary |
| `.app-body-secondary` | body | normal | secondary |
| `.app-body-sm` | body-sm | normal | primary |
| `.app-body-secondary-sm` | caption | normal | secondary (CTA subtext, volunteer address/description) |
| `.app-disclaimer` | caption | italic | danger |
| `.app-caption` | caption | semibold | secondary |
| `.app-display` | display | semibold | accent |
| `.app-display-lg` | display-lg | semibold | accent |
| `.app-link` | body | normal | primary (blue) |

---

## 6. Semantic HTML (preferred)

Use semantic elements when possible; they inherit typography from global styles:

- `h1` → display-lg, bold
- `h2` → display, semibold
- `h3`, `h4` → title, semibold
- `h5`, `h6` → body, semibold
- `p` → body, primary
- `span` → body, primary

---

## 7. Rules for New Code

1. **Do not add new font-size variables** unless there is a clear, documented need. Prefer the existing scale.
2. **Do not hardcode `rem` or `px`** for font-size. Use `var(--app-font-size-*)` or `var(--app-icon-size-*)`.
3. **Do not create component-specific typography.** Use global classes or vars.
4. **For icons**, use `--app-icon-size-*` vars. For text, use `--app-font-size-*` or typography classes.
5. **Weight and color** handle nuance. Two elements can share a size if they differ by weight or color.

---

## 8. Page Layout

| Variable | Value | Use for |
|----------|-------|---------|
| `--app-page-padding-x` | 0.75rem | Horizontal padding from screen edge (page content, modals, cards margin) |
| `--app-card-margin` | 0.75rem | Card horizontal margin (same as page padding) |

---

## 9. File Reference

| File | Purpose |
|------|---------|
| `src/theme/variables.scss` | All size, weight, and color variables |
| `src/theme/typography.scss` | Utility classes, global heading/body styles |
| `src/theme/icons.scss` | Icon-specific styles (uses vars) |
| `src/theme/forms.scss` | Form input/label styles (uses vars) |
| `src/theme/cards.scss` | Card title/subtitle styles (uses vars) |

---

## 10. Migration Checklist (for future edits)

When adding or modifying typography:

- [ ] Does it use a variable from `variables.scss`?
- [ ] If a new size is needed, is it justified and added to this guide?
- [ ] Are component-specific font-size styles avoided?
- [ ] Does it use a typography utility class when applicable?

---

## 11. Preventing Redundant Styles

**Do not add text-only styles (font-size, font-weight, color, line-height) to component SCSS.** These create drift and duplication.

### Workflow for new text elements

1. **First**: Add a typography class to the HTML element (e.g. `class="app-body-secondary"`).
2. **Second**: If no class fits, use semantic HTML (h1–h6, p) which inherits from global styles.
3. **Third**: For icons, use `var(--app-icon-size-*)` in SCSS.
4. **Never**: Add `font-size`, `font-weight`, or `color` in component SCSS for text.

### Audit reminder

If you find yourself adding font-size/weight/color to a component, stop and add a typography class to the HTML instead. See `.cursor/rules/typography.mdc` for the full rule.

---

*Last updated: 2025. Typography scale simplified from 16+ variables to 6 text + 6 icon + 4 special-purpose. Page horizontal spacing reduced by 0.25rem (1rem → 0.75rem). Component text styles audited and replaced with global typography classes.*
