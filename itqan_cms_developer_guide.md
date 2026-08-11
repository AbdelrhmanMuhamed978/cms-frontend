# Itqan CMS Frontend — Comprehensive Developer & Agent Guide

> **Purpose:** A complete reference for any developer or AI agent to add a feature, fix a bug, or
> contribute to this Angular 20 open-source Quranic CMS frontend. Uses the "Admin Home Overview
> Page" issue as a worked end-to-end example.

---

## Table of Contents

1. [Project Identity & Values](#1-project-identity--values)
2. [Technology Stack At-a-Glance](#2-technology-stack-at-a-glance)
3. [Architecture Overview](#3-architecture-overview)
4. [Directory Structure Deep Dive](#4-directory-structure-deep-dive)
5. [Key Patterns & Conventions](#5-key-patterns--conventions)
6. [Step-by-Step: Adding a Feature](#6-step-by-step-adding-a-feature)
7. [Step-by-Step: Fixing a Bug](#7-step-by-step-fixing-a-bug)
8. [Worked Example: Admin Home Overview Page](#8-worked-example-admin-home-overview-page)
9. [Common Pitfalls & Gotchas](#9-common-pitfalls--gotchas)
10. [Pre-PR Checklist](#10-pre-pr-checklist)

---

## 1. Project Identity & Values

Itqan CMS is an **open-source, community-maintained** Quranic Content Management System. The
project explicitly values:

- **Understanding over velocity** — Every contributor must understand the code they submit well
  enough to explain _why_ it works
- **Simplicity first** — Minimum code that solves the problem; no speculative abstractions
- **AI-assisted, human-owned** — Using AI tools is welcome; blindly pasting AI output is not

> [!IMPORTANT]
> Before opening a PR, you must: (1) understand the code, (2) run it locally, (3) test it including
> failure cases. A half-finished PR you understand is more welcome than a complete one you don't.

---

## 2. Technology Stack At-a-Glance

| Layer | Technology | Version | Notes |
| ------------ | ------------------------------------------------- | -------- | ------------------------------------------------- |
| Framework | Angular (standalone components) | ^20.3.7 | No NgModules — every component is `standalone` |
| Language | TypeScript | ~5.9.2 | Strict mode enabled |
| UI Library | NG-ZORRO (Ant Design for Angular) | ^20.3.1 | Prefix: `nz-*` |
| Icons | @ng-icons/lucide | ^32.5.0 | Registered globally in `provide-app-lucide-icons.ts` |
| i18n | @ngx-translate/core | ^17.0.0 | JSON files at `/i18n/{lang}.json`, Arabic default |
| Styling | LESS | ^4.2.0 | CSS variables in `theme.less`, BEM naming |
| Auth Backend | django-allauth (headless SPA mode) | — | Session token + JWT, 6 HTTP interceptors |
| Monitoring | Sentry | ^10.47.0 | Prod/staging only |
| State Mgmt | RxJS + Angular Signals | ~7.8.0 | `signal()`, `computed()`, `input()`, `output()` |
| Testing | Karma + Jasmine | — | `npm run test` |
| Linting | ESLint (flat config) + Prettier | — | `npm run lint`, pre-commit hooks |
| Commits | Conventional Commits + Husky + lint-staged | — | Enforced by git hooks |
| Deployment | Netlify | — | `staging` → staging, `master` → production |

---

## 3. Architecture Overview

### High-Level Request Flow

```
User Browser
    │
    ├── Angular SPA (standalone components, Signals)
    │       │
    │       ├── Auth Layer (django-allauth headless)
    │       │       POST /auth/* → Django allauth
    │       │       Token: localStorage (sessionToken + JWTs) + cross-tab sync
    │       │
    │       ├── CMS API Layer (HttpClient + interceptors)
    │       │       GET/POST /cms-api/* → Django REST API
    │       │
    │       └── Admin Portal Layer
    │               GET/POST /portal/* → Django admin API
    │
    ├── Sentry (error monitoring)
    ├── Google Analytics (usage tracking)
    └── Netlify (hosting, CD, edge redirects)
```

### Interceptor Pipeline (order matters)

```
Request:  credentials → csrfResponse → appSessionToken → tenantHeader → headers(CSRF+Accept-Language)
Response: authError → error
```

### Authentication Flow

1. `APP_INITIALIZER` fires `AuthService.bootstrapOnce()` without blocking (public pages paint immediately)
2. Provisional user from `localStorage` allows admin guards to work without flash
3. Background validation: GET `/auth/session` → GET `/auth/profile/` (permissions merge)
4. Public routes never wait; `authGuard` / `portalAccessGuard` / `permissionGuard` wait on `authReady`
5. Login: POST `/auth/login` → `session_token`. Interceptor attaches `X-Session-Token`
6. 401 recovery: recheck → `SESSION_EXPIRED` → login redirect

### Admin Portal Authorization

```
authGuard (requires login)
    └── portalAccessGuard (requires `portal_access` permission)
        └── tenantReadyGuard (ensures publisher tenant is selected)
            └── permissionGuard({ permissions: [...] })  (per-route)
```

Key file: [portal-permission.constants.ts](file:///d:/fanar/cms-frontend/src/app/features/admin/constants/portal-permission.constants.ts)

---

## 4. Directory Structure Deep Dive

```
cms-frontend/
├── public/
│   ├── assets/images/, icons/, data/     # Static assets (Quran JSON, logos)
│   └── i18n/en.json, ar.json            # ~1486 translation keys each
├── src/
│   ├── index.html                        # Root HTML (Arabic RTL default, Inter font)
│   ├── main.ts                           # Angular bootstrap + Sentry init
│   ├── styles.less                       # Global utilities (sr-only, card, flex)
│   ├── theme.less                        # CSS vars + NG-ZORRO overrides
│   ├── environments/                     # 5 env configs
│   └── app/
│       ├── app.ts                        # Root component
│       ├── app.config.ts                 # All providers (interceptors, auth, i18n, Sentry)
│       ├── app.routes.ts                 # Complete route table
│       ├── core/                         # Auth, interceptors, guards, services
│       │   ├── auth/                     # 22 pages + service + 3 guards + headless API
│       │   ├── interceptors/             # 6 HTTP interceptors (order matters!)
│       │   ├── guards/                   # publisherHostGuard
│       │   ├── services/                 # Analytics, WebVitals, Viewport
│       │   └── constants/, enums/        # Breakpoints, categories, licenses
│       ├── features/                     # Feature modules
│       │   ├── admin/                    # Full admin portal
│       │   │   ├── admin-layout.component.*     # Shell (sidebar + header + router-outlet)
│       │   │   ├── admin-portal-redirect.*      # Default `/admin` → first allowed module
│       │   │   ├── admin.routes.ts              # Fallback admin routes (coming-soon)
│       │   │   ├── guards/                      # portal-access, permission, itqan-admin, tenant-ready
│       │   │   ├── constants/                   # PORTAL_PERMISSIONS
│       │   │   ├── services/                    # AdminAuthService, AdminTenantService
│       │   │   ├── utils/                       # AdminListBase, display-localization
│       │   │   ├── styles/                      # admin-global.less, admin-shared.less
│       │   │   ├── components/                  # Shared admin: column-picker, coming-soon, section-layout
│       │   │   ├── recitations/                 # CRUD module (canonical pattern)
│       │   │   ├── tafsirs/                     # CRUD module
│       │   │   ├── translations/                # CRUD module
│       │   │   ├── mushafs/                     # CRUD module
│       │   │   ├── fonts/                       # CRUD module
│       │   │   ├── reciters/                    # CRUD module
│       │   │   ├── publishers/                  # CRUD module (Itqan admin only)
│       │   │   ├── issues/                      # CRUD module
│       │   │   ├── members/                     # Publisher members
│       │   │   ├── access-requests/             # Asset access requests
│       │   │   ├── usage/                       # API usage analytics
│       │   │   └── audio/, software/, programs/ # Stubs / dormant
│       │   ├── gallery/                 # Browse, search, download assets
│       │   ├── publishers/              # Publisher profiles
│       │   ├── reciters/                # Reciter profiles
│       │   ├── license/                 # License detail pages
│       │   ├── content-standards/       # Content usage guidelines
│       │   └── error/                   # 404, 401 pages
│       ├── shared/                      # 16 reusable components + 3 utils
│       └── icons/                       # Lucide icon registry (67 icons)
```

### File Naming Conventions

| Type | Pattern | Example |
| --------- | ----------------------------- | ------------------------------------- |
| Page | `*.page.ts` | `gallery.page.ts` |
| Component | `*.component.ts` | `asset-card.component.ts` |
| Service | `*.service.ts` | `recitations.service.ts` |
| Guard | `*.guard.ts` | `permission.guard.ts` |
| Model | `*.models.ts` or `*.model.ts` | `recitations.models.ts` |
| Pipe | `*.pipe.ts` | `admin-hijri-year.pipe.ts` |
| Util | `*.util.ts` | `display-localization.util.ts` |
| Route | `*.routes.ts` | `recitations.routes.ts` |
| Style | `*.less` | `recitations-list.component.less` |
| Test | `*.spec.ts` | `permission.guard.spec.ts` |

---

## 5. Key Patterns & Conventions

### 5.1 Standalone Components (No NgModules)

Every component uses `standalone: true` and imports dependencies directly:

```typescript
@Component({
  selector: 'app-my-component',
  standalone: true,
  imports: [RouterLink, NzCardModule, NzGridModule, NgIcon, TranslateModule],
  templateUrl: './my-component.component.html',
  styleUrls: ['./my-component.component.less'],
})
export class MyComponent {}
```

### 5.2 Signal-Based State

Use Angular Signals for reactive state management:

```typescript
// Writable signals
readonly loading = signal(false);
readonly items = signal<Item[]>([]);

// Computed (derived) signals
readonly isEmpty = computed(() => this.items().length === 0);

// Signal inputs/outputs
title = input.required<string>();
clicked = output<void>();
```

### 5.3 Async Data Fetching

API calls use `Observable` with `subscribe()` or `async/await` with `firstValueFrom`:

```typescript
// Observable pattern (preferred for list components)
load(): void {
  this.loading.set(true);
  this.service.getList({ page: this.page(), page_size: this.pageSize() })
    .subscribe({
      next: (res) => {
        this.items.set(res.results);
        this.total.set(res.count);
        this.loading.set(false);
      },
      error: () => { this.loading.set(false); },
    });
}

// Async/await pattern (for sequential flows)
async ngOnInit(): Promise<void> {
  await firstValueFrom(toObservable(this.authService.authReady).pipe(filter(Boolean), take(1)));
  // ... proceed
}
```

### 5.4 Subscription Cleanup

Use `DestroyRef` + `takeUntilDestroyed`:

```typescript
private readonly destroyRef = inject(DestroyRef);

constructor() {
  this.someObservable$
    .pipe(takeUntilDestroyed(this.destroyRef))
    .subscribe(/* ... */);
}
```

### 5.5 i18n (Internationalization)

- **All** user-facing strings must use translation keys — never hardcode text
- Translation files: `public/i18n/en.json` and `public/i18n/ar.json` (nested JSON objects)
- Arabic is the default language; RTL is the default direction
- **Key structure is nested**: `ADMIN.MENU.RECITATIONS` maps to `{ "ADMIN": { "MENU": { "RECITATIONS": "..." } } }`

**In templates:**
```html
<h1>{{ 'ADMIN.COMMON.COMING_SOON' | translate }}</h1>
<p>{{ 'COMMON.REDIRECT_TO_LIBRARY_IN' | translate: { seconds: countdownSeconds() } }}</p>
```

**In TypeScript:**
```typescript
private readonly translate = inject(TranslateService);
const text = this.translate.instant('ADMIN.COMMON.SAVE');
```

> [!IMPORTANT]
> After adding/modifying keys, run `npm run check:i18n` to validate both `en.json` and `ar.json`
> have matching, non-empty Arabic values. CI will block merges on failure.

### 5.6 RTL/LTR Support

- Use **logical CSS properties**: `margin-inline-start`, `padding-inline-end`, `inset-inline-start`
- Never use `margin-left`/`margin-right` for directional spacing
- Transform utilities: `.ltr-flip` and `.rtl-flip` for icons that need mirroring
- The layout component tracks direction: `layoutDir()` signal updates on language change

### 5.7 Styling with LESS + CSS Variables

- Component styles are scoped via Angular view encapsulation (`.less` files per component)
- Global admin styles live in [admin-global.less](file:///d:/fanar/cms-frontend/src/app/features/admin/styles/admin-global.less) (loaded via `angular.json`, not imported)
- Theme tokens defined in [theme.less](file:///d:/fanar/cms-frontend/src/theme.less): `--color-primary-*`, `--admin-text-*`, `--radius-*`, `--shadow-card`, etc.
- Follow **BEM naming** for CSS classes: `.block__element--modifier`

### 5.8 Icon Usage

Icons come from `@ng-icons/lucide`, registered globally in [provide-app-lucide-icons.ts](file:///d:/fanar/cms-frontend/src/app/icons/provide-app-lucide-icons.ts).

```html
<ng-icon name="lucideVolume2" aria-hidden="true" />
```

> [!WARNING]
> If you use a new Lucide icon that isn't already registered, you **must** add it to
> [provide-app-lucide-icons.ts](file:///d:/fanar/cms-frontend/src/app/icons/provide-app-lucide-icons.ts).
> Import from `@ng-icons/lucide` and add to the `provideIcons({...})` call.

### 5.9 Admin CRUD Module Pattern

Every admin entity follows the same structure:

```
features/admin/{entity}/
├── {entity}.routes.ts              # Route definitions with permissionGuard
├── {entity}-layout.component.ts    # Optional layout wrapper (RouterOutlet)
├── components/
│   ├── {entity}-list/              # List page (extends AdminListBase)
│   ├── {entity}-form/              # Create + Edit form (shared component)
│   ├── {entity}-detail/            # Detail view
│   └── {entity}-filters/           # Filter panel (optional)
├── models/
│   └── {entity}.models.ts          # TypeScript interfaces
└── services/
    └── {entity}.service.ts         # HTTP CRUD service
```

**Route pattern** ([recitations.routes.ts](file:///d:/fanar/cms-frontend/src/app/features/admin/recitations/recitations.routes.ts) as canonical):

```typescript
export const recitationRoutes: Routes = [
  {
    path: '',
    component: RecitationsLayoutComponent,
    children: [
      {
        path: '',
        canActivate: [permissionGuard({ permissions: [PORTAL_PERMISSIONS.PORTAL_READ_RECITATION] })],
        loadComponent: () => import('./components/recitations-list/recitations-list.component')
          .then((m) => m.RecitationsListComponent),
      },
      {
        path: 'create',
        canActivate: [permissionGuard({ permissions: [PORTAL_PERMISSIONS.PORTAL_CREATE_RECITATION] })],
        loadComponent: () => import('./components/recitation-form/recitation-form.component')
          .then((m) => m.RecitationFormComponent),
      },
      {
        path: ':slug/edit',
        canActivate: [permissionGuard({ permissions: [PORTAL_PERMISSIONS.PORTAL_UPDATE_RECITATION] })],
        loadComponent: () => import('./components/recitation-form/recitation-form.component')
          .then((m) => m.RecitationFormComponent),
      },
      {
        path: ':slug',
        canActivate: [permissionGuard({ permissions: [PORTAL_PERMISSIONS.PORTAL_READ_RECITATION] })],
        loadComponent: () => import('./components/recitation-detail/recitation-detail.component')
          .then((m) => m.RecitationDetailComponent),
      },
    ],
  },
];
```

**Service pattern** ([recitations.service.ts](file:///d:/fanar/cms-frontend/src/app/features/admin/recitations/services/recitations.service.ts) as canonical):

```typescript
@Injectable({ providedIn: 'root' })
export class RecitationsService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.ADMIN_API_BASE_URL}/recitations/`;

  getList(filters: Filters): Observable<ListResponse> {
    let params = new HttpParams()
      .set('page', filters.page.toString())
      .set('page_size', filters.page_size.toString());
    // ... add filter params
    return this.http.get<ListResponse>(this.apiUrl, { params });
  }

  getDetail(slug: string): Observable<Details> {
    return this.http.get<Details>(`${this.apiUrl}${slug}/`);
  }

  create(body: FormValue): Observable<Details> {
    return this.http.post<Details>(this.apiUrl, body);
  }

  patch(slug: string, body: Partial<FormValue>): Observable<Details> {
    return this.http.patch<Details>(`${this.apiUrl}${slug}/`, body);
  }

  delete(slug: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}${slug}/`);
  }
}
```

**List component pattern** (extends [AdminListBase](file:///d:/fanar/cms-frontend/src/app/features/admin/utils/admin-list-base.ts)):

```typescript
@Component({ /* ... */ })
export class RecitationsListComponent extends AdminListBase<RecitationListItem, RecitationListFilters> {
  private readonly service = inject(RecitationsService);
  private readonly adminAuth = inject(AdminAuthService);

  readonly canCreate = computed(() =>
    this.adminAuth.hasPermission(PORTAL_PERMISSIONS.PORTAL_CREATE_RECITATION)
  );

  constructor() {
    super();
    this.initList('admin-list-recitations');  // localStorage key for sort prefs
  }

  load(): void {
    this.loading.set(true);
    this.service.getList({ page: this.page(), page_size: this.pageSize(), ...this.activeFilters })
      .subscribe({
        next: (res) => { this.items.set(res.results); this.total.set(res.count); this.loading.set(false); },
        error: () => { this.loading.set(false); },
      });
  }
}
```

### 5.10 Permission System

Permissions are checked via [AdminAuthService](file:///d:/fanar/cms-frontend/src/app/features/admin/services/admin-auth.service.ts):

```typescript
// In a component
readonly canEdit = computed(() => this.adminAuth.hasPermission(PORTAL_PERMISSIONS.PORTAL_UPDATE_RECITATION));

// In a route guard
canActivate: [permissionGuard({ permissions: [PORTAL_PERMISSIONS.PORTAL_READ_RECITATION] })]

// In a template
@if (canEdit()) {
  <button nz-button>Edit</button>
}
```

### 5.11 Admin Layout & Sidebar

The admin shell is [AdminLayoutComponent](file:///d:/fanar/cms-frontend/src/app/features/admin/admin-layout.component.ts):
- Sidebar tabs are **dynamically computed** from user permissions via the `tabs()` computed signal
- Each tab is a `CmsTab` object: `{ id, path, label (i18n key), icon (lucide name) }`
- Adding a new sidebar entry = adding a new `CmsTab` constant + pushing it conditionally in `tabs()`

### 5.12 Multi-Tenant Publisher Context

The admin portal is multi-tenant:
- [AdminTenantService](file:///d:/fanar/cms-frontend/src/app/features/admin/services/admin-tenant.service.ts) manages the selected publisher
- `selectedPublisherId()` signal drives which publisher's data is shown
- The tenant header dropdown in the layout lets Itqan admins switch between publishers
- `tenantHeaderInterceptor` attaches the selected publisher context to API requests

---

## 6. Step-by-Step: Adding a Feature

### Phase 1: Research & Plan

1. **Read the issue** — Understand context, acceptance criteria, and "why"
2. **Read `PROJECT_MAP.md`** — Understand where the feature fits in the architecture
3. **Identify affected files** — Map which directories, routes, services, and i18n keys are involved
4. **Check for existing patterns** — Find the closest existing module that does something similar and follow that pattern exactly
5. **Identify dependencies** — Does this need new icons? New i18n keys? New permissions? New API endpoints?

### Phase 2: Setup

```bash
# 1. Branch from staging
git checkout staging
git pull upstream staging
git checkout -b feature/your-feature-name   # branch naming enforced by hooks

# 2. Install dependencies
npm install

# 3. Start dev server
npm start
# App available at http://localhost:4200
```

### Phase 3: Implement

Follow this order to avoid broken intermediate states:

1. **Models** — Define TypeScript interfaces first (`models/{entity}.models.ts`)
2. **Service** — HTTP layer for any API calls (`services/{entity}.service.ts`)
3. **i18n keys** — Add keys to BOTH `en.json` AND `ar.json` (nested structure)
4. **Icons** — Register any new Lucide icons in `provide-app-lucide-icons.ts`
5. **Component** — Build the component (`.ts`, `.html`, `.less`)
6. **Routes** — Wire the component into the route table
7. **Sidebar** — If admin, add the tab to `AdminLayoutComponent.tabs()` (if applicable)
8. **Permissions** — Add permission constants and guard wiring (if applicable)

### Phase 4: Verify

```bash
# Run linting
npm run lint

# Check i18n parity
npm run check:i18n

# Run tests
npm run test

# Build to verify no compile errors
npm run build
```

### Phase 5: Commit & PR

```bash
# Commit with conventional format
git add .
git commit -m "feat(admin): add admin home overview page"

# Push and create PR to staging
git push origin feature/admin-home-page
```

---

## 7. Step-by-Step: Fixing a Bug

### Phase 1: Reproduce & Diagnose

1. **Reproduce the bug** — Run locally, navigate to the affected area, confirm the behavior
2. **Read `PROJECT_MAP.md`** — Locate the relevant feature module, component, and service
3. **Trace the data flow** — From route → component → service → API → response → template
4. **Identify root cause** — Is it a template binding? A service logic error? A missing guard? A CSS issue?

### Phase 2: Surgical Fix

> [!CAUTION]
> Touch ONLY what must be touched. Do not reformat adjacent code, rewrite old comments, or refactor
> working code. Match existing style exactly, even if imperfect.

1. **Fix the specific issue** — Minimum diff that resolves the bug
2. **Clean your own mess** — If your fix orphans an import or function, remove it. Leave pre-existing dead code alone
3. **Add/update tests** — Write a test that would have caught the bug

### Phase 3: Verify

- Run the same verification steps as in feature development
- Manually test the fix AND test that adjacent functionality still works
- Ensure existing tests still pass

---

## 8. Worked Example: Admin Home Overview Page

> **Issue summary:** The admin root route (`/admin`) currently shows a blank redirect component.
> Replace it with a grid of section cards so content managers can visually discover available admin
> modules.

### 8.1 Analyze the Current State

Currently, `/admin` with `pathMatch: 'full'` loads [AdminPortalRedirectComponent](file:///d:/fanar/cms-frontend/src/app/features/admin/admin-portal-redirect.component.ts) — a zero-template component that immediately redirects to the first allowed module. Users see a blank flash before redirect.

The route is in [app.routes.ts](file:///d:/fanar/cms-frontend/src/app/app.routes.ts#L28-L35):

```typescript
{
  path: '',
  pathMatch: 'full',
  loadComponent: () =>
    import('./features/admin/admin-portal-redirect.component')
      .then((m) => m.AdminPortalRedirectComponent),
},
```

### 8.2 Identify What Needs to Change

| File | Action | Why |
| --- | --- | --- |
| `admin-home.component.ts` | **CREATE** | New standalone component with section card data |
| `admin-home.component.html` | **CREATE** | Grid template using `nz-row`, `nz-col`, `nz-card` |
| `admin-home.component.less` | **CREATE** | Card styling + hover effects + responsive grid |
| `app.routes.ts` | **MODIFY** | Change default admin child route to load AdminHomeComponent |
| `public/i18n/en.json` | **MODIFY** | Add `ADMIN.HOME.*` section keys |
| `public/i18n/ar.json` | **MODIFY** | Add matching Arabic translations |
| `provide-app-lucide-icons.ts` | **CHECK** | Verify all needed icons are registered |

### 8.3 Step-by-Step Implementation

#### Step 1: Check Icon Availability

Looking at the sidebar tab definitions in [admin-layout.component.ts](file:///d:/fanar/cms-frontend/src/app/features/admin/admin-layout.component.ts#L33-L98), the icons used are:

- `lucideVolume2` (Recitations) ✅ registered
- `lucideImage` → not used; for Assets we could use `lucideLayers` ✅ registered
- `lucideMusic` (Audio) ✅ registered
- `lucideBarChart2` (Analytics/Usage) ✅ registered

All icons mentioned in the issue are already in [provide-app-lucide-icons.ts](file:///d:/fanar/cms-frontend/src/app/icons/provide-app-lucide-icons.ts). No changes needed.

#### Step 2: Add i18n Keys

Add to the existing nested `ADMIN.HOME` object in both JSON files:

**`en.json`** — add under `"ADMIN"` → `"HOME"`:
```json
"HOME": {
  "TITLE": "Admin Overview",
  "SUBTITLE": "Choose a section to manage",
  "SECTION_RECITATIONS": "Recitations",
  "SECTION_RECITATIONS_DESC": "Manage Quranic audio recitations and their tracks",
  "SECTION_TAFSIRS": "Tafsirs",
  "SECTION_TAFSIRS_DESC": "Manage exegesis (tafsir) content and versions",
  "SECTION_TRANSLATIONS": "Translations",
  "SECTION_TRANSLATIONS_DESC": "Manage Quran translations and their versions",
  "SECTION_MUSHAFS": "Mushafs",
  "SECTION_MUSHAFS_DESC": "Manage Mushaf assets and their versions",
  "SECTION_FONTS": "Fonts",
  "SECTION_FONTS_DESC": "Manage Quranic font assets and their versions",
  "SECTION_RECITERS": "Reciters",
  "SECTION_RECITERS_DESC": "Manage reciter profiles and biographical data",
  "SECTION_PUBLISHERS": "Publishers",
  "SECTION_PUBLISHERS_DESC": "Manage publisher organizations and profiles",
  "SECTION_ISSUES": "Issue Reports",
  "SECTION_ISSUES_DESC": "Review and manage reported content issues",
  "SECTION_MEMBERS": "Members",
  "SECTION_MEMBERS_DESC": "Manage publisher team members and invitations",
  "SECTION_ACCESS_REQUESTS": "Access Requests",
  "SECTION_ACCESS_REQUESTS_DESC": "Review and manage asset access requests",
  "SECTION_USAGE": "API Usage",
  "SECTION_USAGE_DESC": "View API usage analytics and statistics"
}
```

**`ar.json`** — add matching Arabic values (must be non-empty for CI to pass).

#### Step 3: Create the Component

**File:** `src/app/features/admin/pages/admin-home/admin-home.component.ts`

```typescript
import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgIcon } from '@ng-icons/core';
import { TranslateModule } from '@ngx-translate/core';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { PORTAL_PERMISSIONS } from '../../constants/portal-permission.constants';
import { AdminAuthService } from '../../services/admin-auth.service';

interface AdminSection {
  titleKey: string;
  descriptionKey: string;
  icon: string;
  route: string;
  permission: string;
}

const ADMIN_SECTIONS: AdminSection[] = [
  {
    titleKey: 'ADMIN.HOME.SECTION_RECITATIONS',
    descriptionKey: 'ADMIN.HOME.SECTION_RECITATIONS_DESC',
    icon: 'lucideVolume2',
    route: '/admin/recitations',
    permission: PORTAL_PERMISSIONS.PORTAL_READ_RECITATION,
  },
  {
    titleKey: 'ADMIN.HOME.SECTION_TAFSIRS',
    descriptionKey: 'ADMIN.HOME.SECTION_TAFSIRS_DESC',
    icon: 'lucideGraduationCap',
    route: '/admin/tafsirs',
    permission: PORTAL_PERMISSIONS.PORTAL_READ_TAFSIR,
  },
  {
    titleKey: 'ADMIN.HOME.SECTION_TRANSLATIONS',
    descriptionKey: 'ADMIN.HOME.SECTION_TRANSLATIONS_DESC',
    icon: 'lucideGlobe',
    route: '/admin/translations',
    permission: PORTAL_PERMISSIONS.PORTAL_READ_TRANSLATION,
  },
  {
    titleKey: 'ADMIN.HOME.SECTION_MUSHAFS',
    descriptionKey: 'ADMIN.HOME.SECTION_MUSHAFS_DESC',
    icon: 'lucideBookOpen',
    route: '/admin/mushafs',
    permission: PORTAL_PERMISSIONS.PORTAL_READ_MUSHAF,
  },
  {
    titleKey: 'ADMIN.HOME.SECTION_FONTS',
    descriptionKey: 'ADMIN.HOME.SECTION_FONTS_DESC',
    icon: 'lucideType',
    route: '/admin/fonts',
    permission: PORTAL_PERMISSIONS.PORTAL_READ_FONT,
  },
  {
    titleKey: 'ADMIN.HOME.SECTION_RECITERS',
    descriptionKey: 'ADMIN.HOME.SECTION_RECITERS_DESC',
    icon: 'lucideMic',
    route: '/admin/reciters',
    permission: PORTAL_PERMISSIONS.PORTAL_READ_RECITER,
  },
  // Add more sections as needed...
];

@Component({
  selector: 'app-admin-home',
  standalone: true,
  imports: [RouterLink, NzCardModule, NzGridModule, NgIcon, TranslateModule],
  templateUrl: './admin-home.component.html',
  styleUrls: ['./admin-home.component.less'],
})
export class AdminHomeComponent {
  private readonly adminAuth = inject(AdminAuthService);

  /** Only show sections the user has permission to view. */
  readonly visibleSections = computed(() =>
    ADMIN_SECTIONS.filter((s) => this.adminAuth.hasPermission(s.permission))
  );
}
```

**Why this design:**
- Uses `computed()` signal to reactively filter sections by permission — consistent with how `AdminLayoutComponent.tabs()` works
- Reuses existing `PORTAL_PERMISSIONS` constants — no new permission concepts
- Data-driven: sections are a static array, not hardcoded in the template
- The `AdminAuthService` dependency is the same one used by the sidebar and guards

#### Step 4: Create the Template

**File:** `src/app/features/admin/pages/admin-home/admin-home.component.html`

```html
<div class="admin-home">
  <div class="admin-home__header">
    <h1 class="admin-home__title">{{ 'ADMIN.HOME.TITLE' | translate }}</h1>
    <p class="admin-home__subtitle">{{ 'ADMIN.HOME.SUBTITLE' | translate }}</p>
  </div>

  <div nz-row [nzGutter]="[16, 16]">
    @for (section of visibleSections(); track section.route) {
      <div nz-col [nzXs]="24" [nzSm]="12" [nzLg]="8" [nzXl]="6">
        <a [routerLink]="section.route" class="admin-home__card-link">
          <nz-card class="admin-home__card" [nzHoverable]="true">
            <div class="admin-home__card-body">
              <div class="admin-home__icon-wrap">
                <ng-icon [name]="section.icon" class="admin-home__icon" aria-hidden="true" />
              </div>
              <h3 class="admin-home__card-title">{{ section.titleKey | translate }}</h3>
              <p class="admin-home__card-desc">{{ section.descriptionKey | translate }}</p>
            </div>
          </nz-card>
        </a>
      </div>
    }
  </div>
</div>
```

**Why this design:**
- `nz-row` / `nz-col` with responsive breakpoints (`nzXs=24` → full width on mobile, `nzSm=12` → 2 cols, `nzLg=8` → 3 cols, `nzXl=6` → 4 cols) — follows NG-ZORRO grid system
- `nz-card` with `nzHoverable` — built-in hover elevation from NG-ZORRO
- `[routerLink]` — SPA navigation without page reload (acceptance criterion)
- `@for` with `track section.route` — Angular 20 control flow
- All text via `translate` pipe — i18n compliant

#### Step 5: Create the Styles

**File:** `src/app/features/admin/pages/admin-home/admin-home.component.less`

```less
.admin-home {
  padding: 24px 16px;

  &__header {
    margin-bottom: 24px;
  }

  &__title {
    font-size: 1.5rem;
    font-weight: 600;
    color: var(--admin-text-900);
    margin: 0 0 4px;
  }

  &__subtitle {
    font-size: 0.875rem;
    color: var(--admin-text-500);
    margin: 0;
  }

  &__card-link {
    display: block;
    text-decoration: none;
    color: inherit;
    border-radius: var(--radius-lg);
    transition: transform 0.2s ease;

    &:hover {
      transform: translateY(-2px);
    }

    &:focus-visible {
      outline: 2px solid var(--color-primary-400);
      outline-offset: 2px;
      border-radius: var(--radius-lg);
    }
  }

  &__card {
    height: 100%;
    border-radius: var(--radius-lg);
    transition: box-shadow 0.2s ease;
  }

  &__card-body {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  &__icon-wrap {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    border-radius: var(--radius-md);
    background: var(--color-primary-50);
    color: var(--color-primary-700);
  }

  &__icon {
    font-size: 20px;
  }

  &__card-title {
    font-size: 1rem;
    font-weight: 600;
    color: var(--admin-text-900);
    margin: 0;
  }

  &__card-desc {
    font-size: 0.8125rem;
    color: var(--admin-text-500);
    margin: 0;
    line-height: 1.5;
  }
}
```

**Why this design:**
- Uses existing CSS variables from `theme.less` (`--admin-text-*`, `--color-primary-*`, `--radius-*`)
- BEM naming convention (matches project style)
- Logical properties work for RTL because `flex-start` in a RTL context mirrors correctly
- `translateY(-2px)` hover — subtle, accessible animation
- `:focus-visible` outline — accessibility requirement

#### Step 6: Update the Route

In [app.routes.ts](file:///d:/fanar/cms-frontend/src/app/app.routes.ts#L28-L35), change the default admin child:

```diff
 {
   path: '',
   pathMatch: 'full',
   loadComponent: () =>
-    import('./features/admin/admin-portal-redirect.component').then(
-      (m) => m.AdminPortalRedirectComponent
+    import('./features/admin/pages/admin-home/admin-home.component').then(
+      (m) => m.AdminHomeComponent
     ),
 },
```

> [!WARNING]
> The `AdminPortalRedirectComponent` currently provides auto-redirect for users who navigate to
> `/admin`. Replacing it with a home page changes behavior: users will now see a card grid instead
> of being auto-redirected. Verify this is acceptable per the issue requirements. You may want to
> keep the redirect component as a fallback for users with no permissions.

#### Step 7: Verify

1. **Run locally:** `npm start` → navigate to `/admin` → see card grid
2. **Test RTL:** Switch to Arabic → cards should lay out correctly right-to-left
3. **Test permissions:** Log in as a user with limited permissions → only permitted sections show
4. **Test navigation:** Click a card → navigates to the correct section without page reload
5. **Test responsive:** Resize browser → grid adapts (4 cols → 3 → 2 → 1)
6. **Run i18n check:** `npm run check:i18n`
7. **Run lint:** `npm run lint`
8. **Run tests:** `npm run test`
9. **Run build:** `npm run build`

---

## 9. Common Pitfalls & Gotchas

### ❌ Forgetting to Register Icons

If you use `<ng-icon name="lucideNewIcon" />` without registering it in
`provide-app-lucide-icons.ts`, you'll get a silent render failure — no error, just no icon.

### ❌ Hardcoding Strings

Every user-facing string must go through the `translate` pipe or `TranslateService`. CI will catch
missing Arabic values, but it won't catch hardcoded English strings in templates.

### ❌ Using `margin-left` / `margin-right`

This breaks RTL layouts. Always use `margin-inline-start` / `margin-inline-end` or logical flex
properties.

### ❌ Forgetting Arabic i18n Values

`npm run check:i18n` validates that every key present in the union of `en.json` + `ar.json` has a
non-empty Arabic value. If you add an English key without an Arabic counterpart, CI blocks the merge.

### ❌ Modifying Interceptor Order

The interceptor pipeline in [app.config.ts](file:///d:/fanar/cms-frontend/src/app/app.config.ts#L57-L67) has a specific order. Changing it can break auth, CSRF, or error handling.

### ❌ Not Gating Admin Features by Permission

Every admin route and UI action must check permissions via `permissionGuard` (routes) and
`AdminAuthService.hasPermission()` (templates/components). Ungated features are a security issue.

### ❌ Breaking the Conventional Commit Format

Husky + commitlint will reject commits that don't follow `type(scope): subject`. Valid types:
`feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`.

### ❌ Using `any` Type

TypeScript strict mode is enabled. Avoid `any` — define proper interfaces in `models/` files.

### ❌ Not Using `standalone: true`

This project has zero NgModules. Every new component must be `standalone: true` with explicit imports.

### ❌ Creating a Service Without `providedIn: 'root'`

Unless there's a specific reason for scoped injection, use `@Injectable({ providedIn: 'root' })` for
tree-shaking.

---

## 10. Pre-PR Checklist

```
[ ] I understand every line of code I'm submitting
[ ] I ran the app locally and tested the feature/fix manually
[ ] I tested edge cases and failure scenarios
[ ] All user-facing strings use translation keys in both en.json and ar.json
[ ] npm run check:i18n passes
[ ] npm run lint passes with zero warnings
[ ] npm run test passes
[ ] npm run build succeeds
[ ] My branch name follows the pattern: type/description-in-kebab-case
[ ] My commit messages follow conventional commits: type(scope): subject
[ ] I used standalone components with explicit imports
[ ] I used Angular Signals (not BehaviorSubject) for new reactive state
[ ] I used logical CSS properties for RTL support
[ ] I used existing CSS variables from theme.less
[ ] I followed BEM naming for CSS classes
[ ] New icons are registered in provide-app-lucide-icons.ts
[ ] Admin routes are gated with appropriate permissionGuard
[ ] I did NOT modify unrelated code, comments, or formatting
[ ] PR targets the staging branch (not master)
```

---

## Quick Reference: Key Files

| Purpose | File |
| --- | --- |
| App routes | [app.routes.ts](file:///d:/fanar/cms-frontend/src/app/app.routes.ts) |
| App config (providers) | [app.config.ts](file:///d:/fanar/cms-frontend/src/app/app.config.ts) |
| Admin layout (sidebar) | [admin-layout.component.ts](file:///d:/fanar/cms-frontend/src/app/features/admin/admin-layout.component.ts) |
| Admin default redirect | [admin-portal-redirect.component.ts](file:///d:/fanar/cms-frontend/src/app/features/admin/admin-portal-redirect.component.ts) |
| Admin fallback routes | [admin.routes.ts](file:///d:/fanar/cms-frontend/src/app/features/admin/admin.routes.ts) |
| Permission constants | [portal-permission.constants.ts](file:///d:/fanar/cms-frontend/src/app/features/admin/constants/portal-permission.constants.ts) |
| Admin auth service | [admin-auth.service.ts](file:///d:/fanar/cms-frontend/src/app/features/admin/services/admin-auth.service.ts) |
| Admin tenant service | [admin-tenant.service.ts](file:///d:/fanar/cms-frontend/src/app/features/admin/services/admin-tenant.service.ts) |
| Admin list base class | [admin-list-base.ts](file:///d:/fanar/cms-frontend/src/app/features/admin/utils/admin-list-base.ts) |
| Permission guard | [permission.guard.ts](file:///d:/fanar/cms-frontend/src/app/features/admin/guards/permission.guard.ts) |
| Portal access guard | [portal-access.guard.ts](file:///d:/fanar/cms-frontend/src/app/features/admin/guards/portal-access.guard.ts) |
| Icon registry | [provide-app-lucide-icons.ts](file:///d:/fanar/cms-frontend/src/app/icons/provide-app-lucide-icons.ts) |
| Theme variables | [theme.less](file:///d:/fanar/cms-frontend/src/theme.less) |
| Admin global styles | [admin-global.less](file:///d:/fanar/cms-frontend/src/app/features/admin/styles/admin-global.less) |
| Global utilities | [styles.less](file:///d:/fanar/cms-frontend/src/styles.less) |
| English i18n | [en.json](file:///d:/fanar/cms-frontend/public/i18n/en.json) |
| Arabic i18n | [ar.json](file:///d:/fanar/cms-frontend/public/i18n/ar.json) |
| Environment config | [environment.ts](file:///d:/fanar/cms-frontend/src/environments/environment.ts) |
| CRUD pattern (routes) | [recitations.routes.ts](file:///d:/fanar/cms-frontend/src/app/features/admin/recitations/recitations.routes.ts) |
| CRUD pattern (service) | [recitations.service.ts](file:///d:/fanar/cms-frontend/src/app/features/admin/recitations/services/recitations.service.ts) |
| CRUD pattern (list) | [recitations-list.component.ts](file:///d:/fanar/cms-frontend/src/app/features/admin/recitations/components/recitations-list/recitations-list.component.ts) |
| Project map | [PROJECT_MAP.md](file:///d:/fanar/cms-frontend/PROJECT_MAP.md) |
| Contributing guide | [CONTRIBUTING.md](file:///d:/fanar/cms-frontend/CONTRIBUTING.md) |
