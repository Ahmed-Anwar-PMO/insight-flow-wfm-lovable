import { Link, useLocation } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard, Users, CalendarDays, GitBranch, AlertTriangle,
  ArchiveRestore, Activity, GitCompare, Download, Settings, ListChecks, BarChart3, Briefcase
} from "lucide-react";

const nav = [
  { to: "/", label: "Overview", icon: LayoutDashboard },
  { to: "/wizard", label: "Setup Wizard", icon: ListChecks },
  { to: "/forecast", label: "Forecast", icon: BarChart3 },
  { to: "/staffing", label: "Staffing Model", icon: Users },
  { to: "/capacity", label: "Capacity Plan", icon: Briefcase },
  { to: "/roster", label: "Roster", icon: CalendarDays },
  { to: "/rotations", label: "Rotations", icon: GitBranch },
  { to: "/gaps", label: "Coverage Gaps", icon: AlertTriangle },
  { to: "/backlog", label: "Backlog Recovery", icon: ArchiveRestore },
  { to: "/rta", label: "Real-Time Adherence", icon: Activity },
  { to: "/scenarios", label: "Scenarios", icon: GitCompare },
  { to: "/exports", label: "Exports", icon: Download },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;

export function AppShell({ children }: { children: React.ReactNode }) {
  const loc = useLocation();
  return (
    <div className="flex min-h-screen w-full bg-background text-foreground">
      <aside className="hidden md:flex w-64 flex-col bg-sidebar-bg text-sidebar-fg sticky top-0 h-screen">
        <div className="px-5 py-5 border-b border-white/10">
          <div className="text-xs uppercase tracking-widest text-sidebar-muted">Operations</div>
          <div className="text-lg font-semibold mt-0.5">Support WFM Planner</div>
        </div>
        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
          {nav.map((n) => {
            const active = loc.pathname === n.to || (n.to !== "/" && loc.pathname.startsWith(n.to));
            const Icon = n.icon;
            return (
              <Link
                key={n.to}
                to={n.to}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                  active ? "bg-sidebar-active text-primary-foreground" : "text-sidebar-fg/80 hover:bg-white/5"
                )}
              >
                <Icon className="h-4 w-4" />
                <span>{n.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-white/10 text-xs text-sidebar-muted">
          Local-only · v1
        </div>
      </aside>
      <main className="flex-1 min-w-0 flex flex-col">
        <header className="md:hidden bg-sidebar-bg text-sidebar-fg px-4 py-3 flex items-center justify-between">
          <div className="font-semibold">Support WFM</div>
          <Link to="/wizard" className="text-xs underline">Wizard</Link>
        </header>
        <div className="flex-1 p-4 md:p-8 max-w-[1400px] w-full mx-auto">{children}</div>
      </main>
    </div>
  );
}

export function PageHeader({ title, description, actions }: { title: string; description?: string; actions?: React.ReactNode }) {
  return (
    <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3 mb-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {description && <p className="text-sm text-muted-foreground mt-1 max-w-2xl">{description}</p>}
      </div>
      {actions && <div className="flex gap-2">{actions}</div>}
    </div>
  );
}
