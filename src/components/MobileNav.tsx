import { NavLink, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { navigationItems } from "./navigation-items";

const shortLabels = ["Bord", "Membres", "Contrib", "Dépenses", "Synthèse", "Top"];
const items = navigationItems.map((item, index) => ({ ...item, label: shortLabels[index] }));

export const MobileNav = () => {
  const location = useLocation();
  return (
    <nav className="lg:hidden fixed bottom-0 inset-x-0 z-50 bg-card/90 backdrop-blur-xl border-t border-border">
      <div className="grid grid-cols-6">
        {items.map((it) => {
          const active = location.pathname === it.to;
          const Icon = it.icon;
          return (
            <NavLink
              key={it.to}
              to={it.to}
              className={cn(
                "flex flex-col items-center gap-1 py-2.5 text-[10px] font-medium transition-colors",
                active ? "text-primary" : "text-muted-foreground"
              )}
            >
              <Icon className="size-4" />
              {it.label}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};
