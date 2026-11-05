import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ExpenseRecipient } from "./expenses";
import { Member, MemberDraft, memberDetails } from "./members";
import {
  DemoCredential,
  defaultDemoCredential,
  hashDemoPassword,
  migrateDemoState,
  verifyDemoPassword,
} from "./demo-password";
export type { Member } from "./members";

export type Expense = {
  id: string;
  date: string; // ISO yyyy-mm-dd
  description: string;
  amount: number;
  category?: string;
  cancelled?: boolean;
  recipient?: ExpenseRecipient;
};

// Contributions: { [memberId]: { [monthKey]: amount } }
// monthKey format: "YYYY-MM"
export type Contributions = Record<string, Record<string, number>>;

export type UserProfile = {
  name: string;
  email: string;
  role: string;
  avatarUrl?: string;
};

type State = {
  members: Member[];
  expenses: Expense[];
  contributions: Contributions;
  currency: string;
  theme: "light" | "dark";
  monthRangeEnd: string; // "YYYY-MM" — extensible end of months
  sidebarCollapsed: boolean;
  profile: UserProfile;
  isAuthenticated: boolean;
  demoCredential: DemoCredential;
  verifyPassword: (password: string) => boolean;

  login: (
    identifier: string,
    password: string,
  ) => { ok: boolean; error?: string };
  logout: () => void;

  // members
  addMember: (name: string | MemberDraft) => void;
  updateMember: (id: string, patch: Partial<Member>) => void;
  removeMember: (id: string) => void;

  // expenses
  addExpense: (e: Omit<Expense, "id">) => void;
  updateExpense: (id: string, patch: Partial<Expense>) => void;
  removeExpense: (id: string) => void;

  // contributions
  setContribution: (memberId: string, monthKey: string, amount: number) => void;

  setCurrency: (c: string) => void;
  setTheme: (t: "light" | "dark") => void;
  addNextMonth: () => void;
  toggleSidebar: () => void;
  setSidebarCollapsed: (v: boolean) => void;
  updateProfile: (patch: Partial<UserProfile>) => void;
  changePassword: (
    current: string,
    next: string,
  ) => { ok: boolean; error?: string };

  resetAll: () => void;
  seedDemo: () => void;
};

const uid = () => Math.random().toString(36).slice(2, 10);

export const useStore = create<State>()(
  persist(
    (set): State => ({
      members: [],
      expenses: [],
      contributions: {},
      currency: "€",
      theme: "light",
      monthRangeEnd: "2026-12",
      sidebarCollapsed: false,
      profile: {
        name: "Admin Ustawi",
        email: "admin@Ustawi.app",
        role: "Trésorier",
        avatarUrl: "",
      },
      isAuthenticated: false,
      demoCredential: defaultDemoCredential,
      verifyPassword: (password) =>
        verifyDemoPassword(password, useStore.getState().demoCredential),

      login: (identifier, password) => {
        const s = useStore.getState();
        const id = identifier.trim().toLowerCase();
        const matchEmail = id === s.profile.email.toLowerCase();
        const matchAdmin =
          id === "admin" && s.profile.email === "admin@Ustawi.app";
        if (!(matchEmail || matchAdmin))
          return { ok: false, error: "Identifiants incorrects" };
        if (!s.verifyPassword(password))
          return { ok: false, error: "Identifiants incorrects" };
        set({ isAuthenticated: true });
        return { ok: true };
      },
      logout: () => set({ isAuthenticated: false }),

      addMember: (name) =>
        set((s) => ({
          members: [
            ...s.members,
            {
              id: uid(),
              ...(typeof name === "string"
                ? { name: name.trim() }
                : memberDetails(name)),
              active: true,
              status: "Actif",
              createdAt: new Date().toISOString(),
            },
          ],
        })),
      updateMember: (id, patch) =>
        set((s) => ({
          members: s.members.map((m) => (m.id === id ? { ...m, ...patch } : m)),
        })),
      removeMember: (id) =>
        set((s) => {
          const { [id]: _, ...rest } = s.contributions;
          return {
            members: s.members.filter((m) => m.id !== id),
            contributions: rest,
          };
        }),

      addExpense: (e) =>
        set((s) => ({ expenses: [...s.expenses, { ...e, id: uid() }] })),
      updateExpense: (id, patch) =>
        set((s) => ({
          expenses: s.expenses.map((x) =>
            x.id === id ? { ...x, ...patch } : x,
          ),
        })),
      removeExpense: (id) =>
        set((s) => ({ expenses: s.expenses.filter((x) => x.id !== id) })),

      setContribution: (memberId, monthKey, amount) =>
        set((s) => {
          const memberCtx = { ...(s.contributions[memberId] || {}) };
          if (!amount || amount <= 0) {
            delete memberCtx[monthKey];
          } else {
            memberCtx[monthKey] = amount;
          }
          return {
            contributions: { ...s.contributions, [memberId]: memberCtx },
          };
        }),

      setCurrency: (c) => set({ currency: c }),
      setTheme: (t) => set({ theme: t }),
      addNextMonth: () =>
        set((s) => ({ monthRangeEnd: nextMonthKey(s.monthRangeEnd) })),
      toggleSidebar: () =>
        set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      setSidebarCollapsed: (v) => set({ sidebarCollapsed: v }),
      updateProfile: (patch) =>
        set((s) => ({ profile: { ...s.profile, ...patch } })),
      changePassword: (current, next) => {
        const s = useStore.getState();
        if (!s.verifyPassword(current))
          return { ok: false, error: "Mot de passe actuel incorrect" };
        if (!next || next.length < 6)
          return {
            ok: false,
            error:
              "Le nouveau mot de passe doit contenir au moins 6 caractères",
          };
        set({ demoCredential: hashDemoPassword(next) });
        return { ok: true };
      },

      resetAll: () =>
        set({
          members: [],
          expenses: [],
          contributions: {},
          monthRangeEnd: "2026-12",
        }),

      seedDemo: () => {
        const names = [
          "Aïcha Diop",
          "Karim Benali",
          "Léa Martin",
          "Tomas Silva",
          "Yuki Tanaka",
          "Noor Hassan",
        ];
        const members: Member[] = names.map((n) => ({
          id: uid(),
          name: n,
          active: true,
          createdAt: new Date().toISOString(),
        }));
        const months = generateMonthRange("2025-10", "2026-12");
        const contributions: Contributions = {};
        members.forEach((m, i) => {
          contributions[m.id] = {};
          months.slice(0, 5 + i).forEach((mk, idx) => {
            if ((idx + i) % 4 === 0) return;
            contributions[m.id][mk] = 50 + Math.floor(Math.random() * 4) * 25;
          });
        });
        const expenses: Expense[] = [
          {
            id: uid(),
            date: "2025-10-12",
            description: "Location salle réunion",
            amount: 120,
          },
          {
            id: uid(),
            date: "2025-11-05",
            description: "Fournitures",
            amount: 45,
          },
          {
            id: uid(),
            date: "2025-12-20",
            description: "Évènement de fin d'année",
            amount: 380,
          },
          {
            id: uid(),
            date: "2026-02-10",
            description: "Frais bancaires",
            amount: 18,
          },
          {
            id: uid(),
            date: "2026-04-22",
            description: "Don solidaire",
            amount: 200,
          },
        ];
        set({ members, contributions, expenses });
      },
    }),
    {
      name: "Ustawi-finance-v1",
      version: 1,
      migrate: (state) => migrateDemoState(state) as Partial<State>,
    },
  ),
);

// ---------- Helpers ----------
export const MONTH_RANGE_START = "2025-10";
export const MONTH_RANGE_END_DEFAULT = "2026-12";
/** @deprecated use store.monthRangeEnd */
export const MONTH_RANGE_END = MONTH_RANGE_END_DEFAULT;

export function nextMonthKey(monthKey: string): string {
  const [y, m] = monthKey.split("-").map(Number);
  const nm = m === 12 ? 1 : m + 1;
  const ny = m === 12 ? y + 1 : y;
  return `${ny}-${String(nm).padStart(2, "0")}`;
}

export function generateMonthRange(start: string, end: string): string[] {
  const [sy, sm] = start.split("-").map(Number);
  const [ey, em] = end.split("-").map(Number);
  const out: string[] = [];
  let y = sy,
    m = sm;
  while (y < ey || (y === ey && m <= em)) {
    out.push(`${y}-${String(m).padStart(2, "0")}`);
    m++;
    if (m > 12) {
      m = 1;
      y++;
    }
  }
  return out;
}

const MONTH_LABELS_FR = [
  "Jan",
  "Fév",
  "Mar",
  "Avr",
  "Mai",
  "Juin",
  "Juil",
  "Août",
  "Sep",
  "Oct",
  "Nov",
  "Déc",
];
export function formatMonthShort(monthKey: string): string {
  const [y, m] = monthKey.split("-").map(Number);
  return `${MONTH_LABELS_FR[m - 1]} ${String(y).slice(2)}`;
}
export function formatMonthLong(monthKey: string): string {
  const [y, m] = monthKey.split("-").map(Number);
  const long = [
    "Janvier",
    "Février",
    "Mars",
    "Avril",
    "Mai",
    "Juin",
    "Juillet",
    "Août",
    "Septembre",
    "Octobre",
    "Novembre",
    "Décembre",
  ];
  return `${long[m - 1]} ${y}`;
}

export function dateToMonthKey(date: string): string {
  return date.slice(0, 7);
}

export function formatMoney(n: number, currency = "€"): string {
  const v = Math.round(n * 100) / 100;
  return `${v.toLocaleString("fr-FR", { minimumFractionDigits: v % 1 === 0 ? 0 : 2, maximumFractionDigits: 2 })} ${currency}`;
}
