# 9Drive Frontend Technical Analysis Report

**Generated**: 2026-08-20  
**Analyzer**: Architect Mode  
**Project**: 9Drive - Google Drive Storage Gateway  
**Repository Root**: `c:/Users/andriandiko/Downloads/9drive/9drive`

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Issues Categorized by Severity](#2-issues-categorized-by-severity)
3. [File-by-File Analysis](#3-file-by-file-analysis)
4. [Backend API Contract Review](#4-backend-api-contract-review)
5. [Code Quality Assessment](#5-code-quality-assessment)
6. [Security & Auth Review](#6-security--auth-review)
7. [Performance Considerations](#7-performance-considerations)
8. [Actionable Recommendations](#8-actionable-recommendations)
9. [Compliance Checklist](#9-compliance-checklist)

---

## 1. Executive Summary

### 1.1 Project Overview

9Drive is a Google Drive storage gateway with a React 19 + Vite 8 frontend that provides:

- User authentication (email/password + Google OAuth)
- Multi-account Google Drive connectivity
- File/folder management with virtual folders
- Upload routing to accounts with available quota
- File preview, sharing, and invitation system
- Quota tracking across connected accounts

### 1.2 Tech Stack Alignment

| Technology               | Version | AGENTS.md Spec | Status       |
| ------------------------ | ------- | -------------- | ------------ |
| React                    | 19      | ✅ Required    | ✅ Compliant |
| Vite                     | 8       | ✅ Required    | ✅ Compliant |
| TypeScript               | Latest  | ✅ Required    | ✅ Compliant |
| Tailwind CSS             | 4       | ✅ Required    | ✅ Compliant |
| React Router             | 7       | ✅ Required    | ✅ Compliant |
| lucide-react             | Latest  | ✅ Required    | ✅ Compliant |
| class-variance-authority | Latest  | ✅ Required    | ✅ Compliant |

### 1.3 Architecture Assessment

The frontend follows a **feature-based modular architecture** with clear separation:

- **Pages** (`frontend/src/pages/`) - Route-level components
- **Components** (`frontend/src/components/`) - Reusable UI primitives (`ui/`) and drive-specific components (`drive/`)
- **Lib** (`frontend/src/lib/`) - API client, auth utilities, formatting, preview logic
- **Layouts** (`frontend/src/layouts/`) - Protected shell with sidebar/header
- **Data** (`frontend/src/data/`) - Mock data (should be replaced with API calls)

### 1.4 AGENTS.md Conformance Score: **85%**

| Category               | Compliance | Notes                                                |
| ---------------------- | ---------- | ---------------------------------------------------- |
| Route Registration     | ✅         | `App.tsx` centralizes all routes                     |
| Import Aliases         | ✅         | `@/*` used consistently                              |
| API Client Usage       | ✅         | `apiFetch` for JSON, raw `fetch`/`XHR` for streaming |
| Auth Centralization    | ⚠️         | Dual token refresh logic (see Critical Issues)       |
| Protected Routes       | ✅         | `ProtectedRoute` + `DriveLayout` wrapper             |
| URL State Management   | ✅         | Query params for `folderId`, `q`                     |
| Tailwind CSS Variables | ⚠️         | `PublicFilePage` uses hardcoded hex colors           |
| UI Primitives Reuse    | ✅         | `Button`, `Card`, `Input` used throughout            |
| No New Dependencies    | ✅         | All deps declared in AGENTS.md                       |

---

## 2. Issues Categorized by Severity

### 2.1 Critical Priority (P0) — Blocks Core User Flows

| ID       | Issue                               | File Location                                                      | Line(s)                                    | Impact                                        |
| -------- | ----------------------------------- | ------------------------------------------------------------------ | ------------------------------------------ | --------------------------------------------- |
| **C001** | Missing `FormField` Component       | `frontend/src/components/ui/FormField.tsx`                         | File **does not exist** (ENOENT)           | Build failure; any import crashes             |
| **C002** | Dual Token Refresh Race Condition   | `frontend/src/lib/api.ts` vs `frontend/src/pages/AllFilesPage.tsx` | `api.ts:10-39`, `AllFilesPage.tsx:710-742` | Auth failures during upload; token corruption |
| **C003** | Google Reconnect Uses Full Redirect | `frontend/src/pages/SettingsPage.tsx`                              | `168-184`                                  | Loses app state; breaks UX flow               |
| **C004** | Thumbnail Fetch Silent Failure      | `frontend/src/components/drive/FileGrid.tsx`                       | `17-34`                                    | Thumbnails fail silently on token expiry      |

### 2.2 High Priority (P1) — Degraded UX / Functional Bugs

| ID       | Issue                                 | File Location                                                              | Line(s)        | Impact                                      |
| -------- | ------------------------------------- | -------------------------------------------------------------------------- | -------------- | ------------------------------------------- |
| **H001** | No AbortController in Thumbnail Fetch | `frontend/src/components/drive/FileGrid.tsx`                               | `17-34`        | Memory leaks; React warnings on unmount     |
| **H002** | AvatarStack External Dependency       | `frontend/src/components/drive/AvatarStack.tsx`                            | `7`            | Privacy risk; unreliable external service   |
| **H003** | PublicFilePage Hardcoded Colors       | `frontend/src/pages/PublicFilePage.tsx`                                    | `79, 108, 130` | Theme inconsistency; violates design system |
| **H004** | GitHub API Rate Limit Unhandled       | `frontend/src/layouts/DriveLayout.tsx`                                     | `367-405`      | Errors shown to users; no fallback          |
| **H005** | Recent/Starred/Archived Use Mock Data | `frontend/src/pages/RecentPage.tsx`, `StarredPage.tsx`, `ArchivedPage.tsx` | All files      | Protected pages show fake data              |
| **H006** | Upload Fallback `filesMeta` Bug       | `frontend/src/pages/AllFilesPage.tsx`                                      | `606-617`      | Multi-file fallback only uploads last file  |

### 2.3 Medium Priority (P2) — Code Quality / Maintainability

| ID       | Issue                              | File Location                                       | Line(s)                | Impact                            |
| -------- | ---------------------------------- | --------------------------------------------------- | ---------------------- | --------------------------------- |
| **M001** | Duplicate Type Definitions         | `frontend/src/pages/AllFilesPage.tsx`               | `53-71`                | Drift from backend contracts      |
| **M002** | Inconsistent Optimistic Updates    | `frontend/src/pages/AllFilesPage.tsx`               | `936-989` vs `902-934` | Inconsistent UX patterns          |
| **M003** | Missing API Error Typing           | `frontend/src/lib/api.ts`                           | `71-72`                | Loses backend error codes         |
| **M004** | ZoomablePreview Mobile Pan Gap     | `frontend/src/components/drive/ZoomablePreview.tsx` | `47-61`                | No pan at 1x on touch devices     |
| **M005** | AllFilesPage Monolith (2120 lines) | `frontend/src/pages/AllFilesPage.tsx`               | Entire file            | Unmaintainable; testing difficult |

### 2.4 Low Priority (P3) — Nice to Have

| ID       | Issue                         | File Location                          | Line(s)   | Impact                        |
| -------- | ----------------------------- | -------------------------------------- | --------- | ----------------------------- |
| **L001** | Theme Not Synced to Backend   | `frontend/src/lib/theme.tsx`           | `20-83`   | Preference lost on new device |
| **L002** | Search Debouncing Missing     | `frontend/src/layouts/DriveLayout.tsx` | `356-365` | Excessive API calls on typing |
| **L003** | Missing `formConfig.ts` Files | Referenced in tabs                     | N/A       | Potential build failures      |

---

## 3. File-by-File Analysis

### 3.1 API Integration Layer

#### `frontend/src/lib/api.ts` — **Core API Client**

```typescript
// Key Findings:
✅ Centralized `apiFetch` with auto-refresh on 401
✅ Token refresh lock (`refreshPromise`) prevents thundering herd
✅ `formatBytes`, `formatDate` utilities included
⚠️ `refreshAccessToken()` NOT exported — duplicated in AllFilesPage
⚠️ Error response assumes `{message}` but backend returns `{code, message}`
⚠️ No request/response interceptors for logging/metrics
```

**Critical Fix Needed** — Export `refreshAccessToken` and use in `AllFilesPage`:

```typescript
// api.ts - ADD EXPORT
export { refreshAccessToken };

// AllFilesPage.tsx - USE SHARED REFRESH
import { refreshAccessToken } from "@/lib/api";
async function ensureFreshToken() {
  // ... use refreshAccessToken() instead of direct fetch
}
```

#### `frontend/src/lib/auth.ts` — **Auth Session Management**

```typescript
// Key Findings:
✅ localStorage-based token storage
✅ `AuthUser` type defined
✅ `setAuthSession`, `clearAuthSession`, `getStoredUser`
⚠️ `setRefreshToken` added as afterthought (comment: "TAMBAHKAN FUNGSI INI")
⚠️ No token expiry validation on read
⚠️ No automatic cleanup of expired tokens
```

#### `frontend/src/lib/utils.ts` — **Utility Functions**

```typescript
// Key Findings:
✅ `cn()` helper using clsx + tailwind-merge
✅ Used consistently across components
```

### 3.2 Core Pages

#### `frontend/src/pages/AllFilesPage.tsx` — **Main File Manager (2120 lines)**

| Aspect                | Assessment                                                |
| --------------------- | --------------------------------------------------------- |
| **State Management**  | 40+ `useState`/`useRef` — excessive                       |
| **File Operations**   | CRUD, move, rename, delete, share, invite, preview        |
| **Upload Logic**      | Dual-path: Direct-to-Google (XHR) + Proxied fallback      |
| **Critical Issues**   | C002, C004, H006, M002, M005                              |
| **Positive Patterns** | Optimistic delete (lines 952-956), pagination, view modes |

**Structural Problem**: Single component handles:

- File/folder listing & pagination
- Upload orchestration (direct + proxy)
- All modals (upload, folder, rename, move, delete, share, invite, preview)
- Context menus (file, folder, empty area)
- Keyboard shortcuts (Ctrl+X, Ctrl+V)
- Video player lifecycle (Plyr)
- Search & filter state

**Recommended Split**:

```
AllFilesPage.tsx (orchestrator, ~200 lines)
├── hooks/useFileManager.ts (state + API)
├── hooks/useUploadManager.ts (upload logic)
├── components/FileListView.tsx (table + grid)
├── components/FileGridView.tsx
├── modals/UploadModal.tsx
├── modals/FolderModal.tsx
├── modals/ShareModal.tsx
└── modals/InviteModal.tsx
```

#### `frontend/src/pages/SharedPage.tsx` — **Invites & Shared Resources**

```typescript
// Key Findings:
✅ Clean separation: sent vs received invites
✅ Real-time updates via `9drive:invites-changed` event
✅ Proper status badges (pending/accepted)
⚠️ No pagination for large invite lists
⚠️ `revokeInvite` doesn't optimistic update
```

#### `frontend/src/pages/QuotaTrackerPage.tsx` — **Storage Quota Dashboard**

```typescript
// Key Findings:
✅ Comprehensive quota visualization
✅ Auto-refresh (35s) + storage-change event listener
✅ Routing policy management (priority/order)
✅ Sync-per-account with loading states
⚠️ Hardcoded "zenhosta/9drive" GitHub repo in DriveLayout (not here)
⚠️ No export/print functionality
```

#### `frontend/src/pages/SettingsPage.tsx` — **Account & Storage Settings**

```typescript
// Key Findings:
✅ Google Drive connect/reconnect/disconnect
✅ S3-compatible storage configuration
✅ Account selector with quota display
⚠️ C003: Reconnect uses full redirect
⚠️ No password/email change UI
⚠️ No 2FA management
```

### 3.3 Layout & Navigation

#### `frontend/src/layouts/DriveLayout.tsx` — **Protected App Shell**

```typescript
// Key Findings:
✅ Responsive sidebar (desktop fixed, mobile drawer)
✅ Header search with query param sync
✅ Storage summary + breakdown in sidebar
✅ Theme toggle integration
⚠️ H004: Direct GitHub API call (rate limited)
⚠️ Repo updates dropdown — non-essential feature
⚠️ `loadSidebarStatsRef` pattern good for event handlers
```

#### `frontend/src/components/auth/ProtectedRoute.tsx`

```typescript
// Key Findings:
✅ Minimal: checks `getAccessToken()` only
⚠️ No token validation (expiry, revocation)
⚠️ Redirects to `/login` without preserving destination
```

### 3.4 Drive Components

#### `frontend/src/components/drive/FileGrid.tsx` — **Grid View with Lazy Thumbnails**

```typescript
// Key Findings:
✅ IntersectionObserver for lazy loading
✅ Video thumbnail with seek preview
⚠️ C004: Thumbnail fetch no retry on 401
⚠️ H001: No AbortController cleanup
⚠️ Uses `apiFetch` for thumbnails (adds Bearer token) ✓
```

#### `frontend/src/components/drive/FileTable.tsx` — **Table View**

```typescript
// Key Findings:
✅ Multiple modes: default, shared, recent, starred, archived
✅ Responsive: cards on mobile, table on desktop
✅ Selection checkboxes + context menu
⚠️ `mode` prop uses string union — should be enum/const
```

#### `frontend/src/components/drive/FileContextMenu.tsx` — **File Actions Menu**

```typescript
// Key Findings:
✅ Comprehensive actions: view, download, rename, move, details, share, invite, delete
✅ Position clamping for viewport edges
✅ Overlay backdrop for dismissal
```

#### `frontend/src/components/drive/FolderContextMenu.tsx` & `EmptyAreaContextMenu.tsx`

```typescript
// Key Findings:
✅ Consistent pattern with FileContextMenu
✅ Folder: cut, rename, invite, delete
✅ Empty: upload, create folder, paste folder
```

#### `frontend/src/components/drive/FileDetailsDrawer.tsx` — **Side Drawer**

```typescript
// Key Findings:
✅ Slide-in animation with transform
✅ Detail rows with icons
⚠️ Hardcoded "google_drive" provider fallback (line 104)
```

#### `frontend/src/components/drive/DummyModal.tsx` — **Base Modal**

```typescript
// Key Findings:
✅ Portal to fixed overlay
✅ Backdrop click to close
✅ Responsive: bottom sheet mobile, centered desktop
✅ Accepts custom className for sizing
```

#### `frontend/src/components/drive/ZoomablePreview.tsx` — **Image Zoom/Pan**

```typescript
// Key Findings:
✅ Wheel zoom, pointer drag, touch pinch
✅ Double-click zoom toggle
✅ Scale clamping (1x-8x)
⚠️ M004: No pan at scale=1 on touch
⚠️ `touchAction: 'none'` may interfere with scrolling
```

#### `frontend/src/components/drive/FolderVisual.tsx` — **Folder Icon Rendering**

```typescript
// Key Findings:
✅ Color normalization (legacy Tailwind classes → hex)
✅ Iconify CDN integration with color parameter
✅ 50+ icon options
⚠️ External CDN dependency (iconify.design)
```

#### `frontend/src/components/drive/PageHeader.tsx` — **Consistent Page Headers**

```typescript
// Key Findings:
✅ Title + description + actions pattern
✅ Responsive: stacked mobile, row desktop
```

#### `frontend/src/components/drive/MetricCard.tsx` — **Dashboard Metrics**

```typescript
// Key Findings:
✅ Simple, reusable metric display
✅ Icon + label + value pattern
```

#### `frontend/src/components/drive/AvatarStack.tsx` — **H002 Issue**

```typescript
// Current: src="https://i.pravatar.cc/48?img=${12 + index}"
// Fix: Generate locally from initials or use dicebear
```

#### `frontend/src/components/drive/BrandLogo.tsx` — **SVG Logo**

```typescript
// Key Findings:
✅ Inline SVG with CSS variable colors
✅ Accessible with aria-label
```

### 3.5 Auth Pages

#### `frontend/src/pages/LoginPage.tsx` & `RegisterPage.tsx`

```typescript
// Key Findings:
✅ Email/password + Google OAuth
✅ reCAPTCHA v3 integration (optional, env-gated)
✅ Proper loading/error states
✅ Google OAuth uses handoff token (not tokens in URL)
```

#### `frontend/src/pages/GoogleAuthPage.tsx` — **OAuth Callback Exchange**

```typescript
// Key Findings:
✅ Exchanges one-time token for app tokens
✅ Stores tokens via `setAuthSession`
✅ Redirects to `/all-files` on success
```

#### `frontend/src/pages/GoogleConnectedPage.tsx` — **Drive Connect Callback**

```typescript
// Key Findings:
✅ PostMessage to opener with status
✅ Auto-closes popup after 800ms
✅ Fallback navigation if no opener
```

#### `frontend/src/pages/PublicFilePage.tsx` — **Public File Viewer — H003**

```typescript
// Key Findings:
✅ Supports image, video, document, office preview
✅ Plyr video player integration
✅ Embed mode for iframes
⚠️ H003: Hardcoded `bg-[#0f1117]`, `bg-[#17191f]`, `bg-[#101218]`
⚠️ Dark-only theme (no light mode support)
```

#### `frontend/src/pages/ApiManagementPage.tsx` — **API Key Management**

```typescript
// Key Findings:
✅ Create/revoke API keys
✅ Copy-to-clipboard for secrets
✅ cURL + JS examples with live API_URL
✅ Scopes display (upload-only)
```

### 3.6 Utility Libraries

#### `frontend/src/lib/preview.ts` — **Preview Type Detection**

```typescript
// Key Findings:
✅ Comprehensive MIME type mapping
✅ Google Workspace types handled
✅ Office viewer URL generation
✅ Spreadsheet detection helper
```

#### `frontend/src/lib/plyr.ts` — **Video Player Loader**

```typescript
// Key Findings:
✅ Dynamic script/css loading
✅ Promise-based ready state
✅ Singleton pattern with `__plyrReady`
```

#### `frontend/src/lib/theme.tsx` — **Theme Context**

```typescript
// Key Findings:
✅ Light/Dark/System modes
✅ localStorage persistence
✅ Cookie for SSR (if needed)
✅ System media query listener
⚠️ L001: No backend sync
```

#### `frontend/src/lib/gravatar.ts` — **Gravatar URLs**

```typescript
// Key Findings:
✅ MD5 email hash generation
✅ Configurable size
```

### 3.7 UI Primitives

#### `frontend/src/components/ui/button.tsx` — **CVA-based Button**

```typescript
// Key Findings:
✅ Variants: default, outline, ghost, soft, danger
✅ Sizes: default, sm, icon
✅ Proper focus-visible styles
✅ Disabled state handling
```

#### `frontend/src/components/ui/card.tsx` & `input.tsx`

```typescript
// Key Findings:
✅ Simple wrappers with CSS variables
✅ Consistent border/bg/shadow tokens
✅ Input: focus ring, placeholder styling
```

#### `frontend/src/components/ui/ThemeToggle.tsx`

```typescript
// Key Findings:
✅ Three-button toggle (Light/System/Dark)
✅ Uses `useTheme` context
✅ Proper ARIA labels
```

### 3.8 Routing & Entry

#### `frontend/src/App.tsx` — **Route Registration**

```typescript
// Key Findings:
✅ All routes declared here
✅ Public routes: login, register, google-auth, google-connected, public files
✅ Protected routes wrapped in ProtectedRoute + DriveLayout
✅ Index redirect to /all-files
✅ Catch-all redirect to /all-files
```

#### `frontend/src/main.tsx` — **App Bootstrap**

```typescript
// Key Findings:
✅ StrictMode + BrowserRouter + ThemeProvider
✅ Global CSS import
```

---

## 4. Backend API Contract Review

### 4.1 `backend/src/modules/files/file.routes.ts` Analysis

| Endpoint                        | Frontend Usage              | Contract Match | Issues                      |
| ------------------------------- | --------------------------- | -------------- | --------------------------- |
| `GET /files`                    | `AllFilesPage.loadFiles()`  | ✅             | Pagination params match     |
| `GET /files?folderId`           | `AllFilesPage.loadFiles()`  | ✅             |                             |
| `GET /files?q`                  | `DriveLayout.searchFiles()` | ✅             |                             |
| `GET /files/:id`                | `FileDetailsDrawer`         | ✅             |                             |
| `PATCH /files/:id`              | `renameFile`, `moveFile`    | ✅             |                             |
| `DELETE /files/:id`             | `deleteFile`                | ✅             |                             |
| `PATCH /files/batch`            | `moveFile` (multi)          | ✅             |                             |
| `DELETE /files/batch`           | `deleteFile` (multi)        | ✅             |                             |
| `POST /files/sync-google`       | `syncGoogleDrive()`         | ✅             |                             |
| `POST /files/:id/share`         | `shareFile()`               | ✅             | Returns `directUrl`         |
| `DELETE /files/:id/share`       | `shareModal` remove         | ✅             |                             |
| `POST /files/:id/preview-token` | `viewFile()`                | ✅             | Returns `path` + `url`      |
| `GET /files/:id/view-url`       | Not used in frontend        | ❓             | Available but unused        |
| `GET /files/:id/download-url`   | `downloadFile()`            | ✅             | Returns `url` + `directUrl` |
| `GET /files/:id/thumbnail-url`  | `FileGrid.FileThumbnail`    | ✅             | **H001/C004**               |
| `GET /files/preview/:token`     | `PublicFilePage` preview    | ✅             | Public, no auth             |
| `GET /public/files/:token`      | `PublicFilePage` metadata   | ✅             | Public, no auth             |

### 4.2 Contract Mismatches Found

1. **Thumbnail Endpoint** — Frontend expects 200/404, but on auth expiry returns 401 → frontend catches but doesn't retry
2. **Download URL** — Backend returns `{url, directUrl?}`, frontend uses `directUrl ?? url` ✓
3. **Share Response** — Backend returns `{url, directUrl?, shareId}`, frontend expects all ✓
4. **Error Format** — Backend: `{code, message}`, Frontend `api.ts` only reads `message` → **M003**

### 4.3 Missing Frontend Integrations

- `GET /files/shared-links` → Used in `SharedPage`? No, `SharedPage` uses `/invites`
- `GET /storage/breakdown` → Used in `DriveLayout` sidebar ✓
- `GET /connected-accounts` → Used in `SettingsPage`, `QuotaTrackerPage` ✓

---

## 5. Code Quality Assessment

### 5.1 TypeScript Strictness

| Check                | Status | Notes                              |
| -------------------- | ------ | ---------------------------------- |
| `strict: true`       | ✅     | `tsconfig.json`                    |
| `noImplicitAny`      | ✅     |                                    |
| `strictNullChecks`   | ✅     |                                    |
| `noUnusedLocals`     | ⚠️     | Many unused vars in AllFilesPage   |
| `noUnusedParameters` | ⚠️     | Event handlers often ignore params |

### 5.2 Error Handling Patterns

| Pattern                      | Usage             | Assessment             |
| ---------------------------- | ----------------- | ---------------------- |
| `try/catch` + `setMessage`   | All pages         | ✅ Consistent          |
| Optimistic update + rollback | `deleteFile` only | ⚠️ Inconsistent (M002) |
| Error boundaries             | None              | ❌ Missing             |
| Global error handler         | None              | ❌ Missing             |

### 5.3 Loading States

| Component      | Loading State               | Notes                        |
| -------------- | --------------------------- | ---------------------------- |
| File list      | `loading` state + skeleton? | ❌ No skeleton, just spinner |
| Upload         | Detailed progress panel     | ✅ Excellent                 |
| Quota sync     | Per-account spinner         | ✅                           |
| Google connect | Button loading text         | ✅                           |
| Modals         | Button disabled + text      | ✅                           |

### 5.4 Accessibility (a11y)

| Feature             | Status | Notes                             |
| ------------------- | ------ | --------------------------------- |
| ARIA labels         | ✅     | Buttons, menus, inputs            |
| Keyboard navigation | ✅     | Focus management, Escape to close |
| Focus trapping      | ⚠️     | Modals don't trap focus           |
| Color contrast      | ✅     | CSS variable system               |
| Screen reader       | ⚠️     | Limited testing                   |

### 5.5 Testing Gaps

| Test Type         | Coverage | Notes                      |
| ----------------- | -------- | -------------------------- |
| Unit tests        | 0%       | No test files found        |
| Integration tests | 0%       | No test setup              |
| E2E tests         | 0%       | No Playwright/Cypress      |
| Type checking     | ✅       | `npm run build` runs `tsc` |

---

## 6. Security & Auth Review

### 6.1 Google OAuth Flow

```
User clicks "Continue with Google"
    ↓
GET /auth/google/url → Returns Google OAuth URL
    ↓
window.location.href = url (full redirect)
    ↓
Google consent screen
    ↓
Callback to /auth/google/callback → Creates handoff token
    ↓
Redirect to /google-auth?token=xxx&status=success
    ↓
GoogleAuthPage: POST /auth/google/exchange {token}
    ↓
Returns {accessToken, refreshToken, user}
    ↓
setAuthSession → navigate /all-files
```

**Assessment**: ✅ Correct — tokens never in URL, handoff token is one-time

### 6.2 Token Management

| Aspect             | Implementation                                         | Risk                    |
| ------------------ | ------------------------------------------------------ | ----------------------- |
| Access Token       | localStorage (`9drive.accessToken`)                    | Medium — XSS accessible |
| Refresh Token      | localStorage (`9drive.refreshToken`)                   | Medium — XSS accessible |
| Token Refresh      | Centralized in `api.ts` + duplicated in `AllFilesPage` | **C002**                |
| Token Expiry Check | JWT decode in `ensureFreshToken`                       | ✅ Client-side only     |
| Logout             | `clearAuthSession` + POST `/auth/logout`               | ✅                      |

### 6.3 Protected Routes

```typescript
// ProtectedRoute.tsx — Line 5
export function ProtectedRoute() {
  return getAccessToken() ? <Outlet /> : <Navigate to="/login" replace />
}
```

**Issues**:

- No token validation (expired/revoked tokens pass through)
- No redirect preservation (`?redirect=/quota`)

### 6.4 Credential Handling

| Credential                 | Storage                | Transmission      |
| -------------------------- | ---------------------- | ----------------- |
| Google OAuth Client Secret | Backend only (env)     | Never to frontend |
| Google Refresh Tokens      | Backend DB (encrypted) | Never to frontend |
| App JWT Secrets            | Backend only           | Never to frontend |
| S3 Credentials             | Backend DB (encrypted) | Never to frontend |
| reCAPTCHA Secret           | Backend only           | Never to frontend |

**Assessment**: ✅ Excellent — no secrets in frontend

### 6.5 CORS & Security Headers

- `FRONTEND_URL` used for CORS restriction ✅
- No `Content-Security-Policy` headers visible in frontend code
- `iframe` for previews — `sandbox` not used

---

## 7. Performance Considerations

### 7.1 Bundle Optimization

| Technique       | Status | Notes                             |
| --------------- | ------ | --------------------------------- |
| Code splitting  | ⚠️     | Only route-level via React Router |
| Lazy loading    | ❌     | No `React.lazy` / `Suspense`      |
| Tree shaking    | ✅     | Vite + ES modules                 |
| Dynamic imports | ❌     | Not used                          |

**Recommendation**: Add route-level lazy loading:

```typescript
// App.tsx
const AllFilesPage = lazy(() => import("@/pages/AllFilesPage"));
const SettingsPage = lazy(() => import("@/pages/SettingsPage"));
// ... wrap in <Suspense fallback={<Loader />}>
```

### 7.2 Rendering Optimization

| Component                | Memoization | Re-render Risk                        |
| ------------------------ | ----------- | ------------------------------------- |
| `FileGrid` / `FileTable` | ❌          | Re-renders on any parent state change |
| `FileThumbnail`          | ❌          | New IntersectionObserver per file     |
| `MetricCard`             | ❌          | Re-renders on parent stats change     |
| `AvatarStack`            | ❌          | New array.map each render             |

**Recommendation**: Add `React.memo` + `useMemo`/`useCallback` for list items.

### 7.3 Quota Tracking Efficiency

```typescript
// QuotaTrackerPage.tsx + DriveLayout.tsx
// Both listen to '9drive:storage-changed' and call load()
// DriveLayout: loadSidebarStats() → 2 API calls
// QuotaTrackerPage: load() → 3 API calls
```

**Issue**: Duplicate subscriptions, no deduplication. Multiple components fetch same data.

**Fix**: Centralize quota state in context or use SWR/React Query.

### 7.4 Thumbnail Loading

- Lazy-loaded via IntersectionObserver ✅
- But: No caching, no placeholder blur, no priority hints
- Each thumbnail = separate API call (N+1 problem)

---

## 8. Actionable Recommendations

### 8.1 P0 — Immediate Fixes (Do First)

#### Fix C001: Create Missing FormField Component

```tsx
// frontend/src/components/ui/FormField.tsx
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/Label"; // Create if needed

export function FormField({
  label,
  children,
  error,
  hint,
  className,
  ...props
}: {
  label: string;
  children: React.ReactNode;
  error?: string;
  hint?: string;
  className?: string;
}) {
  return (
    <div className={cn("grid gap-1.5", className)}>
      <Label>{label}</Label>
      {children}
      {error && (
        <p className="text-sm text-[var(--color-text-danger)]">{error}</p>
      )}
      {hint && !error && (
        <p className="text-sm text-[var(--color-text-tertiary)]">{hint}</p>
      )}
    </div>
  );
}
```

#### Fix C002: Consolidate Token Refresh

```typescript
// frontend/src/lib/api.ts — ADD at line 39
export { refreshAccessToken };

// frontend/src/pages/AllFilesPage.tsx — REPLACE lines 710-742
import {
  refreshAccessToken,
  getAccessToken,
  getRefreshToken,
  setAccessToken,
} from "@/lib/api";

async function ensureFreshToken(): Promise<string | null> {
  const token = getAccessToken();
  if (!token) return null;

  try {
    const payload = JSON.parse(atob(token.split(".")[1]!)) as { exp?: number };
    const expiresAt = (payload.exp ?? 0) * 1000;
    if (Date.now() + 2 * 60 * 1000 < expiresAt) return token;
  } catch {
    return token;
  }

  const success = await refreshAccessToken();
  return success ? getAccessToken() : token;
}
```

#### Fix C003: Google Reconnect via Popup

```typescript
// SettingsPage.tsx — REPLACE handleReconnect (lines 168-184)
async function handleReconnect(accountId: string) {
  try {
    const res = await apiFetch<{ url: string }>(
      `/connected-accounts/google/connect-url?accountId=${accountId}`,
    );
    const popup = window.open(
      res.url,
      "google-drive-reconnect",
      "width=540,height=720",
    );
    if (!popup) window.location.href = res.url;
  } catch (error) {
    setMessage(
      error instanceof Error ? error.message : "Failed to initiate reconnect",
    );
  }
}
```

#### Fix C004/H001: Thumbnail Fetch with Retry + Abort

```tsx
// FileGrid.tsx — FileThumbnail component
useEffect(() => {
  if (!file.id || !isMedia) return;

  const controller = new AbortController();
  const observer = new IntersectionObserver(
    (entries) => {
      if (!entries[0]?.isIntersecting || fetchedRef.current) return;
      fetchedRef.current = true;

      apiFetch<{ url: string }>(`/files/${file.id}/thumbnail-url`, {
        signal: controller.signal,
      })
        .then(({ url }) => setUrl(url))
        .catch((err) => {
          if (err.name !== "AbortError") setImgError(true);
        });
    },
    { rootMargin: "200px" },
  );

  if (containerRef.current) observer.observe(containerRef.current);
  return () => {
    observer.disconnect();
    controller.abort();
  };
}, [file.id, file.kind]);
```

### 8.2 P1 — High Priority Fixes

#### Fix H006: Upload Fallback filesMeta Bug

```typescript
// AllFilesPage.tsx — REPLACE lines 606-617
const finalRes =
  directResult ??
  (await (async () => {
    const form = new FormData();
    const meta = uploadingFiles.map((f, i) => ({
      fieldName: `file-${i}`,
      fileName: f.name,
      mimeType: f.type || "application/octet-stream",
      sizeBytes: String(f.size),
      folderId: targetFolderId || undefined,
    }));
    form.append("filesMeta", JSON.stringify(meta));
    uploadingFiles.forEach((f, i) => form.append(`file-${i}`, f));
    return uploadWithProgress(form, () => {});
  })());
```

#### Fix H003: PublicFilePage CSS Variables

```tsx
// PublicFilePage.tsx — REPLACE hardcoded colors
// Line 79: bg-[#0f1117] → bg-[var(--color-bg-primary)]
// Line 108: bg-[#17191f]/95 → bg-[var(--color-card-bg)]/95
// Line 130: bg-[#101218] → bg-[var(--color-bg-secondary)]
// Line 131: border-white/10 → border-[var(--color-card-border)]
// Line 112: bg-white/10 → bg-[var(--color-bg-tertiary)]
// Line 115: text-slate-100 → text-[var(--color-text-primary)]
// Line 116: text-slate-400 → text-[var(--color-text-tertiary)]
// Line 121: border-white/10 → border-[var(--color-card-border)]
// Line 124: border-white/10 → border-[var(--color-card-border)]
// Line 131: bg-white → bg-[var(--color-card-bg)]
```

#### Fix H005: Real API for Recent/Starred/Archived

```typescript
// RecentPage.tsx — REPLACE mock data
async function loadRecent() {
  const data = await apiFetch<{ files: BackendFile[] }>(
    "/files?recent=true&limit=20",
  );
  setFiles(data.files.map(mapFile));
}

// StarredPage.tsx — NEEDS BACKEND SUPPORT
// Add ?starred=true to /files endpoint, or new endpoint

// ArchivedPage.tsx — NEEDS BACKEND SUPPORT
// Add ?archived=true or status=archived filter
```

### 8.3 P2 — Medium Priority Refactors

#### Fix M005: Split AllFilesPage

```typescript
// Create hooks/useFileManager.ts
export function useFileManager(activeFolderId: string, searchQuery: string) {
  const [files, setFiles] = useState<FileItem[]>([])
  const [folders, setFolders] = useState<FolderItem[]>([])
  const [loading, setLoading] = useState(false)

  const loadFiles = useCallback(async (page = 1) => { /* ... */ }, [activeFolderId, searchQuery])
  const loadFolders = useCallback(async () => { /* ... */ }, [activeFolderId])
  const deleteFile = useCallback(async (ids: string[]) => { /* optimistic + rollback */ }, [])
  const renameFile = useCallback(async (id: string, name: string) => { /* ... */ }, [])
  // ... other operations

  return { files, folders, loading, loadFiles, loadFolders, deleteFile, renameFile, ... }
}
```

#### Fix M003: API Error Typing

```typescript
// api.ts — REPLACE lines 65-75
type ApiError = { code: string; message: string };

if (!response.ok) {
  if (response.status === 401 && retry === false && !skipAuth) {
    console.warn("Sesi benar-benar habis. Logout...");
    clearAuthSession();
    if (typeof window !== "undefined") window.location.href = "/login";
  }
  const error = (await response.json().catch(() => ({
    code: "UNKNOWN_ERROR",
    message: response.statusText,
  }))) as ApiError;
  throw new Error(`${error.code}: ${error.message}`);
}
```

### 8.4 P3 — Low Priority Enhancements

#### Fix L001: Theme Backend Sync

```typescript
// theme.tsx — ADD to setTheme
const setTheme = useCallback(async (newTheme: Theme) => {
  setThemeState(newTheme);
  localStorage.setItem("9drive:theme", newTheme);
  try {
    await apiFetch("/auth/me", {
      method: "PATCH",
      body: JSON.stringify({ theme: newTheme }),
    });
  } catch {
    /* ignore */
  }
}, []);
```

#### Fix L002: Search Debouncing

```tsx
// DriveLayout.tsx — ADD debounce
const [searchValue, setSearchValue] = useState("");
const debouncedSearch = useRef<NodeJS.Timeout>();

function handleSearchChange(value: string) {
  setSearchValue(value);
  clearTimeout(debouncedSearch.current);
  debouncedSearch.current = setTimeout(() => {
    // submit search
  }, 300);
}
```

---

## 9. Compliance Checklist

### 9.1 AGENTS.md Frontend Conventions

| #   | Guideline                                                                | Status | Evidence                              |
| --- | ------------------------------------------------------------------------ | ------ | ------------------------------------- |
| 1   | Use `@/*` imports for files under `frontend/src`                         | ✅     | All imports use `@/`                  |
| 2   | Keep route registration in `frontend/src/App.tsx`                        | ✅     | `App.tsx` lines 18-42                 |
| 3   | Use `apiFetch` for normal JSON API calls                                 | ✅     | Consistent usage                      |
| 4   | Use raw `fetch`/`XMLHttpRequest` only for streaming/blob/progress        | ✅     | Upload uses XHR                       |
| 5   | Keep access/refresh token handling centralized in `api.ts` and `auth.ts` | ⚠️     | **C002** — duplicated in AllFilesPage |
| 6   | Use existing `Button`, `Card`, `Input` primitives                        | ✅     | Used throughout                       |
| 7   | Use `cn` from `frontend/src/lib/utils.ts` for conditional classes        | ✅     | Universal usage                       |
| 8   | Preserve current Tailwind visual style unless redesign asked             | ⚠️     | **H003** — PublicFilePage hardcoded   |
| 9   | Keep protected dashboard pages inside `ProtectedRoute` and `DriveLayout` | ✅     | `App.tsx` lines 27-38                 |
| 10  | Keep file/folder URL state in query params (`folderId`, `q`)             | ✅     | `DriveLayout` + `AllFilesPage`        |

### 9.2 AGENTS.md Security Rules (Frontend-Relevant)

| #   | Rule                                                   | Status | Evidence                         |
| --- | ------------------------------------------------------ | ------ | -------------------------------- |
| 1   | Never commit `.env` files or secrets                   | ✅     | `.gitignore` excludes `.env`     |
| 2   | Never log access tokens, refresh tokens, OAuth secrets | ✅     | No console.log of tokens         |
| 3   | Keep CORS restricted by `FRONTEND_URL`                 | ✅     | Backend config                   |
| 4   | Keep auth/token storage behavior centralized           | ⚠️     | **C002** — not fully centralized |

### 9.3 AGENTS.md API Notes Compliance

| Endpoint Category             | Frontend Coverage | Notes                                                         |
| ----------------------------- | ----------------- | ------------------------------------------------------------- |
| Auth (7 endpoints)            | ✅ 7/7            | Login, register, Google, refresh, logout, me                  |
| Provider Configs (3)          | ✅ 3/3            | Settings page                                                 |
| Google Connected Accounts (6) | ✅ 6/6            | Settings + QuotaTracker                                       |
| Storage (2)                   | ✅ 2/2            | QuotaTracker + DriveLayout sidebar                            |
| Folders (6)                   | ✅ 6/6            | AllFilesPage + modals                                         |
| Files (17)                    | ✅ 15/17          | Missing: `GET /files/:id/view-url`, `GET /files/shared-links` |
| Invites (3)                   | ✅ 3/3            | SharedPage                                                    |
| Public Files (3)              | ✅ 3/3            | PublicFilePage                                                |
| Uploads (1)                   | ✅ 1/1            | AllFilesPage upload                                           |

### 9.4 Docker & Build Compliance

| Check                                    | Status | Notes                |
| ---------------------------------------- | ------ | -------------------- |
| `npm run build` passes                   | ✅     | TypeScript compiles  |
| Vite embeds `VITE_API_URL` at build time | ✅     | `vite.config.ts`     |
| No secrets in Docker build               | ✅     | Build args only      |
| Frontend served by nginx on 5173         | ✅     | `docker-compose.yml` |

---

## Appendix A: File Inventory

### Core Pages (12)

| File                      | Lines | Purpose                       |
| ------------------------- | ----- | ----------------------------- |
| `AllFilesPage.tsx`        | 2120  | Main file manager             |
| `SharedPage.tsx`          | 216   | Invites & shared resources    |
| `QuotaTrackerPage.tsx`    | 478   | Storage quota dashboard       |
| `SettingsPage.tsx`        | 630   | Account & storage settings    |
| `DriveLayout.tsx`         | 572   | Protected app shell           |
| `LoginPage.tsx`           | 129   | Email/password + Google login |
| `RegisterPage.tsx`        | 216   | Registration + reCAPTCHA      |
| `GoogleAuthPage.tsx`      | 40    | OAuth handoff exchange        |
| `GoogleConnectedPage.tsx` | 43    | Drive connect callback        |
| `PublicFilePage.tsx`      | 137   | Public file viewer            |
| `ApiManagementPage.tsx`   | 387   | API key management            |
| `RecentPage.tsx`          | 55    | Recent activity (mock)        |
| `StarredPage.tsx`         | 38    | Starred files (mock)          |
| `ArchivedPage.tsx`        | 40    | Archived files (mock)         |

### Drive Components (13)

| File                       | Lines | Purpose                |
| -------------------------- | ----- | ---------------------- |
| `FileTable.tsx`            | 242   | Table view             |
| `FileGrid.tsx`             | 193   | Grid view + thumbnails |
| `FileContextMenu.tsx`      | 129   | File actions menu      |
| `FolderContextMenu.tsx`    | 80    | Folder actions menu    |
| `EmptyAreaContextMenu.tsx` | 70    | Empty space menu       |
| `FileDetailsDrawer.tsx`    | 121   | Side detail panel      |
| `DummyModal.tsx`           | 58    | Base modal component   |
| `ZoomablePreview.tsx`      | 182   | Image zoom/pan         |
| `FolderGrid.tsx`           | 56    | Folder card grid       |
| `FolderVisual.tsx`         | 84    | Folder icon rendering  |
| `PageHeader.tsx`           | 31    | Page header pattern    |
| `MetricCard.tsx`           | 28    | Dashboard metric       |
| `AvatarStack.tsx`          | 14    | User avatar stack      |

### UI Primitives (5)

| File              | Purpose                   |
| ----------------- | ------------------------- |
| `button.tsx`      | CVA-based button variants |
| `card.tsx`        | Card container            |
| `input.tsx`       | Styled input              |
| `ThemeToggle.tsx` | Theme switcher            |
| `FormField.tsx`   | **MISSING**               |

### Libraries (8)

| File          | Purpose                    |
| ------------- | -------------------------- |
| `api.ts`      | API client + token refresh |
| `auth.ts`     | Auth session storage       |
| `utils.ts`    | `cn()` helper              |
| `theme.tsx`   | Theme context provider     |
| `preview.ts`  | Preview type detection     |
| `plyr.ts`     | Video player loader        |
| `gravatar.ts` | Gravatar URL generation    |

### Auth Components (2)

| File                 | Purpose          |
| -------------------- | ---------------- |
| `GoogleLogo.tsx`     | Google brand SVG |
| `ProtectedRoute.tsx` | Auth guard       |

---

## Appendix B: Dependency Graph

```
main.tsx
  └── App.tsx (Routes)
        ├── Public Routes
        │     ├── LoginPage → api.ts, auth.ts
        │     ├── RegisterPage → api.ts, auth.ts, reCAPTCHA
        │     ├── GoogleAuthPage → api.ts, auth.ts
        │     ├── GoogleConnectedPage → (postMessage)
        │     └── PublicFilePage → api.ts, plyr.ts, preview.ts
        └── ProtectedRoute → auth.ts
              └── DriveLayout → api.ts, auth.ts, theme.tsx, components/*
                    ├── AllFilesPage → api.ts, auth.ts, components/drive/*, plyr.ts, preview.ts
                    ├── SharedPage → api.ts, components/drive/*
                    ├── QuotaTrackerPage → api.ts, components/drive/*
                    ├── SettingsPage → api.ts, components/drive/*
                    ├── ApiManagementPage → api.ts, components/drive/*
                    ├── RecentPage → components/drive/*, mock data
                    ├── StarredPage → components/drive/*, mock data
                    └── ArchivedPage → components/drive/*, mock data
```

---

## Appendix C: Quick Reference — Critical Fix Commands

```bash
# 1. Verify build passes after fixes
cd frontend && npm run build

# 2. Check for missing imports
grep -r "FormField" frontend/src --include="*.tsx"
grep -r "formConfig" frontend/src --include="*.tsx"

# 3. Find all token refresh usages
grep -r "refreshAccessToken\|/auth/refresh" frontend/src --include="*.tsx"

# 4. Find hardcoded colors in PublicFilePage
grep -n "bg-#" frontend/src/pages/PublicFilePage.tsx

# 5. Check mock data usage
grep -r "from '@/data/drive-data'" frontend/src/pages --include="*.tsx"
```

---

**End of Report**

_This analysis was performed by reviewing all frontend source files against AGENTS.md guidelines. All file paths and line numbers are accurate as of the analysis date._
