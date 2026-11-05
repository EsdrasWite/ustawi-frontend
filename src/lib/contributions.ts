import { Member } from "./members";
import { Contributions } from "./store";

export type CellStatus = "empty" | "partial" | "paid" | "over";
export type ContribFilter = "all" | "partial" | "paid" | "empty";

export const contribFilters: { key: ContribFilter; label: string }[] = [
  { key: "all", label: "Tous les mois" },
  { key: "partial", label: "Mois avancés" },
  { key: "paid", label: "Mois payés" },
  { key: "empty", label: "Mois non payés" },
];

/** Statut d'une cellule membre/mois comparée au tarif attendu. */
export function cellStatus(amount: number, expected: number): CellStatus {
  if (!amount || amount <= 0) return "empty";
  if (amount < expected) return "partial";
  if (amount === expected) return "paid";
  return "over";
}

/** Un filtre garde-t-il une cellule de ce statut ? ("over" compte comme payé.) */
export function filterMatches(status: CellStatus, filter: ContribFilter): boolean {
  if (filter === "all") return true;
  if (filter === "partial") return status === "partial";
  if (filter === "paid") return status === "paid" || status === "over";
  return status === "empty";
}

/** Nombre de cellules membre/mois par statut, sur les mois de l'exercice. */
export function statusCounts(
  members: Member[],
  contributions: Contributions,
  months: string[],
  expectedFor: (monthKey: string) => number
): Record<ContribFilter, number> {
  const counts: Record<ContribFilter, number> = { all: 0, partial: 0, paid: 0, empty: 0 };
  members.forEach((m) => {
    months.forEach((mk) => {
      const status = cellStatus(contributions[m.id]?.[mk] || 0, expectedFor(mk));
      counts.all += 1;
      if (status === "partial") counts.partial += 1;
      else if (status === "paid" || status === "over") counts.paid += 1;
      else counts.empty += 1;
    });
  });
  return counts;
}
