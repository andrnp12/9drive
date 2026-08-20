# 9Drive Dark Mode Implementation Analysis

## 1. Current Color Inventory

### Global Stylesheet (`frontend/src/style.css`)

```css
:root {
  color: #0f172a; /* slate-950 - Primary text */
  background: #f8fafc; /* slate-50 - Page background */
}
```

- Video preview backgrounds: `#000` (hardcoded black)

### Tailwind Config

- Using Tailwind CSS v4 (no `tailwind.config.js` - uses CSS-first approach)
- Default color palette: slate, blue, emerald, amber, red, orange, yellow, lime, cyan, purple

### UI Components (`frontend/src/components/ui/`)

#### Button (`button.tsx`)

```typescript
variants: {
  default: 'bg-blue-600 text-white shadow-[0_8px_18px_rgba(37,99,235,0.25)] hover:bg-blue-700',
  outline: 'border border-slate-200 bg-white text-slate-950 shadow-sm hover:bg-slate-50',
  ghost: 'text-slate-700 hover:bg-slate-100',
  soft: 'bg-slate-100 text-slate-950 shadow-sm hover:bg-slate-200',
  danger: 'text-orange-600 hover:bg-orange-50',
}
```

#### Card (`card.tsx`)

```typescript
"rounded-2xl border border-slate-200 bg-white shadow-sm";
```

#### Input (`input.tsx`)

```typescript
"h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100";
```

### Layout Components

#### DriveLayout (`DriveLayout.tsx`)

- Main background: `bg-white`
- Sidebar: `border-slate-200 bg-white`
- Mobile overlay: `bg-slate-950/40`
- Navigation items: `text-slate-700 hover:bg-slate-100` / `bg-slate-100 text-slate-950`
- Borders: `border-slate-200`
- Progress bar: `bg-slate-100` / `bg-blue-600`
- Storage stat cards: `bg-white` with `border-slate-200`
- Bell notification dot: `bg-blue-600`

#### PageHeader (`PageHeader.tsx`)

- Title: implicit (inherits)
- Description: `text-slate-500`

#### MetricCard (`MetricCard.tsx`)

- Label: `text-slate-500`
- Value: implicit
- Icon background: `bg-blue-50 text-blue-600`

### Drive Components

#### BrandLogo (`BrandLogo.tsx`)

- Background: `bg-blue-600`
- Shadow: `shadow-blue-200`

#### FileContextMenu / EmptyAreaContextMenu / FolderContextMenu

- Backdrop: `bg-slate-950/20`
- Menu: `border border-slate-200 bg-white shadow-2xl shadow-slate-900/15`
- Title: `text-slate-500`

#### FileDetailsDrawer (`FileDetailsDrawer.tsx`)

- Backdrop: `bg-slate-950/30` / `bg-slate-950/0`
- Drawer: `border-l border-slate-200 bg-white`
- Header border: `border-b border-slate-200`
- Detail rows: `bg-slate-50`
- Icons: `text-blue-600`
- Labels: `text-slate-400`
- Values: `text-slate-700`

#### AvatarStack (`AvatarStack.tsx`)

- Border: `border-white`

#### FileTable (`FileTable.tsx`)

- Mobile card selected: `border-blue-200 bg-blue-50`
- Mobile card unselected: `border-slate-200 bg-white`
- Table header: `border-b border-slate-200 text-slate-950`
- Row selected: `border-b border-blue-100 bg-blue-50`
- Row unselected: `border-b border-slate-200 hover:bg-slate-50`
- Checkbox accent: `accent-blue-600`
- Star: `fill-yellow-400 text-yellow-400`
- Globe icon: `text-blue-500`
- More menu: `text-slate-500 hover:bg-slate-100`

#### FileGrid (`FileGrid.tsx`)

- Card selected: `border-blue-200 bg-blue-50`
- Card unselected: `hover:-translate-y-0.5 hover:shadow-md`
- Thumbnail backgrounds: `bg-slate-100` (image), `bg-slate-900` (video), `bg-slate-50` (doc)
- Checkbox accent: `accent-blue-600`
- More button: `text-slate-500 hover:bg-white/80`
- Name: `text-slate-950`
- Date: `text-slate-500`
- Badges: `bg-slate-100 text-slate-600`
- Public badge: `text-blue-500`

#### FolderVisual (`FolderVisual.tsx`)

- Custom folder colors (hex):
  - `#3b82f6` (blue)
  - `#84cc16` (lime)
  - `#22d3ee` (cyan)
  - `#facc15` (yellow)
  - `#f97316` (orange)
  - `#ef4444` (red)
  - `#a855f7` (purple)
  - `#14b8a6` (teal)

#### FolderGrid (`FolderGrid.tsx`)

- Card: `group relative flex min-h-36 cursor-pointer flex-col items-center justify-center p-4 transition hover:-translate-y-1 hover:shadow-xl`
- Menu button: `text-slate-500 hover:bg-slate-100`
- Folder name: implicit
- Updated text: `text-slate-500`

#### DummyModal (`DummyModal.tsx`)

- Backdrop: `bg-slate-950/45`
- Modal: `border border-slate-200 bg-white`
- Title: implicit
- Description: `text-slate-500`
- Close button: uses Button outline variant

#### FileIcon (`FileIcon.tsx` - not read but referenced)

- Uses kind-based colors

### Pages

#### AllFilesPage (`AllFilesPage.tsx`)

- Main container: implicit (inherits from DriveLayout `bg-white`)
- PageHeader actions: Button variants
- Message: `bg-blue-50 text-blue-700`
- Folder cards: `bg-slate-50 p-3 hover:bg-slate-100`
- Folder menu button: `text-slate-500 hover:bg-white`
- Selection bar: `border-blue-100 bg-blue-50`
- Buttons: various variants
- Pagination: `border-slate-200 bg-white`, active: `bg-slate-950 text-white`
- Cut folder banner: `bg-amber-50 text-amber-700`
- Empty state: `bg-slate-50 text-slate-500`
- Upload drop zone: `border-slate-200 bg-slate-50` / `border-blue-500 bg-blue-50`
- Upload progress: `bg-slate-100`, progress: `bg-blue-600` / `bg-emerald-500` / `bg-red-500`
- File status badges: `bg-slate-100`
- Modals: use DummyModal

#### SettingsPage (`SettingsPage.tsx`)

- PageHeader actions
- Message: `bg-blue-50 text-blue-700`
- Cards: Card component
- Profile card: implicit
- Google Drive card: icon `text-blue-600`
- S3 card: icon `text-blue-600`
- Connected accounts card: `bg-slate-50` for account details
- Stats: `bg-white` with `text-slate-950` / `text-slate-500`
- Sync button: Button outline
- Reconnect button: Button outline
- Disconnect button: Button danger
- S3 modal: Input fields
- Disconnect modal: `bg-slate-50`

#### QuotaTrackerPage (`QuotaTrackerPage.tsx`)

- PageHeader actions
- Message: `bg-blue-50 text-blue-700`
- Metric cards: Card with `text-slate-500` / `text-slate-950`
- Filter buttons: Button outline/soft
- Routing policy card: Card
- Select: `border border-slate-200 bg-white`
- Account cards: `bg-slate-50`
- Provider icons: `bg-white text-blue-600`
- Progress bars: `bg-slate-100` / status colors (red-500, yellow-400, emerald-500)
- Status indicators: `bg-emerald-500` / `bg-yellow-400` / `bg-red-500` with matching text colors
- Empty state: `bg-slate-50` / `text-blue-600`

#### SharedPage (`SharedPage.tsx`)

- PageHeader
- MetricCards
- Cards: Card component
- Received invites: `bg-slate-50`
- Status badges: `bg-emerald-50 text-emerald-700` / `bg-amber-50 text-amber-700`
- Sent invites: `bg-slate-50`
- Role badge: `bg-white text-slate-600`
- Status badges: same as above
- Revoke button: Button danger

#### PublicFilePage (`PublicFilePage.tsx`)

- Failed state: `bg-[#0f1117]` / `border-white/10` / `bg-white/[0.04]` / `text-white` / `text-slate-400`
- Loading state: `bg-[#0f1117]` / `text-slate-400`
- Header: `bg-[#17191f]/95` / `border-b border-white/10` / `text-white` / `text-slate-400`
- Header icon: `bg-white/10 text-slate-100`
- Buttons: ghost/outline with `border-white/10 bg-white/10 text-white hover:bg-white/15`
- Preview section: `bg-[#101218]` / `border-white/10` / `bg-[#0b0d12]` / gradient overlay
- Already has dark theme for public file viewing!

#### LoginPage / RegisterPage (`LoginPage.tsx`, `RegisterPage.tsx`)

- Background: `bg-slate-50`
- Card: Card component
- Logo: `bg-blue-600 text-white`
- Title: implicit
- Description: `text-slate-500`
- Inputs: Input component
- Error: `bg-red-50 text-red-600`
- Buttons: Button variants
- Divider: `bg-slate-200` / `text-slate-400`
- Links: `text-blue-600`

#### GoogleConnectedPage (`GoogleConnectedPage.tsx`)

- Background: `bg-slate-50`
- Card: Card component
- Success: `text-emerald-500`
- Error: `text-red-500`
- Title: implicit
- Description: `text-slate-500`

#### ApiManagementPage (`ApiManagementPage.tsx`)

- PageHeader
- Message: `bg-blue-50 text-blue-700`
- Secret banner: `border-blue-200 bg-blue-50` / `bg-blue-600` / `text-blue-950` / `text-blue-700` / `bg-white text-slate-950`
- Metric cards: Card with colored icons
- API keys card: `bg-slate-50`
- Status badges: `bg-emerald-100 text-emerald-700` / `bg-slate-200 text-slate-600`
- Code blocks: `bg-slate-100 text-slate-950` / `bg-slate-950 text-white`
- Docs card: `bg-slate-100`
- Create modal: Input + Buttons

#### RecentPage / StarredPage / ArchivedPage

- PageHeader
- MetricCards
- Activity cards: `bg-slate-50` / `bg-white text-blue-600`
- Starred cards: Card / `fill-yellow-400 text-yellow-400` / `text-slate-950` / `text-slate-500`
- Archived: Card with `border-orange-200 bg-orange-50 text-orange-700`
- FileTable with mode variants

#### ZoomablePreview (`ZoomablePreview.tsx`)

- Controls: `border-slate-200 bg-white/90` / `text-slate-600`
- Buttons: Button ghost variant

---

## 2. Semantic Color Token Scheme Proposal

### CSS Custom Properties (to be added to `:root` in `style.css`)

```css
:root {
  /* ===== Light Mode (Default) ===== */
  /* Backgrounds */
  --color-bg-primary: #f8fafc; /* Page/Canvas background (slate-50) */
  --color-bg-secondary: #ffffff; /* Card/Surface background (white) */
  --color-bg-tertiary: #f1f5f9; /* Hover/Subtle backgrounds (slate-100) */
  --color-bg-hover: #e2e8f0; /* Stronger hover (slate-200) */
  --color-bg-active: #cbd5e1; /* Active/Pressed (slate-300) */
  --color-bg-brand: #2563eb; /* Brand primary (blue-600) */
  --color-bg-brand-hover: #1d4ed8; /* Brand hover (blue-700) */
  --color-bg-brand-subtle: #dbeafe; /* Brand subtle (blue-50) */
  --color-bg-brand-border: #bfdbfe; /* Brand border (blue-200) */
  --color-bg-success-subtle: #dcfce7; /* Success subtle (emerald-50) */
  --color-bg-success-border: #86efac; /* Success border (emerald-200) */
  --color-bg-warning-subtle: #fef9c3; /* Warning subtle (yellow-50) */
  --color-bg-warning-border: #fde047; /* Warning border (yellow-300) */
  --color-bg-danger-subtle: #fef2f2; /* Danger subtle (red-50) */
  --color-bg-danger-border: #fecaca; /* Danger border (red-200) */
  --color-bg-info-subtle: #e0f2fe; /* Info subtle (sky-50) */
  --color-bg-info-border: #7dd3fc; /* Info border (sky-200) */
  --color-bg-overlay: rgba(15, 23, 42, 0.45); /* Modal/Drawer backdrop */
  --color-bg-overlay-strong: rgba(15, 23, 42, 0.3); /* Mobile sidebar overlay */

  /* Text Colors */
  --color-text-primary: #0f172a; /* Primary text (slate-950) */
  --color-text-secondary: #334155; /* Secondary text (slate-700) */
  --color-text-tertiary: #64748b; /* Tertiary/Muted text (slate-500) */
  --color-text-quaternary: #94a3b8; /* Placeholder/Disabled (slate-400) */
  --color-text-inverse: #ffffff; /* On dark backgrounds */
  --color-text-brand: #2563eb; /* Brand text (blue-600) */
  --color-text-brand-hover: #1d4ed8; /* Brand hover text (blue-700) */
  --color-text-success: #166534; /* Success text (emerald-700) */
  --color-text-warning: #854d0e; /* Warning text (amber-700) */
  --color-text-danger: #991b1b; /* Danger text (red-700) */
  --color-text-info: #0369a1; /* Info text (sky-700) */

  /* Border Colors */
  --color-border-primary: #e2e8f0; /* Default borders (slate-200) */
  --color-border-secondary: #cbd5e1; /* Stronger borders (slate-300) */
  --color-border-focus: #2563eb; /* Focus ring (blue-500) */
  --color-border-brand: #bfdbfe; /* Brand borders (blue-200) */
  --color-border-success: #86efac; /* Success borders */
  --color-border-warning: #fde047; /* Warning borders */
  --color-border-danger: #fecaca; /* Danger borders */

  /* Shadow Colors */
  --color-shadow-sm: rgba(15, 23, 42, 0.05);
  --color-shadow-md: rgba(15, 23, 42, 0.1);
  --color-shadow-lg: rgba(15, 23, 42, 0.15);
  --color-shadow-xl: rgba(15, 23, 42, 0.2);
  --color-shadow-brand: rgba(37, 99, 235, 0.25);

  /* Interactive States */
  --color-ring-offset: #ffffff;
  --color-ring: #2563eb;
  --color-ring-success: #22c55e;
  --color-ring-warning: #eab308;
  --color-ring-danger: #ef4444;

  /* Component Specific */
  --color-input-bg: #ffffff;
  --color-input-border: #e2e8f0;
  --color-input-text: #0f172a;
  --color-input-placeholder: #94a3b8;

  --color-card-bg: #ffffff;
  --color-card-border: #e2e8f0;
  --color-card-shadow: rgba(15, 23, 42, 0.05);

  --color-button-primary-bg: #2563eb;
  --color-button-primary-text: #ffffff;
  --color-button-primary-hover: #1d4ed8;
  --color-button-primary-shadow: rgba(37, 99, 235, 0.25);

  --color-button-outline-bg: #ffffff;
  --color-button-outline-text: #0f172a;
  --color-button-outline-border: #e2e8f0;
  --color-button-outline-hover: #f1f5f9;

  --color-button-ghost-text: #334155;
  --color-button-ghost-hover: #f1f5f9;

  --color-button-soft-bg: #f1f5f9;
  --color-button-soft-text: #0f172a;
  --color-button-soft-hover: #e2e8f0;

  --color-button-danger-text: #ea580c;
  --color-button-danger-hover: #fff7ed;

  /* Selection/Highlight */
  --color-selection-bg: #dbeafe;
  --color-selection-border: #bfdbfe;
  --color-selection-text: #1e40af;

  /* Progress/Loading */
  --color-progress-track: #e2e8f0;
  --color-progress-fill: #2563eb;

  /* Video/Preview */
  --color-video-bg: #000000;

  /* Folder Colors (remain as hex, but can be CSS vars if needed) */
  --folder-color-1: #3b82f6; /* blue */
  --folder-color-2: #84cc16; /* lime */
  --folder-color-3: #22d3ee; /* cyan */
  --folder-color-4: #facc15; /* yellow */
  --folder-color-5: #f97316; /* orange */
  --folder-color-6: #ef4444; /* red */
  --folder-color-7: #a855f7; /* purple */
  --folder-color-8: #14b8a6; /* teal */
}

/* ===== Dark Mode ===== */
.dark {
  /* Backgrounds */
  --color-bg-primary: #0f172a; /* slate-950 */
  --color-bg-secondary: #1e293b; /* slate-800 */
  --color-bg-tertiary: #334155; /* slate-700 */
  --color-bg-hover: #475569; /* slate-600 */
  --color-bg-active: #64748b; /* slate-500 */
  --color-bg-brand: #3b82f6; /* blue-500 */
  --color-bg-brand-hover: #2563eb; /* blue-600 */
  --color-bg-brand-subtle: #1e3a5f; /* blue-900/50 */
  --color-bg-brand-border: #1e40af; /* blue-800 */
  --color-bg-success-subtle: #064e3b; /* emerald-900/50 */
  --color-bg-success-border: #065f46; /* emerald-800 */
  --color-bg-warning-subtle: #713f12; /* amber-900/50 */
  --color-bg-warning-border: #92400e; /* amber-800 */
  --color-bg-danger-subtle: #7f1d1d; /* red-900/50 */
  --color-bg-danger-border: #991b1b; /* red-800 */
  --color-bg-info-subtle: #0c4a6e; /* sky-900/50 */
  --color-bg-info-border: #075985; /* sky-800 */
  --color-bg-overlay: rgba(0, 0, 0, 0.6);
  --color-bg-overlay-strong: rgba(0, 0, 0, 0.4);

  /* Text Colors */
  --color-text-primary: #f8fafc; /* slate-50 */
  --color-text-secondary: #e2e8f0; /* slate-200 */
  --color-text-tertiary: #94a3b8; /* slate-400 */
  --color-text-quaternary: #64748b; /* slate-500 */
  --color-text-inverse: #0f172a; /* slate-950 */
  --color-text-brand: #60a5fa; /* blue-400 */
  --color-text-brand-hover: #93c5fd; /* blue-300 */
  --color-text-success: #6ee7b7; /* emerald-300 */
  --color-text-warning: #fde047; /* yellow-300 */
  --color-text-danger: #fca5a5; /* red-300 */
  --color-text-info: #7dd3fc; /* sky-300 */

  /* Border Colors */
  --color-border-primary: #334155; /* slate-700 */
  --color-border-secondary: #475569; /* slate-600 */
  --color-border-focus: #3b82f6; /* blue-500 */
  --color-border-brand: #1e40af; /* blue-800 */
  --color-border-success: #065f46; /* emerald-800 */
  --color-border-warning: #92400e; /* amber-800 */
  --color-border-danger: #991b1b; /* red-800 */

  /* Shadow Colors */
  --color-shadow-sm: rgba(0, 0, 0, 0.2);
  --color-shadow-md: rgba(0, 0, 0, 0.3);
  --color-shadow-lg: rgba(0, 0, 0, 0.4);
  --color-shadow-xl: rgba(0, 0, 0, 0.5);
  --color-shadow-brand: rgba(59, 130, 246, 0.3);

  /* Interactive States */
  --color-ring-offset: #1e293b;
  --color-ring: #3b82f6;
  --color-ring-success: #4ade80;
  --color-ring-warning: #facc15;
  --color-ring-danger: #f87171;

  /* Component Specific */
  --color-input-bg: #1e293b;
  --color-input-border: #334155;
  --color-input-text: #f8fafc;
  --color-input-placeholder: #64748b;

  --color-card-bg: #1e293b;
  --color-card-border: #334155;
  --color-card-shadow: rgba(0, 0, 0, 0.2);

  --color-button-primary-bg: #3b82f6;
  --color-button-primary-text: #ffffff;
  --color-button-primary-hover: #2563eb;
  --color-button-primary-shadow: rgba(59, 130, 246, 0.3);

  --color-button-outline-bg: #1e293b;
  --color-button-outline-text: #f8fafc;
  --color-button-outline-border: #334155;
  --color-button-outline-hover: #334155;

  --color-button-ghost-text: #e2e8f0;
  --color-button-ghost-hover: #334155;

  --color-button-soft-bg: #334155;
  --color-button-soft-text: #f8fafc;
  --color-button-soft-hover: #475569;

  --color-button-danger-text: #fb923c;
  --color-button-danger-hover: #334155;

  /* Selection/Highlight */
  --color-selection-bg: #1e3a5f;
  --color-selection-border: #1e40af;
  --color-selection-text: #93c5fd;

  /* Progress/Loading */
  --color-progress-track: #334155;
  --color-progress-fill: #3b82f6;

  /* Video/Preview */
  --color-video-bg: #000000;
}

/* ===== Transitions ===== */
*,
*::before,
*::after {
  transition-property:
    color, background-color, border-color, text-decoration-color, fill, stroke,
    opacity, box-shadow, transform, filter, backdrop-filter;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 200ms;
}

/* Disable transitions for reduced motion */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    transition-duration: 0.01ms !important;
  }
}

/* ===== System preference fallback ===== */
@media (prefers-color-scheme: dark) {
  :root:not(.light) {
    /* Dark mode variables applied automatically if no .light class */
  }
}
```

---

## 3. Migration Strategy

### Phase 1: Foundation (Week 1)

1. **Add CSS Custom Properties** to `frontend/src/style.css`
2. **Create ThemeProvider** context and hook
3. **Create ThemeToggle** component with Sun/Moon icons
4. **Add localStorage persistence** and cookie for SSR hydration
5. **Apply `.dark` class to `<html>`** on mount (prevent FOIT)

### Phase 2: Core UI Components (Week 1-2)

Update primitive components to use semantic tokens:

- `Button` - All variants
- `Card` - Border, background, shadow
- `Input` - Background, border, text, focus states
- `DummyModal` - Backdrop, modal surface, text

### Phase 3: Layout Components (Week 2)

- `DriveLayout` - Sidebar, header, mobile overlays, navigation
- `PageHeader` - Text colors
- `MetricCard` - Icon background, text colors
- `BrandLogo` - Already uses brand colors (works)

### Phase 4: Drive Components (Week 2-3)

- `FileContextMenu`, `EmptyAreaContextMenu`, `FolderContextMenu`
- `FileDetailsDrawer`
- `FileTable` - All row states, headers, badges
- `FileGrid` - Cards, thumbnails, badges
- `FolderGrid` - Cards
- `FolderVisual` - Keep folder colors as-is (they're user-customizable)
- `ZoomablePreview` - Controls

### Phase 5: Pages (Week 3)

- `AllFilesPage` - Upload zone, messages, pagination, modals
- `SettingsPage` - Account cards, stats, modals
- `QuotaTrackerPage` - Metric cards, progress bars, account cards
- `SharedPage` - Invite cards, status badges
- `PublicFilePage` - Already dark! Just ensure consistency
- `LoginPage` / `RegisterPage` - Forms, cards
- `ApiManagementPage` - Secret banner, code blocks, metric cards
- `RecentPage` / `StarredPage` / `ArchivedPage` - Activity cards
- `GoogleConnectedPage` - Status colors

### Phase 6: Polish & Testing (Week 3-4)

- Verify WCAG AA contrast ratios
- Test all interactive states
- Verify transitions feel smooth
- Test persistence across sessions
- Test system preference detection
- Mobile testing

---

## 4. ThemeProvider & ThemeToggle Implementation

### `frontend/src/lib/theme.ts`

```typescript
import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: Theme;
  resolvedTheme: 'light' | 'dark';
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('system');
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light');
  const [mounted, setMounted] = useState(false);

  // Initialize from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('9drive:theme') as Theme | null;
    if (stored) {
      setThemeState(stored);
    }
    setMounted(true);
  }, []);

  // Resolve system theme
  useEffect(() => {
    if (!mounted) return;

    const resolveTheme = (t: Theme): 'light' | 'dark' => {
      if (t === 'system') {
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      }
      return t;
    };

    const resolved = resolveTheme(theme);
    setResolvedTheme(resolved);
    document.documentElement.classList.toggle('dark', resolved === 'dark');

    // Store in cookie for SSR (if needed)
    document.cookie = `theme=${resolved}; path=/; max-age=31536000; SameSite=Lax`;
  }, [theme, mounted]);

  // Listen for system theme changes
  useEffect(() => {
    if (!mounted || theme !== 'system') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => {
      const resolved = e.matches ? 'dark' : 'light';
      setResolvedTheme(resolved);
      document.documentElement.classList.toggle('dark', resolved === 'dark');
      document.cookie = `theme=${resolved}; path=/; max-age=31536000; SameSite=Lax`;
    };

    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, [theme, mounted]);

  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem('9drive:theme', newTheme);
  }, []);

  if (!mounted) {
    // Render children without theme context to avoid hydration mismatch
    // The actual theme will be applied in useEffect
    return <>{children}</>;
  }

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
```

### `frontend/src/components/ui/ThemeToggle.tsx`

```typescript
import { Sun, Moon, Monitor } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/lib/theme';
import { cn } from '@/lib/utils';

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, resolvedTheme, setTheme } = useTheme();

  return (
    <div className={cn('flex items-center gap-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-800', className)}>
      <Button
        variant={theme === 'light' ? 'default' : 'ghost'}
        size="icon"
        onClick={() => setTheme('light')}
        aria-label="Light mode"
        title="Light"
        className="rounded-lg"
      >
        <Sun className="h-4 w-4" />
      </Button>
      <Button
        variant={theme === 'system' ? 'default' : 'ghost'}
        size="icon"
        onClick={() => setTheme('system')}
        aria-label="System preference"
        title="System"
        className="rounded-lg"
      >
        <Monitor className="h-4 w-4" />
      </Button>
      <Button
        variant={theme === 'dark' ? 'default' : 'ghost'}
        size="icon"
        onClick={() => setTheme('dark')}
        aria-label="Dark mode"
        title="Dark"
        className="rounded-lg"
      >
        <Moon className="h-4 w-4" />
      </Button>
    </div>
  );
}
```

### Integration in `DriveLayout.tsx` (Header)

```typescript
// Add import
import { ThemeToggle } from '@/components/ui/ThemeToggle';

// In header section (around line 305, after search form)
<div className="relative hidden flex-wrap gap-3 lg:flex">
  <ThemeToggle />
  <Button variant="outline" size="icon" ...>...</Button>
</div>
```

### Integration in `main.tsx`

```typescript
import { ThemeProvider } from '@/lib/theme';

// Wrap App
<ThemeProvider>
  <App />
</ThemeProvider>
```

---

## 5. Component Migration Examples

### Button Component (Updated)

```typescript
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)] disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "bg-[var(--color-button-primary-bg)] text-[var(--color-button-primary-text)] shadow-[var(--color-button-primary-shadow)] hover:bg-[var(--color-button-primary-hover)]",
        outline:
          "border border-[var(--color-button-outline-border)] bg-[var(--color-button-outline-bg)] text-[var(--color-button-outline-text)] shadow-sm hover:bg-[var(--color-button-outline-hover)]",
        ghost:
          "text-[var(--color-button-ghost-text)] hover:bg-[var(--color-button-ghost-hover)]",
        soft: "bg-[var(--color-button-soft-bg)] text-[var(--color-button-soft-text)] shadow-sm hover:bg-[var(--color-button-soft-hover)]",
        danger:
          "text-[var(--color-button-danger-text)] hover:bg-[var(--color-button-danger-hover)]",
      },
      // sizes unchanged
    },
  },
);
```

### Card Component (Updated)

```typescript
export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-[var(--color-card-border)] bg-[var(--color-card-bg)] shadow-[var(--color-card-shadow)]',
        className
      )}
      {...props}
    />
  );
}
```

### Input Component (Updated)

```typescript
export function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        'h-11 w-full rounded-xl border border-[var(--color-input-border)] bg-[var(--color-input-bg)] px-4 text-sm outline-none transition',
        'focus:border-[var(--color-border-focus)] focus:ring-2 focus:ring-[var(--color-ring)]/20',
        'placeholder:text-[var(--color-input-placeholder)]',
        className
      )}
      {...props}
    />
  );
}
```

---

## 6. Accessibility & UX Checklist

### Contrast Verification (WCAG AA)

- [ ] Primary text on primary background: 4.5:1 minimum
- [ ] Secondary text on primary background: 4.5:1 minimum
- [ ] Interactive elements (buttons, links): 3:1 minimum for non-text
- [ ] Focus indicators: 3:1 minimum against adjacent colors
- [ ] Error/success/warning states: 4.5:1 for text

### Transitions

- [ ] All color transitions use `transition-colors duration-200`
- [ ] Respect `prefers-reduced-motion`
- [ ] No layout shifts during theme change

### Persistence

- [ ] Theme saved to localStorage
- [ ] Cookie set for SSR hydration
- [ ] System preference respected when 'system' selected
- [ ] No flash of incorrect theme on page load

### Testing Pages (Both Light & Dark)

- [ ] Login / Register
- [ ] All Files (list & grid view)
- [ ] Settings
- [ ] Quota Tracker
- [ ] Shared
- [ ] API Management
- [ ] Recent / Starred / Archived
- [ ] Public File Page (embed & standalone)
- [ ] Modals (Upload, Create Folder, Share, Invite, Delete, etc.)
- [ ] Context Menus (File, Folder, Empty Area)
- [ ] File Details Drawer
- [ ] Mobile Sidebar
- [ ] Upload Progress Panel
- [ ] Zoomable Preview

---

## 7. Files to Modify

### New Files

1. `frontend/src/lib/theme.ts` - ThemeProvider & useTheme hook
2. `frontend/src/components/ui/ThemeToggle.tsx` - Toggle component

### Modified Files

1. `frontend/src/style.css` - Add CSS custom properties
2. `frontend/src/main.tsx` - Wrap with ThemeProvider
3. `frontend/src/layouts/DriveLayout.tsx` - Add ThemeToggle to header
4. `frontend/src/components/ui/button.tsx` - Use semantic tokens
5. `frontend/src/components/ui/card.tsx` - Use semantic tokens
6. `frontend/src/components/ui/input.tsx` - Use semantic tokens
7. `frontend/src/components/drive/DummyModal.tsx` - Use semantic tokens
8. `frontend/src/components/drive/PageHeader.tsx` - Text colors
9. `frontend/src/components/drive/MetricCard.tsx` - Icon background
10. `frontend/src/components/drive/BrandLogo.tsx` - Verify brand colors work
11. `frontend/src/components/drive/FileContextMenu.tsx` - Menu styling
12. `frontend/src/components/drive/EmptyAreaContextMenu.tsx` - Menu styling
13. `frontend/src/components/drive/FolderContextMenu.tsx` - Menu styling
14. `frontend/src/components/drive/FileDetailsDrawer.tsx` - Drawer styling
15. `frontend/src/components/drive/AvatarStack.tsx` - Border color
16. `frontend/src/components/drive/FileTable.tsx` - All table states
17. `frontend/src/components/drive/FileGrid.tsx` - Grid cards, thumbnails
18. `frontend/src/components/drive/FolderGrid.tsx` - Folder cards
19. `frontend/src/components/drive/FolderVisual.tsx` - Keep as-is (user colors)
20. `frontend/src/components/drive/ZoomablePreview.tsx` - Controls
21. `frontend/src/pages/AllFilesPage.tsx` - Page-specific colors
22. `frontend/src/pages/SettingsPage.tsx` - Page-specific colors
23. `frontend/src/pages/QuotaTrackerPage.tsx` - Progress bars, status colors
24. `frontend/src/pages/SharedPage.tsx` - Status badges
25. `frontend/src/pages/PublicFilePage.tsx` - Verify dark theme consistency
26. `frontend/src/pages/LoginPage.tsx` - Form styling
27. `frontend/src/pages/RegisterPage.tsx` - Form styling
28. `frontend/src/pages/ApiManagementPage.tsx` - Code blocks, banners
29. `frontend/src/pages/GoogleConnectedPage.tsx` - Status colors
30. `frontend/src/pages/RecentPage.tsx` - Activity cards
31. `frontend/src/pages/StarredPage.tsx` - Starred cards
32. `frontend/src/pages/ArchivedPage.tsx` - Warning banner
