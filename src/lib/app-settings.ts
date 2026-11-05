import { create } from "zustand";

// Shared application settings (exercice financier, tarif mensuel, devise).
// Frontend-only, session-scoped: the Settings prototype writes here on save,
// the Contributions page reads from here. No backend, no persistence.
export type AmountChange = { amount: number; from: string }; // from: monthKey "YYYY-MM"

type AppSettings = {
  currency: string;
  monthlyAmount: number;
  fyStart: string; // "YYYY-MM"
  fyEnd: string; // "YYYY-MM"
  history: AmountChange[]; // sorted by `from` descending
  expenseCategories: ExpenseCategory[];
  applySettings: (patch: Partial<Omit<AppSettings, "applySettings">>) => void;
};

export type ExpenseCategory = { name: string; limit: number };

export const useAppSettings = create<AppSettings>((set) => ({
  currency: "CDF",
  monthlyAmount: 25000,
  fyStart: "2026-01",
  fyEnd: "2026-12",
  history: [
    { amount: 25000, from: "2026-01" },
    { amount: 20000, from: "2025-01" },
  ],
  expenseCategories: [
    { name: "Solidarité", limit: 150000 },
    { name: "Fonctionnement", limit: 75000 },
    { name: "Événements", limit: 200000 },
  ],
  applySettings: (patch) =>
    set((s) => ({
      ...s,
      ...patch,
      history: patch.history
        ? [...patch.history].sort((a, b) => b.from.localeCompare(a.from))
        : s.history,
    })),
}));

/** Tarif mensuel attendu pour un mois donné, en tenant compte de l'historique des tarifs. */
export function expectedAmountFor(
  monthKey: string,
  s: { monthlyAmount: number; history: AmountChange[] }
): number {
  const entry = s.history.find((h) => h.from <= monthKey);
  return entry ? entry.amount : s.monthlyAmount;
}
