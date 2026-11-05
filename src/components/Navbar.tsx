import { Link, useLocation } from "react-router-dom";
import {
  Bell,
  ChevronRight,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  Sun,
} from "lucide-react";
import { useStore } from "@/lib/store";
import { useAlerts } from "@/lib/finance";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AccountMenu } from "./AccountMenu";
import { navigationItems } from "./navigation-items";

export function Navbar() {
  const { pathname, hash } = useLocation();
  const theme = useStore((s) => s.theme);
  const setTheme = useStore((s) => s.setTheme);
  const collapsed = useStore((s) => s.sidebarCollapsed);
  const toggleSidebar = useStore((s) => s.toggleSidebar);
  const alerts = useAlerts();
  const title =
    pathname === "/parametres"
      ? "Paramètres"
      : pathname === "/profil"
        ? hash
          ? "Paramètres"
          : "Mon profil"
        : navigationItems.find((item) => item.to === pathname)?.label ||
          "Ustawi";
  const date = new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());
  const notifications = [
    ...(alerts.unpaidThisMonth.length
      ? [
          {
            label: `${alerts.unpaidThisMonth.length} membre(s) sans contribution ce mois`,
            to: "/contributions",
          },
        ]
      : []),
    ...(alerts.expensesOverContrib
      ? [{ label: "Les dépenses dépassent les contributions", to: "/synthese" }]
      : []),
    ...(alerts.incompleteMonths.length
      ? [
          {
            label: `${alerts.incompleteMonths.length} mois incomplet(s)`,
            to: "/contributions",
          },
        ]
      : []),
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur-xl">
      <div className="mx-auto flex max-w-[1400px] min-h-20 items-center justify-between gap-3 px-4 sm:px-6 lg:px-10 py-3">
        <div className="flex min-w-0 items-center gap-4">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="hidden lg:inline-flex shrink-0 text-muted-foreground hover:bg-muted hover:text-foreground"
                onClick={toggleSidebar}
                aria-label={collapsed ? "Déployer le menu" : "Réduire le menu"}
              >
                {collapsed ? <PanelLeftOpen /> : <PanelLeftClose />}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {collapsed ? "Déployer le menu" : "Réduire le menu"}
            </TooltipContent>
          </Tooltip>
          <nav
            aria-label="Fil d’Ariane"
            className="flex min-w-0 items-center gap-2 text-sm sm:gap-3"
          >
            <Link
              to="/"
              className="shrink-0 font-display font-semibold text-foreground"
            >
              Ustawi
            </Link>
            <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
            <span className="truncate text-muted-foreground">{title}</span>
          </nav>
        </div>
        <div className="flex shrink-0 items-center gap-1 sm:gap-4">
          <span className="hidden xl:block text-sm text-muted-foreground">
            Situation au {date}
          </span>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:bg-muted hover:text-foreground"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                aria-label={
                  theme === "dark"
                    ? "Activer le thème clair"
                    : "Activer le thème sombre"
                }
              >
                {theme === "dark" ? <Sun /> : <Moon />}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {theme === "dark" ? "Thème clair" : "Thème sombre"}
            </TooltipContent>
          </Tooltip>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="relative text-muted-foreground hover:bg-muted hover:text-foreground"
                aria-label="Notifications"
              >
                <Bell />
                {notifications.length > 0 && (
                  <span className="absolute right-2 top-2 size-1.5 rounded-full bg-destructive" />
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-80 max-w-[calc(100vw-2rem)] bg-popover border-border rounded-lg"
            >
              <DropdownMenuLabel>Notifications</DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-border" />
              {notifications.length ? (
                notifications.map((item) => (
                  <DropdownMenuItem
                    key={item.label}
                    asChild
                    className="focus:bg-muted focus:text-foreground"
                  >
                    <Link to={item.to} className="whitespace-normal py-3">
                      {item.label}
                    </Link>
                  </DropdownMenuItem>
                ))
              ) : (
                <p className="p-3 text-sm text-muted-foreground">
                  Aucune alerte pour le moment.
                </p>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
          <div className="lg:hidden">
            <AccountMenu collapsed placement="bottom" />
          </div>
        </div>
      </div>
      <p className="xl:hidden px-4 sm:px-6 pb-3 text-xs text-muted-foreground">
        Situation au {date}
      </p>
    </header>
  );
}
