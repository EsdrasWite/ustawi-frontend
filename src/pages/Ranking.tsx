import { useFinancials } from "@/lib/finance";
import { useStore, formatMoney } from "@/lib/store";
import { PageHeader } from "@/components/PageHeader";
import { Trophy, Medal } from "lucide-react";
import { cn } from "@/lib/utils";

const Ranking = () => {
  const { ranking } = useFinancials();
  const currency = useStore((s) => s.currency);
  const max = ranking[0]?.total || 0;

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Classement"
        description="Classement des membres par contribution totale (égalités gérées)."
      />

      {ranking.length === 0 ? (
        <div className="glass-card p-12 text-center text-muted-foreground">
          Aucun membre à classer.
        </div>
      ) : (
        <div className="space-y-3">
          {ranking.map((m) => (
            <div
              key={m.id}
              className={cn(
                "glass-card p-4 flex items-center gap-4",
                m.rank === 1 && "border-primary/40 shadow-glow"
              )}
            >
              <div
                className={cn(
                  "size-12 rounded-2xl flex items-center justify-center font-display font-bold text-lg shrink-0",
                  m.rank === 1 ? "bg-gradient-primary text-primary-foreground" :
                  m.rank === 2 ? "bg-secondary text-secondary-foreground" :
                  m.rank === 3 ? "bg-warning/20 text-warning" :
                  "bg-muted text-muted-foreground"
                )}
              >
                {m.rank <= 3 ? (
                  <Medal className={cn("size-5", m.rank === 1 && "text-primary-foreground")} />
                ) : (
                  m.rank
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline justify-between gap-3">
                  <p className="font-display font-semibold truncate">
                    <span className="text-muted-foreground text-sm mr-2">#{m.rank}</span>
                    {m.name}
                  </p>
                  <p className="font-mono font-bold tabular shrink-0">{formatMoney(m.total, currency)}</p>
                </div>
                <div className="h-2 bg-muted rounded-full mt-2 overflow-hidden">
                  <div
                    className="h-full bg-gradient-primary rounded-full transition-all duration-500"
                    style={{ width: `${max ? (m.total / max) * 100 : 0}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Ranking;
