import { useFinancials, useAlerts } from "@/lib/finance";
import {
  useStore,
  formatMoney,
  formatMonthShort,
  formatMonthLong,
} from "@/lib/store";
import { PageHeader } from "@/components/PageHeader";
import { StatCard } from "@/components/StatCard";
import {
  Wallet,
  TrendingUp,
  Receipt,
  AlertTriangle,
  Trophy,
  Sparkles,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

const Dashboard = () => {
  const { totalContrib, totalExpenses, balance, synthesis, ranking } =
    useFinancials();
  const alerts = useAlerts();
  const currency = useStore((s) => s.currency);
  const members = useStore((s) => s.members);
  const seedDemo = useStore((s) => s.seedDemo);

  const chartData = synthesis.map((s) => ({
    month: formatMonthShort(s.monthKey),
    Solde: s.balance,
    Contributions: s.contrib,
    Dépenses: s.expense,
  }));

  const top5 = ranking.slice(0, 5);

  return (
    <div className="space-y-8 animate-fade-in">
      <PageHeader
        title="Tableau de bord"
        description="Vue d'ensemble des finances de votre association."
        action={
          members.length === 0 ? (
            <Button
              onClick={seedDemo}
              className="gap-2 bg-gradient-primary hover:opacity-90 shadow-glow"
            >
              <Sparkles className="size-4" />
              Démarrer avec des données de démo
            </Button>
          ) : null
        }
      />

      {members.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <StatCard
              variant="primary"
              label="Solde actuel"
              value={formatMoney(balance, currency)}
              hint={
                balance >= 0 ? "Trésorerie positive" : "Trésorerie négative"
              }
              icon={<Wallet className="size-5" />}
            />
            <StatCard
              label="Contributions totales"
              value={formatMoney(totalContrib, currency)}
              hint={`${members.filter((m) => m.active).length} membres actifs`}
              icon={<TrendingUp className="size-5 text-success" />}
            />
            <StatCard
              label="Dépenses totales"
              value={formatMoney(totalExpenses, currency)}
              hint={`${useStore.getState().expenses.length} transactions`}
              icon={<Receipt className="size-5 text-destructive" />}
            />
          </div>

          {/* Alerts */}
          <AlertsBlock />

          <div className="grid gap-6 lg:grid-cols-5">
            <div className="lg:col-span-3 glass-card p-5">
              <div className="flex items-baseline justify-between mb-4">
                <h2 className="font-display font-semibold text-lg">
                  Évolution du solde
                </h2>
                <span className="text-xs text-muted-foreground">
                  Cumulé mensuel
                </span>
              </div>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={chartData}
                    margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                        <stop
                          offset="0%"
                          stopColor="hsl(var(--primary))"
                          stopOpacity={0.5}
                        />
                        <stop
                          offset="100%"
                          stopColor="hsl(var(--primary))"
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="hsl(var(--border))"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="month"
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip
                      contentStyle={{
                        background: "hsl(var(--popover))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "12px",
                        fontSize: "12px",
                      }}
                      formatter={(v: number) => formatMoney(v, currency)}
                    />
                    <Area
                      type="monotone"
                      dataKey="Solde"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2.5}
                      fill="url(#g1)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="lg:col-span-2 glass-card p-5">
              <div className="flex items-baseline justify-between mb-4">
                <h2 className="font-display font-semibold text-lg flex items-center gap-2">
                  <Trophy className="size-4 text-primary" />
                  Top contributeurs
                </h2>
              </div>
              <div className="space-y-3">
                {top5.length === 0 && (
                  <p className="text-sm text-muted-foreground">Aucun membre.</p>
                )}
                {top5.map((m) => (
                  <div key={m.id} className="flex items-center gap-3">
                    <div
                      className={cn(
                        "size-9 rounded-xl flex items-center justify-center font-display font-bold text-sm",
                        m.rank === 1
                          ? "bg-gradient-primary text-primary-foreground shadow-glow"
                          : m.rank === 2
                            ? "bg-secondary text-secondary-foreground"
                            : m.rank === 3
                              ? "bg-warning/20 text-warning"
                              : "bg-muted text-muted-foreground",
                      )}
                    >
                      {m.rank}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{m.name}</p>
                      <div className="h-1.5 bg-muted rounded-full mt-1.5 overflow-hidden">
                        <div
                          className="h-full bg-gradient-primary rounded-full"
                          style={{
                            width: `${top5[0].total ? (m.total / top5[0].total) * 100 : 0}%`,
                          }}
                        />
                      </div>
                    </div>
                    <span className="text-sm font-mono font-semibold tabular shrink-0">
                      {formatMoney(m.total, currency)}
                    </span>
                  </div>
                ))}
              </div>
              <Link
                to="/classement"
                className="text-xs text-primary hover:underline mt-4 inline-block"
              >
                Voir le classement complet →
              </Link>
            </div>
          </div>

          <div className="glass-card p-5">
            <div className="flex items-baseline justify-between mb-4">
              <h2 className="font-display font-semibold text-lg">
                Contributions vs Dépenses
              </h2>
              <span className="text-xs text-muted-foreground">Par mois</span>
            </div>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="hsl(var(--border))"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="month"
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "hsl(var(--popover))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "12px",
                      fontSize: "12px",
                    }}
                    formatter={(v: number) => formatMoney(v, currency)}
                  />
                  <Legend wrapperStyle={{ fontSize: "12px" }} />
                  <Bar
                    dataKey="Contributions"
                    fill="hsl(var(--primary))"
                    radius={[6, 6, 0, 0]}
                  />
                  <Bar
                    dataKey="Dépenses"
                    fill="hsl(var(--destructive))"
                    radius={[6, 6, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

const AlertsBlock = () => {
  const alerts = useAlerts();
  const hasAny =
    alerts.unpaidThisMonth.length > 0 ||
    alerts.expensesOverContrib ||
    alerts.incompleteMonths.length > 0;

  if (!hasAny) {
    return (
      <div className="glass-card p-4 flex items-center gap-3 border-success/30">
        <div className="size-9 rounded-xl bg-success/15 flex items-center justify-center">
          <TrendingUp className="size-4 text-success" />
        </div>
        <div>
          <p className="text-sm font-semibold">Tout est en ordre</p>
          <p className="text-xs text-muted-foreground">
            Aucune alerte détectée pour le mois de référence.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-3 md:grid-cols-3">
      {alerts.expensesOverContrib && (
        <div className="glass-card p-4 border-destructive/40 bg-destructive/5">
          <div className="flex items-start gap-3">
            <AlertTriangle className="size-4 text-destructive mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-destructive">
                Dépenses &gt; contributions
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Le total des sorties dépasse les entrées.
              </p>
            </div>
          </div>
        </div>
      )}
      {alerts.unpaidThisMonth.length > 0 && (
        <div className="glass-card p-4 border-warning/40 bg-warning/5">
          <div className="flex items-start gap-3">
            <AlertTriangle className="size-4 text-warning mt-0.5" />
            <div>
              <p className="text-sm font-semibold">
                {alerts.unpaidThisMonth.length} membre(s) non payé(s)
              </p>
              <p className="text-xs text-muted-foreground mt-1 truncate">
                {formatMonthLong(alerts.referenceMonth)} :{" "}
                {alerts.unpaidThisMonth
                  .map((m) => m.name)
                  .slice(0, 3)
                  .join(", ")}
                {alerts.unpaidThisMonth.length > 3 && "…"}
              </p>
            </div>
          </div>
        </div>
      )}
      {alerts.incompleteMonths.length > 0 && (
        <div className="glass-card p-4 border-info/40 bg-info/5">
          <div className="flex items-start gap-3">
            <AlertTriangle className="size-4 text-info mt-0.5" />
            <div>
              <p className="text-sm font-semibold">
                {alerts.incompleteMonths.length} mois incomplet(s)
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Tous les membres n'ont pas contribué.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const EmptyState = () => {
  const seedDemo = useStore((s) => s.seedDemo);
  return (
    <div className="glass-card p-12 text-center max-w-2xl mx-auto">
      <div className="size-16 mx-auto rounded-2xl bg-gradient-primary flex items-center justify-center shadow-glow mb-4">
        <Wallet className="size-7 text-primary-foreground" />
      </div>
      <h2 className="font-display font-bold text-2xl mb-2">
        Bienvenue sur Ustawi
      </h2>
      <p className="text-muted-foreground mb-6 max-w-md mx-auto">
        Commencez par ajouter des membres ou chargez une démo pour explorer
        toutes les fonctionnalités.
      </p>
      <div className="flex gap-3 justify-center">
        <Button
          onClick={seedDemo}
          className="gap-2 bg-gradient-primary hover:opacity-90 shadow-glow"
        >
          <Sparkles className="size-4" />
          Charger une démo
        </Button>
        <Button asChild variant="outline">
          <Link to="/membres">Ajouter un membre</Link>
        </Button>
      </div>
    </div>
  );
};

export default Dashboard;
