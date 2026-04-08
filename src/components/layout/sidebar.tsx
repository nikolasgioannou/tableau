import { LayoutDashboard, Settings } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/router";
import { cn } from "~/lib/cn";
import { Separator } from "~/components/ui/separator";

export function Sidebar() {
  const router = useRouter();

  const isActive = (path: string) => router.pathname.startsWith(path);

  return (
    <aside className="border-sidebar-border bg-sidebar-bg flex h-screen w-60 flex-shrink-0 flex-col border-r">
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
          <LayoutDashboard size={16} />
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
          <Settings size={16} />
          Settings
        </Link>
      </div>
    </aside>
  );
}
