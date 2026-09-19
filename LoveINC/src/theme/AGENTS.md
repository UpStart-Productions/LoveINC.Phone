# Shared presentation ownership

- variables.scss owns shared design tokens. headers.scss owns toolbar typography, colors, and title alignment. cards.scss owns card surfaces, icon insets/sizes, feed schedules, and action popovers. carousels.scss owns carousel presentation. home.scss owns only Home composition.
- Edit existing rules instead of appending competing overrides. Do not reintroduce page-level copies, inline static presentation styles, deep selectors, or zoom-based sizing.
- Header titles use Crimson Pro Light, charcoal, left alignment, and normal toolbar flow to reserve leading and trailing controls. Do not add typography utility classes to ion-title.
- Preserve small/large/xl content-card icons. Editorial carousel image-overlay and image-above cards share dimensions, with distinct text treatments. Verse preview is Crimson Pro Light at 1.14rem.
- Keep route behavior, conditional actions, content, and bottom navigation intact. Verify narrow and standard phone widths after shared changes.
