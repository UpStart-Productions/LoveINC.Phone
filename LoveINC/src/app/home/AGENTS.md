# Home and shared visual design

- Approved design is shared app-wide. Use src/theme/variables.scss for design tokens and theme headers.scss, cards.scss, carousels.scss, and home.scss for their respective patterns.
- Do not restore Home-only copies, inline positioning styles, deep selectors, or zoom-based card sizing. Component styles are for behavior/layout unique to that component.
- Preserve all content, ordering, conditional visibility, routes, and actions. Home exposes the app's breadth.
- Headers use Crimson Pro Light, charcoal titles/icons, light backgrounds, left alignment, and flow layout that reserves space for leading controls.
- Verse preview uses Crimson Pro Light at 1.14rem. Content-card icons retain small/large/xl sizes, with equal top/right inset.
- Microlearning overlay and text-below cards share dimensions while preserving their distinct text treatments.
- Event/Class actions appear in the image badge popover, including conditional Volunteer, Calendar, and Share. Cards without banner images retain the action row.
- Keep Love INC palette and shared bottom navigation. Browser preview may lack device-local budget/habit data; do not force widgets visible in production.
