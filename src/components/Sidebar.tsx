import { NavLink, useLocation } from "react-router-dom";
import { Wallet, Sparkles, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { AccountMenu } from "./AccountMenu";
import { navigationItems as items } from "./navigation-items";

export const Sidebar = () => {
  const seedDemo = useStore((s) => s.seedDemo);
  const members = useStore((s) => s.members);
  const collapsed = useStore((s) => s.sidebarCollapsed);
  const toggleSidebar = useStore((s) => s.toggleSidebar);
  const location = useLocation();

  return (
    <aside
      className={cn(
        "hidden lg:flex shrink-0 flex-col border-r border-sidebar-border bg-sidebar h-screen sticky top-0 transition-[width] duration-300",
        collapsed ? "w-20" : "w-64",
      )}
    >
      <div
        className={cn(
          "px-4 py-6 flex items-center gap-3",
          collapsed && "justify-center px-2",
        )}
      >
        <div className="size-10 rounded-xl bg-gradient-primary flex items-center justify-center shadow-glow shrink-0">
          <Wallet className="size-5 text-primary-foreground" />
        </div>
        {!collapsed && (
          <div>
            <h1 className="font-display font-bold text-lg leading-none">
              Ustawi
            </h1>
            <p className="text-xs text-muted-foreground mt-1">
              Suivi financier
            </p>
          </div>
        )}
      </div>

      <nav className="flex-1 px-3 py-2 space-y-1">
        {items.map((it) => {
          const active = location.pathname === it.to;
          const Icon = it.icon;
          const link = (
            <NavLink
              key={it.to}
              to={it.to}
              className={cn(
                "flex items-center gap-3 rounded-xl text-sm font-medium transition-colors",
                collapsed ? "justify-center p-2.5" : "px-3 py-2.5",
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm-soft"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
              )}
            >
              <Icon
                className={cn("size-[18px] shrink-0", active && "text-primary")}
              />
              {!collapsed && it.label}
            </NavLink>
          );
          return collapsed ? (
            <Tooltip key={it.to} delayDuration={0}>
              <TooltipTrigger asChild>{link}</TooltipTrigger>
              <TooltipContent side="right">{it.label}</TooltipContent>
            </Tooltip>
          ) : (
            link
          );
        })}
      </nav>

      <div
        className={cn(
          "p-3 space-y-2 border-t border-sidebar-border",
          collapsed && "px-2",
        )}
      >
        {members.length === 0 && !collapsed && (
          <Button
            onClick={seedDemo}
            variant="outline"
            size="sm"
            className="w-full gap-2 border-primary/40 text-primary hover:bg-primary/10"
          >
            <Sparkles className="size-4" />
            Charger une démo
          </Button>
        )}

        <Button
          onClick={toggleSidebar}
          variant="ghost"
          size="sm"
          className={cn(
            "w-full gap-2 text-sidebar-foreground/70",
            collapsed ? "justify-center px-0" : "justify-start",
          )}
          aria-label={collapsed ? "Déployer le menu" : "Réduire le menu"}
        >
          {collapsed ? (
            <PanelLeftOpen className="size-4" />
          ) : (
            <PanelLeftClose className="size-4" />
          )}
          {!collapsed && "Réduire le menu"}
        </Button>

        <AccountMenu collapsed={collapsed} />
      </div>
    </aside>
  );
};
