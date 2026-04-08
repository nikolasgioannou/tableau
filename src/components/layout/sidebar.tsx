import Link from "next/link";
import { useRouter } from "next/router";
import { cn } from "~/lib/cn";
import { api } from "~/utils/api";
import { useTheme } from "~/hooks/use-theme";

function SunIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
      <path
        fillRule="evenodd"
        d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zM4.222 4.222a1 1 0 011.414 0l.707.707a1 1 0 01-1.414 1.414l-.707-.707a1 1 0 010-1.414zM15.778 4.222a1 1 0 010 1.414l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 0zM10 7a3 3 0 100 6 3 3 0 000-6zm-7 3a1 1 0 011-1h1a1 1 0 110 2H4a1 1 0 01-1-1zm13 0a1 1 0 011-1h1a1 1 0 110 2h-1a1 1 0 01-1-1zM5.636 14.364a1 1 0 011.414 0l.707.707a1 1 0 01-1.414 1.414l-.707-.707a1 1 0 010-1.414zm9.435-.707a1 1 0 00-1.414 1.414l.707.707a1 1 0 001.414-1.414l-.707-.707zM10 15a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function MoonIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
      <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
    </svg>
  );
}

function LayoutIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" width="16" height="16">
      <rect x="3" y="3" width="14" height="14" rx="2" />
      <path d="M3 7h14M7 7v10" />
    </svg>
  );
}

export function Sidebar() {
  const router = useRouter();
  const { isDark, toggle } = useTheme();
  const { data: presentations, isLoading } = api.presentation.list.useQuery();

  const isActive = (path: string) => router.pathname.startsWith(path);

  return (
    <aside className="flex h-screen w-60 flex-shrink-0 flex-col border-r border-sidebar-border bg-sidebar-bg">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-4 py-5">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="text-text-primary">
          <rect x="1" y="1" width="8" height="8" rx="1.5" fill="currentColor" opacity="0.9" />
          <rect x="11" y="1" width="8" height="8" rx="1.5" fill="currentColor" opacity="0.5" />
          <rect x="1" y="11" width="8" height="8" rx="1.5" fill="currentColor" opacity="0.5" />
          <rect x="11" y="11" width="8" height="8" rx="1.5" fill="currentColor" opacity="0.25" />
        </svg>
        <span className="text-sm font-semibold tracking-tight text-text-primary">
          Tableau
        </span>
      </div>

      {/* Theme toggle */}
      <div className="px-3 pb-2">
        <button
          onClick={toggle}
          className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-text-secondary hover:bg-sidebar-item-hover"
        >
          {isDark ? <SunIcon /> : <MoonIcon />}
          <span>{isDark ? "Light mode" : "Dark mode"}</span>
        </button>
      </div>

      <div className="h-px bg-sidebar-border" />

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-2">
        <Link
          href="/presentations"
          className={cn(
            "flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors",
            isActive("/presentations")
              ? "bg-sidebar-item-active text-text-primary font-medium"
              : "text-text-secondary hover:bg-sidebar-item-hover",
          )}
        >
          <LayoutIcon />
          Presentations
        </Link>

        {/* Presentation list in sidebar */}
        {isLoading ? (
          <div className="mt-2 space-y-1 pl-6">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-6 animate-pulse rounded bg-sidebar-item-hover"
              />
            ))}
          </div>
        ) : (
          presentations &&
          presentations.length > 0 && (
            <div className="mt-1 space-y-0.5 pl-6">
              {presentations.map((p) => (
                <Link
                  key={p.id}
                  href={`/presentations/${p.id}`}
                  className={cn(
                    "block truncate rounded-md px-2 py-1 text-xs transition-colors",
                    router.query.id === p.id
                      ? "bg-sidebar-item-active text-text-primary font-medium"
                      : "text-text-tertiary hover:bg-sidebar-item-hover hover:text-text-secondary",
                  )}
                >
                  {p.name}
                </Link>
              ))}
            </div>
          )
        )}
      </nav>
    </aside>
  );
}
