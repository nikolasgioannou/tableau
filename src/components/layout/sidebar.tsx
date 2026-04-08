import Link from "next/link";
import { useRouter } from "next/router";
import { cn } from "~/lib/cn";
import { useTheme } from "~/hooks/use-theme";
import { Separator } from "~/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";

function LayoutIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" width="16" height="16">
      <rect x="3" y="3" width="14" height="14" rx="2" />
      <path d="M3 7h14M7 7v10" />
    </svg>
  );
}

function SettingsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" width="16" height="16">
      <path d="M10 13a3 3 0 100-6 3 3 0 000 6z" />
      <path d="M17.4 11a1.6 1.6 0 00.32 1.76l.06.06a1.94 1.94 0 01-1.37 3.31 1.94 1.94 0 01-1.37-.57l-.06-.06a1.6 1.6 0 00-1.76-.32 1.6 1.6 0 00-.97 1.46V17a1.94 1.94 0 11-3.88 0v-.1a1.6 1.6 0 00-1.05-1.46 1.6 1.6 0 00-1.76.32l-.06.06A1.94 1.94 0 012.6 14.4a1.94 1.94 0 01.57-1.37l.06-.06a1.6 1.6 0 00.32-1.76A1.6 1.6 0 002.1 10.24H2a1.94 1.94 0 110-3.88h.1a1.6 1.6 0 001.46-1.05 1.6 1.6 0 00-.32-1.76l-.06-.06A1.94 1.94 0 015.6 2.6c.51 0 1 .2 1.37.57l.06.06a1.6 1.6 0 001.76.32h.08A1.6 1.6 0 009.84 2.1V2a1.94 1.94 0 113.88 0v.1a1.6 1.6 0 00.97 1.46 1.6 1.6 0 001.76-.32l.06-.06a1.94 1.94 0 013.31 1.37c0 .51-.2 1-.57 1.37l-.06.06a1.6 1.6 0 00-.32 1.76v.08a1.6 1.6 0 001.46.97H18a1.94 1.94 0 110 3.88h-.1a1.6 1.6 0 00-1.46.97z" />
    </svg>
  );
}

export function Sidebar() {
  const router = useRouter();
  const { mode, setTheme } = useTheme();

  const isActive = (path: string) => router.pathname.startsWith(path);

  return (
    <aside className="flex h-screen w-60 flex-shrink-0 flex-col border-r border-sidebar-border bg-sidebar-bg">
      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-3">
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
      </nav>

      {/* Bottom settings */}
      <Separator />
      <div className="px-3 py-3">
        <Link
          href="/settings"
          className={cn(
            "flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors",
            isActive("/settings")
              ? "bg-sidebar-item-active text-text-primary font-medium"
              : "text-text-secondary hover:bg-sidebar-item-hover",
          )}
        >
          <SettingsIcon />
          Settings
        </Link>
      </div>
    </aside>
  );
}
