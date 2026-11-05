import { useNavigate } from "react-router-dom";
import { LogOut, Settings, SlidersHorizontal, User } from "lucide-react";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

export function AccountMenu({ collapsed = false, placement = "top", onNavigate }: { collapsed?: boolean; placement?: "top" | "bottom"; onNavigate?: () => void }) {
  const profile = useStore((s) => s.profile);
  const logout = useStore((s) => s.logout);
  const navigate = useNavigate();
  const initials = profile.name.split(" ").filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("") || "?";
  const go = (path: string) => { navigate(path); onNavigate?.(); };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" aria-label="Menu du compte" className={cn("h-auto w-full rounded-lg hover:bg-sidebar-accent hover:text-sidebar-foreground", collapsed ? "p-2 justify-center" : "px-2 py-3 justify-start gap-3")}>
          <Avatar className="size-10 shrink-0">
            {profile.avatarUrl && <AvatarImage src={profile.avatarUrl} alt={profile.name} />}
            <AvatarFallback className="bg-primary/15 text-primary font-semibold">{initials}</AvatarFallback>
          </Avatar>
          {!collapsed && <><span className="min-w-0 flex-1 text-left"><span className="block truncate font-semibold text-sidebar-foreground">{profile.name}</span><span className="block truncate text-xs font-normal text-muted-foreground mt-1">{profile.role}</span></span><SlidersHorizontal className="text-muted-foreground" /></>}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent side={placement} align={placement === "bottom" ? "end" : "start"} sideOffset={12} className="w-72 max-w-[calc(100vw-2rem)] rounded-lg border-border bg-popover p-1 shadow-md-soft">
        <DropdownMenuLabel className="px-3 py-3"><span className="block truncate text-base">{profile.name}</span><span className="block truncate mt-1 font-normal text-muted-foreground">{profile.email}</span></DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-border" />
        <DropdownMenuItem onSelect={() => go("/profil")} className="gap-3 px-3 py-3 cursor-pointer focus:bg-muted focus:text-foreground"><User className="size-4" />Profil</DropdownMenuItem>
        <DropdownMenuItem onSelect={() => go("/parametres")} className="gap-3 px-3 py-3 cursor-pointer focus:bg-muted focus:text-foreground"><Settings className="size-4" />Paramètres</DropdownMenuItem>
        <DropdownMenuSeparator className="bg-border" />
        <DropdownMenuItem onSelect={() => { logout(); go("/login"); }} className="gap-3 px-3 py-3 cursor-pointer text-destructive focus:bg-destructive/10 focus:text-destructive"><LogOut className="size-4" />Déconnexion</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}