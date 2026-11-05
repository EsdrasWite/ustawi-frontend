import { useStore, generateMonthRange, MONTH_RANGE_START, dateToMonthKey } from "./store";

export function useMonths() {
  const end = useStore((s) => s.monthRangeEnd) || "2026-12";
  return generateMonthRange(MONTH_RANGE_START, end);
}

export function useFinancials() {
  const members = useStore((s) => s.members);
  const contributions = useStore((s) => s.contributions);
  const allExpenses = useStore((s) => s.expenses);
  const expenses = allExpenses.filter((e) => !e.cancelled);
  const months = useMonths();

  // Total per member
  const totalByMember: Record<string, number> = {};
  members.forEach((m) => {
    const ctx = contributions[m.id] || {};
    totalByMember[m.id] = Object.values(ctx).reduce((a, b) => a + (b || 0), 0);
  });

  // Total per month (contributions)
  const contribByMonth: Record<string, number> = {};
  months.forEach((mk) => {
    let sum = 0;
    members.forEach((m) => {
      sum += contributions[m.id]?.[mk] || 0;
    });
    contribByMonth[mk] = sum;
  });

  // Expenses per month
  const expenseByMonth: Record<string, number> = {};
  months.forEach((mk) => (expenseByMonth[mk] = 0));
  expenses.forEach((e) => {
    const mk = dateToMonthKey(e.date);
    if (expenseByMonth[mk] !== undefined) expenseByMonth[mk] += e.amount;
    else expenseByMonth[mk] = (expenseByMonth[mk] || 0) + e.amount;
  });

  const totalContrib = Object.values(totalByMember).reduce((a, b) => a + b, 0);
  const totalExpenses = expenses.reduce((a, b) => a + b.amount, 0);
  const balance = totalContrib - totalExpenses;

  // Cumulative synthesis
  let cumContrib = 0;
  let cumExp = 0;
  const synthesis = months.map((mk) => {
    const c = contribByMonth[mk] || 0;
    const e = expenseByMonth[mk] || 0;
    cumContrib += c;
    cumExp += e;
    return {
      monthKey: mk,
      contrib: c,
      cumContrib,
      expense: e,
      cumExpense: cumExp,
      balance: cumContrib - cumExp,
    };
  });

  // Ranking with tie handling (dense rank)
  const sorted = [...members]
    .map((m) => ({ ...m, total: totalByMember[m.id] || 0 }))
    .sort((a, b) => b.total - a.total);
  let lastTotal = Infinity;
  let rank = 0;
  const ranking = sorted.map((m, idx) => {
    if (m.total < lastTotal) {
      rank = idx + 1;
      lastTotal = m.total;
    }
    return { ...m, rank };
  });

  return {
    months,
    totalByMember,
    contribByMonth,
    expenseByMonth,
    totalContrib,
    totalExpenses,
    balance,
    synthesis,
    ranking,
  };
}

export function useCurrentMonthKey(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export function useAlerts() {
  const members = useStore((s) => s.members);
  const contributions = useStore((s) => s.contributions);
  const months = useMonths();
  const fin = useFinancials();
  const currentMonth = useCurrentMonthKey();

  // Use the closest month in the range if current isn't included
  const referenceMonth = months.includes(currentMonth)
    ? currentMonth
    : months[months.length - 1];

  const unpaidThisMonth = members.filter(
    (m) => m.active && !(contributions[m.id]?.[referenceMonth] > 0)
  );

  const expensesOverContrib = fin.totalExpenses > fin.totalContrib;

  const incompleteMonths = months.filter((mk) => {
    const activeMembers = members.filter((m) => m.active);
    if (activeMembers.length === 0) return false;
    const paidCount = activeMembers.filter((m) => (contributions[m.id]?.[mk] || 0) > 0).length;
    // Only consider past or current months
    if (mk > referenceMonth) return false;
    return paidCount < activeMembers.length && paidCount > 0;
  });

  return { unpaidThisMonth, expensesOverContrib, incompleteMonths, referenceMonth };
}
