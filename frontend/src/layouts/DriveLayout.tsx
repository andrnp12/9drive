import { type FormEvent, useEffect, useRef, useState } from "react";
import {
  NavLink,
  Outlet,
  useLocation,
  useNavigate,
  useSearchParams,
} from "react-router-dom";
import {
  Bell,
  FileArchive,
  Gauge,
  LogOut,
  Menu,
  Search,
  Settings,
  Share2,
  SlidersHorizontal,
  Star,
  User,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { BrandLogo } from "@/components/drive/BrandLogo";
import { Input } from "@/components/ui/input";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { apiFetch, formatBytes, formatDate } from "@/lib/api";
import { clearAuthSession, getStoredUser, type AuthUser } from "@/lib/auth";
import { getGravatarUrl } from "@/lib/gravatar";
import { cn } from "@/lib/utils";

const SIDEBAR_STORAGE_KEY = "9drive_sidebar_collapsed";

const menu = [
  { label: "All Files", icon: FileArchive, href: "/all-files" },
  { label: "Quota Tracker", icon: Gauge, href: "/quota" },
  { label: "Shared With Me", icon: Share2, href: "/shared" },
  { label: "Starred", icon: Star, href: "/starred", disabled: true },
];

type StorageSummary = {
  totalBytes: string;
  usedBytes: string;
  availableBytes: string;
};

type StorageBreakdown = {
  photo: string;
  video: string;
  document: string;
};

type RepoUpdate = {
  sha: string;
  title: string;
  author: string;
  date: string;
  url: string;
};

type GitHubCommit = {
  sha: string;
  html_url: string;
  commit: {
    message: string;
    author?: {
      name?: string;
      date?: string;
    };
  };
};

function RepoUpdatesDropdown({
  updates,
  loading,
  error,
  isMobile,
  onClose,
}: {
  updates: RepoUpdate[];
  loading: boolean;
  error: string;
  isMobile?: boolean;
  onClose?: (event?: React.MouseEvent) => void;
}) {
  return (
    <div
      className={cn(
        "z-50 overflow-hidden rounded-2xl border border-[var(--color-card-border)] bg-[var(--color-card-bg)] shadow-2xl shadow-[var(--color-shadow-xl)]",
        isMobile
          ? "fixed top-16 left-0 right-0 w-full rounded-b-2xl border-t-0 bottom-auto max-h-[70vh]"
          : "absolute right-0 top-12 w-[min(calc(100vw-2rem),24rem)]",
      )}
    >
      <div className="border-b border-[var(--color-card-border)] px-4 py-3 flex items-center justify-between">
        <div>
          <p className="text-sm font-extrabold text-[var(--color-text-primary)]">
            Repository Updates
          </p>
          <p className="text-xs text-[var(--color-text-tertiary)]">
            Latest commits from zenhosta/9drive
          </p>
        </div>
        {isMobile && (
          <button
            type="button"
            className="p-1 rounded-lg text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)] transition-colors"
            onClick={onClose}
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>
      <div className="max-h-96 overflow-y-auto p-2">
        {loading ? (
          <p className="p-4 text-sm text-[var(--color-text-tertiary)]">
            Loading updates...
          </p>
        ) : null}
        {error ? (
          <p className="p-4 text-sm text-[var(--color-text-danger)]">{error}</p>
        ) : null}
        {!loading && !error && updates.length === 0 ? (
          <p className="p-4 text-sm text-[var(--color-text-tertiary)]">
            No updates found.
          </p>
        ) : null}
        {!loading && !error
          ? updates.map((update) => (
              <a
                key={update.sha}
                href={update.url}
                target="_blank"
                rel="noreferrer"
                className="block rounded-xl p-3 transition hover:bg-[var(--color-bg-hover)]"
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="line-clamp-2 min-w-0 text-sm font-bold leading-snug text-[var(--color-text-primary)]">
                    {update.title}
                  </p>
                  <span className="shrink-0 rounded-full bg-[var(--color-bg-tertiary)] px-2 py-0.5 text-[11px] font-bold text-[var(--color-text-secondary)]">
                    {update.sha}
                  </span>
                </div>
                <p className="mt-1 truncate text-xs text-[var(--color-text-tertiary)]">
                  {update.author} • {update.date}
                </p>
              </a>
            ))
          : null}
      </div>
      <a
        href="https://github.com/zenhosta/9drive"
        target="_blank"
        rel="noreferrer"
        className="block border-t border-[var(--color-card-border)] px-4 py-3 text-sm font-bold text-[var(--color-text-brand)] hover:bg-[var(--color-bg-brand-subtle)]"
      >
        View repository
      </a>
    </div>
  );
}

function Sidebar({
  onNavigate,
  storage,
  breakdown,
  isCollapsed,
  onToggleCollapse,
  onExpand,
}: {
  onNavigate?: () => void;
  storage: StorageSummary | null;
  breakdown: StorageBreakdown;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onExpand: () => void;
}) {
  const used = Number(storage?.usedBytes ?? 0);
  const total = Number(storage?.totalBytes ?? 0);
  const progress = total > 0 ? Math.min(100, (used / total) * 100) : 0;
  const items = [
    ["Photo", formatBytes(breakdown.photo), "bg-lime-500"],
    ["Video", formatBytes(breakdown.video), "bg-yellow-400"],
    ["Document", formatBytes(breakdown.document), "bg-cyan-400"],
    ["Free Storage", formatBytes(storage?.availableBytes), "bg-orange-500"],
  ];

  // Standardized icon container: 40x40px with centered 20x20px icon
  const iconContainerClass =
    "flex h-10 w-10 items-center justify-center shrink-0";
  const iconClass = "h-5 w-5";

  return (
    <aside
      id="sidebar"
      role="navigation"
      aria-label="Main navigation"
      className={cn(
        "flex h-full flex-col border-[var(--color-card-border)] bg-[var(--color-card-bg)] p-5 lg:border-r",
        "transition-[width,opacity,transform] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]",
        isCollapsed
          ? "w-[var(--sidebar-width-collapsed)]"
          : "w-[var(--sidebar-width-expanded)]",
      )}
      style={{
        transitionProperty: "width, opacity, transform",
        transitionDuration: "var(--sidebar-transition-duration)",
        transitionTimingFunction: "var(--sidebar-transition-easing)",
      }}
    >
      {/* Sidebar Header with Logo and Hamburger Toggle */}
      <div className="flex items-center gap-2 pb-5">
        {/* Clickable logo area - expands sidebar when clicked in collapsed state */}
        <div
          className={cn(
            "flex items-center gap-2 cursor-pointer select-none transition-opacity duration-200",
            isCollapsed ? "justify-center w-full" : "flex-1",
          )}
          role="button"
          tabIndex={0}
          aria-label={isCollapsed ? "Expand sidebar" : "9Drive Home"}
          aria-expanded={!isCollapsed}
          onClick={onExpand}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              onExpand();
            }
          }}
        >
          <BrandLogo className="h-9 w-9 shrink-0" />
          {!isCollapsed && (
            <span className="text-xl font-extrabold tracking-tight text-[var(--color-text-primary)] transition-opacity duration-200 whitespace-nowrap overflow-hidden">
              9Drive
            </span>
          )}
        </div>
        {/* Hamburger toggle - only visible when expanded */}
        {!isCollapsed && (
          <button
            type="button"
            className={cn(
              iconContainerClass,
              "text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)] rounded-xl transition-all duration-200",
              "focus:outline-none focus:ring-2 focus:ring-[var(--color-ring)] focus:ring-offset-2 focus:ring-offset-[var(--color-card-bg)]",
            )}
            aria-label="Collapse sidebar"
            aria-expanded={false}
            aria-controls="sidebar"
            onClick={onToggleCollapse}
          >
            <Menu className={iconClass} />
          </button>
        )}
      </div>
      {/* Navigation Menu */}
      <nav
        className={cn(
          "mt-6 flex flex-col gap-2",
          isCollapsed ? "items-center" : "items-start",
        )}
        aria-label="Main menu"
        style={{ minWidth: 0 }}
      >
        {menu.map((item) =>
          item.disabled ? (
            <button
              key={item.label}
              type="button"
              disabled
              className={cn(
                "relative flex h-11 rounded-xl text-sm font-semibold text-[var(--color-text-quaternary)] opacity-70 transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]",
                "focus:outline-none",
                isCollapsed
                  ? "items-center justify-center w-11 px-0"
                  : "items-center gap-2 justify-start w-full px-4",
              )}
              style={{
                transitionProperty: "width, opacity, transform, padding",
                transitionDuration: "var(--sidebar-transition-duration)",
                transitionTimingFunction: "var(--sidebar-transition-easing)",
              }}
              aria-label={item.label}
            >
              {/* Icon wrapper: fixed square like logo, centered in button */}
              <span
                className={cn(
                  "flex h-11 w-11 items-center justify-center shrink-0",
                  isCollapsed ? "mx-auto" : "shrink-0",
                )}
              >
                <item.icon className="h-6 w-6" />
              </span>
              {!isCollapsed && (
                <span className="transition-opacity duration-200 whitespace-nowrap overflow-hidden">
                  {item.label}
                </span>
              )}
            </button>
          ) : (
            <NavLink
              key={item.label}
              to={item.href}
              onClick={onNavigate}
              className={({ isActive }) =>
                cn(
                  "relative flex h-11 rounded-xl text-sm font-semibold transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]",
                  "focus:outline-none",
                  isCollapsed
                    ? "items-center justify-center w-11 px-0"
                    : "items-center gap-2 justify-start w-full px-4",
                  isActive
                    ? "bg-[var(--color-bg-tertiary)] text-[var(--color-text-primary)] shadow-sm"
                    : "text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)]",
                )
              }
              style={{
                transitionProperty:
                  "width, opacity, transform, padding, background-color",
                transitionDuration: "var(--sidebar-transition-duration)",
                transitionTimingFunction: "var(--sidebar-transition-easing)",
              }}
              aria-label={item.label}
              title={isCollapsed ? item.label : undefined}
            >
              {/* Icon wrapper: fixed square like logo, centered in NavLink */}
              <span
                className={cn(
                  "flex h-11 w-11 items-center justify-center shrink-0",
                  isCollapsed ? "mx-auto" : "shrink-0",
                )}
              >
                <item.icon className="h-6 w-6" />
              </span>
              {!isCollapsed && (
                <span className="transition-opacity duration-200 whitespace-nowrap overflow-hidden">
                  {item.label}
                </span>
              )}
            </NavLink>
          ),
        )}
      </nav>

      {/* Storage Calculation Section - Preserved layout when expanded, hidden when collapsed */}
      <div
        className={cn(
          "mt-6 lg:mt-auto transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] overflow-hidden",
          isCollapsed
            ? "h-0 opacity-0 pointer-events-none"
            : "h-auto opacity-100",
        )}
        style={{
          transitionProperty: "height, opacity, padding, margin",
          transitionDuration: "var(--sidebar-transition-duration)",
          transitionTimingFunction: "var(--sidebar-transition-easing)",
        }}
      >
        <Card className="p-4">
          {items.map(([label, value, color]) => (
            <div
              key={label}
              className="mb-3 flex items-center justify-between text-sm transition-opacity duration-200"
            >
              <span className="flex items-center gap-3">
                <span className={cn("h-4 w-4 rounded", color)} />
                <span className="text-[var(--color-text-secondary)] transition-opacity duration-200 whitespace-nowrap overflow-hidden">
                  {label}
                </span>
              </span>
              <span className="font-semibold text-[var(--color-text-primary)] transition-opacity duration-200 whitespace-nowrap overflow-hidden">
                {value}
              </span>
            </div>
          ))}
          <div className="mt-4 border-t border-[var(--color-card-border)] pt-4 text-sm transition-opacity duration-200">
            <p className="text-[var(--color-text-secondary)]">
              <b className="text-[var(--color-text-primary)]">
                {formatBytes(storage?.usedBytes)}
              </b>{" "}
              used of{" "}
              <span className="text-[var(--color-text-tertiary)]">
                {formatBytes(storage?.totalBytes)}
              </span>
            </p>
            <div className="my-3 h-1.5 rounded-full bg-[var(--color-bg-tertiary)]">
              <div
                className="h-full rounded-full bg-[var(--color-bg-brand)] transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </Card>
      </div>
    </aside>
  );
}

export function DriveLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(SIDEBAR_STORAGE_KEY);
      return stored === "true";
    }
    return false;
  });
  const [searchValue, setSearchValue] = useState(searchParams.get("q") ?? "");
  const [user, setUser] = useState<AuthUser | null>(getStoredUser());
  const [profileImageUrl, setProfileImageUrl] = useState("");
  const [storage, setStorage] = useState<StorageSummary | null>(null);
  const [breakdown, setBreakdown] = useState<StorageBreakdown>({
    photo: "0",
    video: "0",
    document: "0",
  });
  const [updatesOpen, setUpdatesOpen] = useState(false);
  const [updates, setUpdates] = useState<RepoUpdate[]>([]);
  const [updatesLoading, setUpdatesLoading] = useState(false);
  const [updatesError, setUpdatesError] = useState("");
  const [updatesLoaded, setUpdatesLoaded] = useState(false);
  const [sidebarAnnouncement, setSidebarAnnouncement] = useState("");
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const accountMenuRef = useRef<HTMLDivElement>(null);
  const mobileAccountMenuRef = useRef<HTMLDivElement>(null);

  // Persist sidebar collapsed state to localStorage
  useEffect(() => {
    localStorage.setItem(SIDEBAR_STORAGE_KEY, String(isSidebarCollapsed));
  }, [isSidebarCollapsed]);

  // Announce sidebar state changes for screen readers
  useEffect(() => {
    if (sidebarAnnouncement) {
      const announcement = document.createElement("div");
      announcement.setAttribute("role", "status");
      announcement.setAttribute("aria-live", "polite");
      announcement.setAttribute("aria-atomic", "true");
      announcement.className = "sr-only";
      announcement.textContent = sidebarAnnouncement;
      document.body.appendChild(announcement);
      setTimeout(() => document.body.removeChild(announcement), 1000);
    }
  }, [sidebarAnnouncement]);

  function toggleSidebar() {
    const nextState = !isSidebarCollapsed;
    setIsSidebarCollapsed(nextState);
    setSidebarAnnouncement(
      nextState ? "Sidebar collapsed" : "Sidebar expanded",
    );
  }

  function expandSidebar() {
    if (isSidebarCollapsed) {
      setIsSidebarCollapsed(false);
      setSidebarAnnouncement("Sidebar expanded");
    }
  }

  const loadSidebarStatsRef = useRef<(() => Promise<void>) | null>(null);

  async function loadSidebarStats() {
    await Promise.all([
      apiFetch<StorageSummary>("/storage/summary").then(setStorage),
      apiFetch<StorageBreakdown>("/storage/breakdown").then(setBreakdown),
    ]);
  }

  loadSidebarStatsRef.current = loadSidebarStats;

  useEffect(() => {
    setSearchValue(searchParams.get("q") ?? "");
  }, [searchParams]);

  async function logout() {
    await apiFetch("/auth/logout", { method: "POST" }).catch(() => undefined);
    clearAuthSession();
    navigate("/login");
  }

  function searchFiles(event: FormEvent) {
    event.preventDefault();
    const nextParams = new URLSearchParams(
      location.pathname === "/all-files" ? searchParams : undefined,
    );
    const query = searchValue.trim();
    if (query) nextParams.set("q", query);
    else nextParams.delete("q");
    navigate({ pathname: "/all-files", search: nextParams.toString() });
  }

  async function loadRepoUpdates() {
    setUpdatesLoading(true);
    setUpdatesError("");
    try {
      const response = await fetch(
        "https://api.github.com/repos/zenhosta/9drive/commits?per_page=5",
        {
          headers: { Accept: "application/vnd.github+json" },
        },
      );
      if (!response.ok)
        throw new Error(
          response.status === 403
            ? "GitHub rate limit reached. Try again later."
            : "Failed to load repository updates.",
        );
      const commits = (await response.json()) as GitHubCommit[];
      setUpdates(
        commits.map((item) => ({
          sha: item.sha.slice(0, 7),
          title: item.commit.message.split("\n")[0] || "Repository update",
          author: item.commit.author?.name ?? "GitHub",
          date: item.commit.author?.date
            ? formatDate(item.commit.author.date)
            : "--",
          url: item.html_url,
        })),
      );
      setUpdatesLoaded(true);
    } catch (error) {
      setUpdatesError(
        error instanceof Error
          ? error.message
          : "Failed to load repository updates.",
      );
    } finally {
      setUpdatesLoading(false);
    }
  }

  function toggleRepoUpdates(event?: React.MouseEvent) {
    event?.stopPropagation();
    setUpdatesOpen((open: boolean) => !open);
    if (!updatesLoaded && !updatesLoading)
      loadRepoUpdates().catch(() => undefined);
  }

  function toggleAccountMenu(event: React.MouseEvent) {
    event.stopPropagation();
    setAccountMenuOpen((open: boolean) => !open);
  }

  useEffect(() => {
    loadSidebarStats().catch(() => undefined);

    function onStorageChanged() {
      // Call via ref so we always use the latest closure, not a stale one.
      loadSidebarStatsRef.current?.().catch(() => undefined);
    }

    window.addEventListener("9drive:storage-changed", onStorageChanged);
    return () =>
      window.removeEventListener("9drive:storage-changed", onStorageChanged);
  }, []);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setUpdatesOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Load user profile when user changes
  useEffect(() => {
    if (user?.email) {
      getGravatarUrl(user.email, 64)
        .then(setProfileImageUrl)
        .catch(() => setProfileImageUrl(""));
    } else {
      setProfileImageUrl("");
    }
  }, [user?.email]);

  // Sync user state with stored auth
  useEffect(() => {
    const stored = getStoredUser();
    if (stored && JSON.stringify(stored) !== JSON.stringify(user)) {
      setUser(stored);
    }
  }, [user]);

  // Close account menu on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const desktopMenu = accountMenuRef.current;
      const mobileMenu = mobileAccountMenuRef.current;
      const target = event.target as Node;

      const isOutsideDesktop = !desktopMenu || !desktopMenu.contains(target);
      const isOutsideMobile = !mobileMenu || !mobileMenu.contains(target);

      if (isOutsideDesktop && isOutsideMobile) {
        setAccountMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close repo updates dropdown on outside click
  useEffect(() => {
    function handleRepoUpdatesClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      const dropdown = document.querySelector('[role="menu"]');
      if (dropdown && !dropdown.contains(target)) {
        // Check if click is not on the bell button
        const bellButton = document.querySelector(
          '[aria-label="Repository updates"]',
        );
        if (bellButton && !bellButton.contains(target)) {
          setUpdatesOpen(false);
        }
      }
    }
    if (updatesOpen) {
      document.addEventListener("mousedown", handleRepoUpdatesClickOutside);
    }
    return () =>
      document.removeEventListener("mousedown", handleRepoUpdatesClickOutside);
  }, [updatesOpen]);

  // Close account menu on escape key
  useEffect(() => {
    function handleEscapeKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setAccountMenuOpen(false);
      }
    }
    document.addEventListener("keydown", handleEscapeKey);
    return () => document.removeEventListener("keydown", handleEscapeKey);
  }, []);

  return (
    <main className="min-h-screen w-full overflow-x-hidden bg-[var(--color-bg-primary)]">
      <div className="flex min-h-screen w-full flex-col bg-[var(--color-bg-primary)] lg:h-screen lg:overflow-hidden lg:flex-row">
        <div className="hidden lg:block lg:h-screen lg:shrink-0">
          <Sidebar
            storage={storage}
            breakdown={breakdown}
            isCollapsed={isSidebarCollapsed}
            onToggleCollapse={toggleSidebar}
            onExpand={expandSidebar}
          />
        </div>
        <div
          className={cn(
            "fixed inset-0 z-40 bg-[var(--color-bg-overlay-strong)] transition-opacity lg:hidden",
            sidebarOpen ? "opacity-100" : "pointer-events-none opacity-0",
          )}
          onClick={() => setSidebarOpen(false)}
        />
        <div
          className={cn(
            "fixed inset-y-0 left-0 z-50 transform bg-[var(--color-card-bg)] shadow-2xl transition-transform duration-300 ease-out lg:hidden",
            sidebarOpen ? "translate-x-0" : "-translate-x-full",
          )}
        >
          <div className="absolute right-4 top-4 z-10">
            <Button
              variant="outline"
              size="icon"
              aria-label="Close sidebar"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
          <Sidebar
            storage={storage}
            breakdown={breakdown}
            onNavigate={() => setSidebarOpen(false)}
            isCollapsed={false}
            onToggleCollapse={toggleSidebar}
            onExpand={expandSidebar}
          />
        </div>
        <section className="min-w-0 flex-1 p-4 sm:p-8 lg:h-screen lg:overflow-y-auto lg:p-10">
          <header className="flex w-full min-w-0 flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex items-center justify-between gap-3 lg:hidden">
              <div className="flex min-w-0 items-center gap-3">
                <Button
                  variant="outline"
                  size="icon"
                  aria-label="Open sidebar"
                  onClick={() => setSidebarOpen(true)}
                >
                  <Menu className="h-5 w-5" />
                </Button>
                <div className="flex min-w-0 items-center gap-2">
                  <BrandLogo className="h-9 w-9 shrink-0" />
                  <span className="truncate text-xl font-extrabold tracking-tight text-[var(--color-text-primary)]">
                    9Drive
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <ThemeToggle />
                <div className="relative shrink-0">
                  <Button
                    variant="outline"
                    size="icon"
                    className="relative"
                    aria-label="Repository updates"
                    aria-expanded={updatesOpen}
                    onClick={toggleRepoUpdates}
                  >
                    <Bell className="h-5 w-5" />
                    {!updatesOpen ? (
                      <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-[var(--color-bg-brand)]" />
                    ) : null}
                  </Button>
                  {updatesOpen ? (
                    <RepoUpdatesDropdown
                      updates={updates}
                      loading={updatesLoading}
                      error={updatesError}
                      isMobile={true}
                      onClose={toggleRepoUpdates}
                    />
                  ) : null}
                </div>
                <div className="relative" ref={mobileAccountMenuRef}>
                  <Button
                    variant="outline"
                    size="icon"
                    className="relative"
                    aria-label="Account menu"
                    aria-expanded={accountMenuOpen}
                    onClick={toggleAccountMenu}
                  >
                    {profileImageUrl ? (
                      <img
                        src={profileImageUrl}
                        alt="User avatar"
                        className="h-8 w-8 rounded-full object-cover"
                      />
                    ) : user?.name ? (
                      <div className="h-8 w-8 rounded-full bg-[var(--color-bg-brand)] flex items-center justify-center text-[var(--color-button-primary-text)] font-semibold text-sm">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                    ) : (
                      <User className="h-5 w-5" />
                    )}
                  </Button>
                  {accountMenuOpen && (
                    <div
                      className="absolute right-0 top-12 z-50 w-60 overflow-hidden rounded-2xl border border-[var(--color-card-border)] bg-[var(--color-card-bg)] shadow-2xl shadow-[var(--color-shadow-xl)]"
                      role="menu"
                    >
                      <div className="px-4 py-3 border-b border-[var(--color-card-border)]">
                        <p className="text-sm font-semibold text-[var(--color-text-primary)]">
                          {user?.name ?? "User"}
                        </p>
                        <p className="text-xs text-[var(--color-text-tertiary)] truncate">
                          {user?.email ?? ""}
                        </p>
                      </div>
                      <NavLink
                        to="/settings"
                        onClick={() => setAccountMenuOpen(false)}
                        className={({ isActive }) =>
                          cn(
                            "flex w-full items-center gap-3 px-4 py-3 text-sm font-semibold transition-colors",
                            isActive
                              ? "bg-[var(--color-bg-tertiary)] text-[var(--color-text-primary)]"
                              : "text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)]",
                          )
                        }
                        role="menuitem"
                      >
                        <Settings className="h-5 w-5 shrink-0" />
                        Settings
                      </NavLink>
                      <NavLink
                        to="/api"
                        onClick={() => setAccountMenuOpen(false)}
                        className={({ isActive }) =>
                          cn(
                            "flex w-full items-center gap-3 px-4 py-3 text-sm font-semibold transition-colors",
                            isActive
                              ? "bg-[var(--color-bg-tertiary)] text-[var(--color-text-primary)]"
                              : "text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)]",
                          )
                        }
                        role="menuitem"
                      >
                        <SlidersHorizontal className="h-5 w-5 shrink-0" />
                        API
                      </NavLink>
                      <div className="border-t border-[var(--color-card-border)]" />
                      <button
                        type="button"
                        className="flex w-full items-center gap-3 px-4 py-3 text-sm font-semibold text-[var(--color-text-danger)] hover:bg-[var(--color-bg-hover)] transition-colors"
                        role="menuitem"
                        onClick={logout}
                      >
                        <LogOut className="h-5 w-5 shrink-0" />
                        Log Out
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <form
              onSubmit={searchFiles}
              className="relative w-full min-w-0 flex-1 xl:max-w-xl"
            >
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[var(--color-text-tertiary)]" />
              <Input
                value={searchValue}
                onChange={(event) => setSearchValue(event.target.value)}
                placeholder="Search Documents"
                className="pl-11 pr-12"
              />
              <button
                type="submit"
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--color-text-tertiary)]"
                aria-label="Search files"
              >
                <SlidersHorizontal className="h-5 w-5" />
              </button>
            </form>
            <div className="relative hidden flex-wrap gap-3 lg:flex">
              <ThemeToggle />
              <Button
                variant="outline"
                size="icon"
                className="relative"
                aria-label="Repository updates"
                aria-expanded={updatesOpen}
                onClick={toggleRepoUpdates}
              >
                <Bell className="h-5 w-5" />
                {!updatesOpen ? (
                  <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-[var(--color-bg-brand)]" />
                ) : null}
              </Button>
              {updatesOpen ? (
                <RepoUpdatesDropdown
                  updates={updates}
                  loading={updatesLoading}
                  error={updatesError}
                  isMobile={false}
                />
              ) : null}
              <div className="relative" ref={accountMenuRef}>
                <Button
                  variant="outline"
                  size="icon"
                  className="relative"
                  aria-label="Account menu"
                  aria-expanded={accountMenuOpen}
                  onClick={toggleAccountMenu}
                >
                  {profileImageUrl ? (
                    <img
                      src={profileImageUrl}
                      alt="User avatar"
                      className="h-8 w-8 rounded-full object-cover"
                    />
                  ) : user?.name ? (
                    <div className="h-8 w-8 rounded-full bg-[var(--color-bg-brand)] flex items-center justify-center text-[var(--color-button-primary-text)] font-semibold text-sm">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                  ) : (
                    <User className="h-5 w-5" />
                  )}
                </Button>
                {accountMenuOpen && (
                  <div
                    className="absolute right-0 top-12 z-50 w-60 overflow-hidden rounded-2xl border border-[var(--color-card-border)] bg-[var(--color-card-bg)] shadow-2xl shadow-[var(--color-shadow-xl)]"
                    role="menu"
                  >
                    <div className="px-4 py-3 border-b border-[var(--color-card-border)]">
                      <p className="text-sm font-semibold text-[var(--color-text-primary)]">
                        {user?.name ?? "User"}
                      </p>
                      <p className="text-xs text-[var(--color-text-tertiary)] truncate">
                        {user?.email ?? ""}
                      </p>
                    </div>
                    <NavLink
                      to="/settings"
                      onClick={() => setAccountMenuOpen(false)}
                      className={({ isActive }) =>
                        cn(
                          "flex w-full items-center gap-3 px-4 py-3 text-sm font-semibold transition-colors",
                          isActive
                            ? "bg-[var(--color-bg-tertiary)] text-[var(--color-text-primary)]"
                            : "text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)]",
                        )
                      }
                      role="menuitem"
                    >
                      <Settings className="h-5 w-5 shrink-0" />
                      Settings
                    </NavLink>
                    <NavLink
                      to="/api"
                      onClick={() => setAccountMenuOpen(false)}
                      className={({ isActive }) =>
                        cn(
                          "flex w-full items-center gap-3 px-4 py-3 text-sm font-semibold transition-colors",
                          isActive
                            ? "bg-[var(--color-bg-tertiary)] text-[var(--color-text-primary)]"
                            : "text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)]",
                        )
                      }
                      role="menuitem"
                    >
                      <SlidersHorizontal className="h-5 w-5 shrink-0" />
                      API
                    </NavLink>
                    <div className="border-t border-[var(--color-card-border)]" />
                    <button
                      type="button"
                      className="flex w-full items-center gap-3 px-4 py-3 text-sm font-semibold text-[var(--color-text-danger)] hover:bg-[var(--color-bg-hover)] transition-colors"
                      role="menuitem"
                      onClick={logout}
                    >
                      <LogOut className="h-5 w-5 shrink-0" />
                      Log Out
                    </button>
                  </div>
                )}
              </div>
            </div>
          </header>
          <Outlet />
        </section>
      </div>
    </main>
  );
}
