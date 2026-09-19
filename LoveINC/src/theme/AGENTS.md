# Shared presentation ownership

- variables.scss owns shared design tokens. headers.scss owns toolbar typography, colors, and title alignment. cards.scss owns card surfaces, icon insets/sizes, feed schedules, and action popovers. carousels.scss owns carousel presentation. home.scss owns only Home composition.
- Edit existing rules instead of appending competing overrides. Do not reintroduce page-level copies, inline static presentation styles, deep selectors, or zoom-based sizing.
- Header titles use Crimson Pro Light, charcoal, left alignment, and normal toolbar flow to reserve leading and trailing controls. Do not add typography utility classes to ion-title.
- Preserve small/large/xl content-card icons. Editorial carousel image-overlay and image-above cards share dimensions, with distinct text treatments. Verse preview is Crimson Pro Light at 1.14rem.
- Keep route behavior, conditional actions, content, and bottom navigation intact. Verify narrow and standard phone widths after shared changes.

- Photo-detail chrome in content-reader.scss also uses the shared header tokens. Use app-card-page on card/list ion-content surfaces. Main navigation headers reuse HeaderActionsComponent for Notifications and Donate. Notifications uses a native sheet with zero top safe-area inset, not manually positioned modal content.

- Preserve photo-detail scroll reveal: transparent header with white icons over the photo at the top; after scrolling, reveal the light surface, charcoal icons, and serif title. Reuse the existing edgeHeaderScrolled state in both detail and content-plan readers.

- Photo-detail hero titles and list-card titles share Crimson Pro at 1.5rem, weight 500, via the app-content-title tokens. Classes and Impact Stories lists use the shared photo More circle without a category pill; Home and Updates retain their category pills.

- Eyebrows/category labels, author labels, card dates, event/class schedules, and category badges use the single --app-font-size-xs token (0.75rem). Do not introduce compact or page-specific size overrides for this metadata.

- Shared Budget sheet presentation is owned by sheets.scss; component SCSS retains only unique content layout. Card title variants set --card-title-* values instead of repeating title declarations.
- Budget/Goal Tracker secondary text uses the standard XS/SM/body scale. The miniature habit badge intentionally retains its stacked 0.45rem month and 0.6rem day; these are confined to that control.
