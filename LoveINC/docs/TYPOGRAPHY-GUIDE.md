# Mobile App Typography Guide

**Canonical reference** for font sizes and typography in the Love INC mobile app. Follow this guide to avoid typography drift and maintain consistency.

---

## 1. Design Principles

- **Use few font sizes.** Material Design mobile uses ~4–5 sizes; iOS clusters around a handful. Hierarchy comes from **weight and color**, not many size steps.
- **All sizes use `rem`** for accessibility (respects user font-size preferences).
- **Never hardcode font sizes** in components. Always use CSS variables or typography utility classes.
- **Use semantic roles** (caption, body, title, display) rather than fine numeric gradations.

---

## 2. Text Size Scale (5 sizes)

Defined in `src/theme/variables.scss`:

| Variable | Value | Role | Use for |
|----------|-------|------|---------|
| `--app-font-size-xs` | 0.75rem | Extra small | CTA subtext, fine print, captions |
| `--app-font-size-sm` | 0.875rem | Small | Pills, badges, metadata, secondary text |
| `--app-font-size-body` | 1rem | Body | Default body, inputs, list secondary, buttons |
| `--app-font-size-title` | 1.25rem | Title | Card titles, section headings, list item titles |
| `--app-font-size-display` | 1.5rem | Display | Page titles, hero text, action-sheet headers |

**Aliases** (map to the scale): `--app-font-size-small`, `--app-font-size-large`, `--app-font-size-caption`, `--app-font-size-body-sm`, `--app-font-size-display-lg`, `--app-font-size-input`, `--app-font-size-tab-label`

---

## 3. Icon Size Scale (4 sizes)

| Variable | Value | Use for |
|----------|-------|---------|
| `--app-icon-size-sm` | 0.875rem | List chevrons, accordion toggles, card badges |
| `--app-icon-size-md` | 1.25rem | Header icons, card actions, inline icons |
| `--app-icon-size-lg` | 1.5rem | Tab bar, content cards, action sheet icons |
| `--app-icon-size-xl` | 2rem | FAB, empty states, scan success |

**Aliases** (map to the 4-size scale): `--app-icon-size-header`, `--app-icon-size-tab`, `--app-icon-size-fab`, `--app-icon-size-2xl`, `--app-icon-size-3xl`, `--app-icon-size-4xl`

---

## 4. Font Weights (3 tokens)

| Variable | Value | Use for |
|----------|-------|---------|
| `--app-font-weight-normal` | 400 | Body text |
| `--app-font-weight-medium` | 600 | Titles, buttons, labels |
| `--app-font-weight-bold` | 700 | Display, hero, emphasis |

**Alias:** `--app-font-weight-semibold` → `--app-font-weight-medium`

---

## 5. Typography Utility Classes

Defined in `src/theme/typography.scss`. Use these instead of inline font-size styles:

| Class | Size | Weight | Color |
|-------|------|--------|-------|
| `.app-title` | title | medium | primary |
| `.app-body` | body | normal | primary |
| `.app-body-secondary` | body | normal | secondary |
| `.app-body-sm` | sm | normal | primary |
| `.app-body-secondary-sm` | sm | normal | secondary |
| `.app-body-secondary-xs` | xs | normal | secondary (CTA subtext, fine print) |
| `.app-disclaimer` | sm | italic | danger |
| `.app-caption` | sm | medium | secondary |
| `.app-large`, `.app-display`, `.app-display-lg` | display | medium | accent |
| `.app-link` | body | normal | primary (blue) |

---

## 6. Semantic HTML (preferred)

Use semantic elements when possible; they inherit typography from global styles:

- `h1` → display, bold
- `h2`, `h3` → display, medium
- `h4`, `h5` → title, medium
- `h6` → body, medium
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
