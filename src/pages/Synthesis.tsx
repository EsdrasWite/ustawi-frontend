import { useFinancials } from "@/lib/finance";
import { useStore, formatMoney, formatMonthLong } from "@/lib/store";
import { PageHeader } from "@/components/PageHeader";
import { cn } from "@/lib/utils";

const Synthesis = () => {
  const { synthesis } = useFinancials();
  const currency = useStore((s) => s.currency);

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Synthèse financière"
        description="Vue mensuelle cumulée des contributions, dépenses et solde."
      />

      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-muted/50">
              <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground">
                <th className="px-5 py-3 font-semibold">Mois</th>
                <th className="px-5 py-3 font-semibold text-right">Contributions</th>
                <th className="px-5 py-3 font-semibold text-right">Cumul contributions</th>
                <th className="px-5 py-3 font-semibold text-right">Dépenses</th>
                <th className="px-5 py-3 font-semibold text-right">Cumul dépenses</th>
                <th className="px-5 py-3 font-semibold text-right">Solde cumulé</th>
              </tr>
            </thead>
            <tbody>
              {synthesis.map((row) => (
                <tr key={row.monthKey} className="border-t border-border/60 hover:bg-muted/20">
                  <td className="px-5 py-3 font-medium">{formatMonthLong(row.monthKey)}</td>
                  <td className={cn("px-5 py-3 text-right font-mono tabular",
                    row.contrib > 0 ? "text-success" : "text-muted-foreground/60")}>
                    {row.contrib > 0 ? formatMoney(row.contrib, currency) : "—"}
                  </td>
                  <td className="px-5 py-3 text-right font-mono tabular">
                    {formatMoney(row.cumContrib, currency)}
                  </td>
                  <td className={cn("px-5 py-3 text-right font-mono tabular",
                    row.expense > 0 ? "text-destructive" : "text-muted-foreground/60")}>
                    {row.expense > 0 ? `-${formatMoney(row.expense, currency)}` : "—"}
                  </td>
                  <td className="px-5 py-3 text-right font-mono tabular text-destructive/80">
                    {row.cumExpense > 0 ? `-${formatMoney(row.cumExpense, currency)}` : "—"}
                  </td>
                  <td className={cn("px-5 py-3 text-right font-mono font-bold tabular",
                    row.balance >= 0 ? "text-primary" : "text-destructive")}>
                    {formatMoney(row.balance, currency)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Synthesis;
