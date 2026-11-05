import { LayoutDashboard, Users, Table2, Receipt, TrendingUp, Trophy } from "lucide-react";

export const navigationItems = [
  { to: "/", label: "Tableau de bord", icon: LayoutDashboard },
  { to: "/membres", label: "Membres", icon: Users },
  { to: "/contributions", label: "Contributions", icon: Table2 },
  { to: "/depenses", label: "Dépenses", icon: Receipt },
  { to: "/synthese", label: "Synthèse financière", icon: TrendingUp },
  { to: "/classement", label: "Classement", icon: Trophy },
];