# Learn refactor — GrovLink admin platform reference

Reference for rebuilding **Learn** in the Love INC mobile app. Summarizes what exists today in the **Nonprofit Mobile Platform** admin (`/Users/jeffdenton/Projects/Nonprofit.Mobile.Platform`) and how it compares to the current Love INC app.

**Status:** Planning reference. GrovLink **public microlearning endpoints are complete** (`GET /plans`, `GET /moments`). Love INC mobile implementation not started yet.

## The big picture

**Learning** is a new **parent nav group** under **Mobile App** in GrovLink admin. It is not its own page. It uses `path: '/learning'` only so the submenu expands and highlights when you are on a child route.

| Child nav item | Admin status |
| --- | --- |
| **Classes** | Mature — existing table CRUD, registrants, etc. |
| **Microlearning** | Substantial new work — the centerpiece of this refactor |
| **Tools** | Placeholder — “Coming soon” |

That grouping is the main product move: **Classes + Microlearning + (future) Tools** are treated as one **Learning** domain in admin, even though the Love INC mobile app still scatters those ideas across different tabs and static lists.

### Admin menu source

- `Nonprofit.Mobile.Platform/admin/src/app/layout/component/app.menu.ts`
- i18n labels: `menu.learning`, `menu.classes`, `menu.microlearning`, `menu.tools`

## Microlearning — data model

The admin models a **Plans → Moments → Blocks** stack.

### Plans

Curated learning paths with:

- Title, cover photo, tags, active toggle
- **Display style** (how the mobile app should render the plan):
  - `SINGLE_PAGE` — all moments on one scrollable screen
  - `MULTI_PAGE` — one moment per screen; swipe or tap to advance
  - `LIST` — moments as a list; tap to open each moment
- **Activation** — when a plan becomes available:
  - Attach to a **Class** (plan goes live with that cohort)
  - **Date range** (activation start / end)
  - Draft when neither is set

Schema also defines `EVERGREEN` and `SELF_PACED` activation types; the admin UI does not expose those yet. Today it is mostly class + date + draft.

### Moments

Reusable content units inside plans:

- **Title** is labeled internal in admin — public API still returns it; mobile can choose whether to display it
- **`shared`** flag in schema — allows reuse across multiple plans (back-burner)
- Ordered via `PlanMoment` join table

### Blocks

Ordered content inside a moment. Two roles:

**Content blocks**

| Type | Purpose |
| --- | --- |
| `RICH_TEXT` | HTML via Quill editor |
| `VIDEO` | YouTube or Vimeo embed |
| `PHOTO` | Image upload |
| `DOCUMENT` | PDF upload |

**Prompt blocks** (user responses stored separately per API schema comments)

| Type | Purpose |
| --- | --- |
| `TEXT_INPUT` | Label + placeholder text |
| `CHECKBOX` | Multiple options |
| `RADIO` | Single choice from options |

Each block has a stable **`blockId`** (mobile layout key, unique per moment) plus server `order`.

### Key platform files

| Area | Path |
| --- | --- |
| Prisma models | `Nonprofit.Mobile.Platform/apps/api/prisma/schema.prisma` — `Plan`, `Moment`, `MomentBlock`, `PlanMoment` |
| Shared DTOs (admin + public) | `Nonprofit.Mobile.Platform/libs/shared/src/lib/types.ts` — `PublicPlanDto`, `PublicMomentDto`, etc. |
| Admin API client | `Nonprofit.Mobile.Platform/libs/shared/src/lib/api-client.ts` — `adminPlans`, `adminMoments`, etc. |
| Public API | `Nonprofit.Mobile.Platform/api/src/app/public/public.controller.ts`, `public-api.service.ts` |
| Public mapper | `Nonprofit.Mobile.Platform/api/src/app/public/public-microlearning.mapper.ts` |
| Plans controller (admin) | `Nonprofit.Mobile.Platform/api/src/app/admin/admin-plans.controller.ts` |
| Moments controller (admin) | `Nonprofit.Mobile.Platform/api/src/app/admin/admin-moments.controller.ts` |
| Microlearning workspace | `Nonprofit.Mobile.Platform/admin/src/app/pages/microlearning/` |
| Moment editor | `.../microlearning/moment-form.page.ts` |
| Block definitions | `.../microlearning/blocks/` |
| Display style options | `.../microlearning/plan-display-style.ts` |

## Microlearning — admin UX (what’s built)

The **Microlearning workspace** is a two-panel layout:

- **Left:** Plans — search, create/edit modal, active toggle, cover photo, tags, class attachment, display-style picker
- **Right:** Moments — all moments or moments in the selected plan
- **Drag and drop:** Drag moments onto plans; reorder moments within a plan
- **Preview:** Modal preview of moment blocks (mirrors block types)
- **Moment editor:** Block composer with drag-reorder, autosave, staging uploads, collapse/duplicate/delete blocks

**Plans tie to Classes** for activation. Date ranges are the alternate activation path.

## Public API (GrovLink) — complete

Two read endpoints, same auth/path pattern as other public resources.

- **Auth:** `x-api-key` header
- **Base:** `GET /public/{customerSlug}/{tenantSlug}/…`
- **Upload URLs:** resolve relative media paths via `PlatformApiService.resolveUploadUrl()` (PHOTO/DOCUMENT block `content.url`)

### Endpoints

| Endpoint | Response wrapper | Purpose |
| --- | --- | --- |
| `GET /plans` | `{ plans: PublicPlanDto[] }` | **Primary mobile entry.** Active plans with nested moments and full blocks |
| `GET /moments` | `{ moments: PublicMomentDto[] }` | All tenant moments (with blocks), newest first — not filtered by plan membership |

There are **no** public routes for `GET /plans/:id`, `GET /plans/:slug`, or per-moment detail. Plan content for rendering comes entirely from **`GET /plans`** (nested payload).

### Server filtering (what the API enforces today)

| Resource | Filter |
| --- | --- |
| Plans | `isActive: true` only |
| Plans ordering | `title` ascending |
| Moments in a plan | Ordered by `PlanMoment.order`; includes full `blocks` |
| Standalone `/moments` | All moments for tenant; `updatedAt` descending |

**Not enforced server-side (mobile must handle):** `activationType`, `activationStart` / `activationEnd`, and `classId` / nested `class` are **returned on each plan** but the API does **not** hide plans outside a date window or gate by class registration. Love INC should apply activation rules client-side (and/or align with intake/class registration state).

### `PublicPlanDto` shape

Shared types: `libs/shared/src/lib/types.ts` (`PublicPlanDto`, `PublicPlanMomentDto`, `PublicPlansResponseDto`).

| Field | Notes |
| --- | --- |
| `id`, `slug`, `title` | Plan identity |
| `coverPhotoUrl` | Optional |
| `displayStyle` | `SINGLE_PAGE` \| `MULTI_PAGE` \| `LIST` |
| `activationType` | e.g. `DRAFT`, `CLASS`, `DATE_ACTIVATED` |
| `classId`, `class` | Optional `{ id, slug, title }` when attached to a class |
| `activationStart`, `activationEnd` | ISO strings; optional |
| `isActive` | Always `true` in this response |
| `tags` | Optional `TagListDto[]` |
| `moments` | Ordered `PublicPlanMomentDto[]` — **includes full blocks** |

Each **`PublicPlanMomentDto`**: `planMomentId`, `order`, `id`, `title`, `shared`, `blocks[]`, optional `tags`, timestamps.

Each **block** (`MomentBlockDto`): `id`, `order`, `blockId`, `type`, `content` (shape per block type — same as admin).

### `PublicMomentDto` shape (`GET /moments`)

`id`, `title`, `shared`, `blocks[]`, optional `tags`, timestamps. No plan membership info on this endpoint.

### Admin vs public

| Admin route | Public equivalent |
| --- | --- |
| `GET /admin/plans` + plan moments + moment detail | **`GET /plans`** (single call, nested) |
| `GET /admin/moments` + `GET /admin/moments/:id` | **`GET /moments`** (flat list with blocks) |

Admin-only fields omitted from public DTOs: `tenantId`, staging IDs, etc.

### Not in public API yet

- **Prompt response writes** — no `POST` for user answers; block `content` is config only
- **Home feed / CTAs** — plans not wired into `GET /home-feed` yet
- **Per-plan or per-slug fetch** — use list + find by `id` or `slug` client-side

### Love INC wiring (next steps)

1. Add types aligned with `PublicPlanDto` / `PublicMomentDto` in `src/app/services/platform/types.ts`
2. Add `getPlans()` and optionally `getMoments()` to `PlatformApiService`
3. See `docs/platform-api-integration.md` for endpoint table
4. Build Learn UI against `GET /plans`; apply activation gating in app logic
5. No static JSON fallback for plans/moments

## Still not built

- **Admin Tools** under Learning is empty — distinct from **Transformation Tools**, which remains its own top-level Mobile App nav item in admin.
- **Love INC Learn UI** — no plans/moments rendering yet; public API is ready; blocked on product IA + mobile work.
- **Prompt response sync** — no public write path; mobile storage/sync TBD.
- **Server-side activation gating** — class/date rules exposed as fields only; app must filter or platform adds logic later.

## Love INC app — current state

### Learn tab (`/tabs/tools`)

- Tab bar label: **Learn** (graduation-cap icon); route is still `tools`
- Static card list from `src/app/registered-tools.ts` (`REGISTERED_TOOL_CARDS`)
- Current cards: Tools for Transformation, Verse of the Day, Budget Planner, Goal Tracker, Your Journal
- Implemented via `src/app/tools/tools.page.html` + `ContentCardListComponent`

### Classes

- **Not** on the Learn tab today
- Live under **Services** at `/tabs/transformation-classes`
- Loaded from platform public API via `PlatformApiService.getClasses()`

### Microlearning

- **Nothing** in the app reads Plans or Moments yet
- **Platform:** `GET /plans` and `GET /moments` are live — see [Public API](#public-api-grovlink--complete) above

### Summary gap

| Concept | Admin (Learning group) | Love INC mobile today |
| --- | --- | --- |
| Classes | Under Learning | Under Services |
| Microlearning (Plans/Moments) | Admin + public API | Not implemented in app |
| Tools | Placeholder in admin | Static registered tool cards on Learn tab |
| Transformation Tools | Separate top-level nav | Card on Learn tab + own routes |

The admin is **ahead of the mobile app** on taxonomy and content model.

## Likely refactor scope (for conversation)

1. **Information architecture** — What belongs on Learn vs Services? Should classes move under Learn?
2. **Microlearning mobile rendering** — Three plan display styles × seven block types; prompt response storage (SQLite?)
3. **Tools unification** — Whether admin **Tools** and mobile **registered tools** become one system, or stay separate
4. **Public API** — Done on platform; wire `PlatformApiService` and build Learn UI
5. **Class-gated content** — Plans attached to classes may unlock content after registration/intake (align with existing `GapAccessService` / intake model?)

## Open product questions

- Do microlearning **plans** appear as first-class cards on Learn alongside tools and classes, or as content unlocked inside a class journey?
- Should **Verse of the Day**, **Journal**, **Budget**, etc. remain hard-coded registered tools, or eventually be admin-configurable under Learning → Tools?
- How do **prompt block responses** sync — local-only, platform-backed, or hybrid?
- Which **activation types** (`EVERGREEN`, `SELF_PACED`) matter for Love INC v1?

## Related docs

- `docs/platform-api-integration.md` — how Love INC calls GrovLink public API today
- `docs/TOOL-REGISTRATION.md` — current Learn tab tool cards (static, pre-refactor)

## Last updated

August 2026 — rescanned GrovLink; public `GET /plans` and `GET /moments` documented with DTO shapes and filtering behavior.
