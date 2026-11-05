import { useMemo, useState } from "react";
import { useStore, formatMoney, formatMonthShort, formatMonthLong, nextMonthKey, generateMonthRange } from "@/lib/store";
import { useAppSettings, expectedAmountFor } from "@/lib/app-settings";
import { cellStatus, filterMatches, statusCounts, contribFilters, ContribFilter, CellStatus } from "@/lib/contributions";
import { exportContributions, ContributionExportFormat } from "@/lib/contribution-exports";
import { NewContributionDialog, ContributionRecapDialog, NewContribution, RowChange } from "@/components/contributions/ContributionDialogs";
import { MemberConfirmation } from "@/components/members/MemberDialogs";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { CalendarPlus, Check, ChevronDown, Download, FileSpreadsheet, FileText, HandCoins, Loader2, Search, X } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const statusTextClass: Record<CellStatus, string> = {
  empty: "text-destructive placeholder:text-destructive/60",
  partial: "text-warning font-semibold",
  paid: "text-success font-semibold",
  over: "text-info font-bold",
};

type RowEdit = { memberId: string; draft: Record<string, number>; original: Record<string, number> };

const Contributions = () => {
  const members = useStore((s) => s.members);
  const contributions = useStore((s) => s.contributions);
  const setContribution = useStore((s) => s.setContribution);
  const addNextMonth = useStore((s) => s.addNextMonth);
  const monthRangeEnd = useStore((s) => s.monthRangeEnd);
  const verifyPassword = useStore((s) => s.verifyPassword);
  const { currency, fyStart, fyEnd, monthlyAmount, history } = useAppSettings();

  // Exercice financier en cours (paramètres) — seuls ces mois sont affichés.
  const months = useMemo(() => generateMonthRange(fyStart, fyEnd), [fyStart, fyEnd]);
  const expectedFor = (mk: string) => expectedAmountFor(mk, { monthlyAmount, history });
  const yearLabel = `${formatMonthLong(fyStart)} → ${formatMonthLong(fyEnd)}`;

  const [filter, setFilter] = useState<ContribFilter>("all");
  const [search, setSearch] = useState("");
  const [editRow, setEditRow] = useState<RowEdit | null>(null);
  const [recapOpen, setRecapOpen] = useState(false);
  const [passwordStep, setPasswordStep] = useState<null | { kind: "row" } | { kind: "new"; payload: NewContribution }>(null);
  const [newOpen, setNewOpen] = useState(false);
  const [exporting, setExporting] = useState<ContributionExportFormat | null>(null);

  const searchedMembers = useMemo(() => {
    const q = search.trim().toLowerCase();
    return members.filter((m) => !q || m.name.toLowerCase().includes(q));
  }, [members, search]);

  const counts = useMemo(
    () => statusCounts(searchedMembers, contributions, months, expectedFor),
    [searchedMembers, contributions, months, monthlyAmount, history]
  );

  const isVisible = (memberId: string, mk: string) =>
    filterMatches(cellStatus(contributions[memberId]?.[mk] || 0, expectedFor(mk)), filter);

  const visibleMembers = useMemo(
    () => searchedMembers.filter((m) => filter === "all" || months.some((mk) => isVisible(m.id, mk))),
    [searchedMembers, months, filter, contributions, monthlyAmount, history]
  );

  const visibleTotalByMember = (id: string) =>
    months.reduce((sum, mk) => (isVisible(id, mk) ? sum + (contributions[id]?.[mk] || 0) : sum), 0);
  const visibleTotalByMonth = (mk: string) =>
    visibleMembers.reduce((sum, m) => (isVisible(m.id, mk) ? sum + (contributions[m.id]?.[mk] || 0) : sum), 0);
  const grandTotal = visibleMembers.reduce((sum, m) => sum + visibleTotalByMember(m.id), 0);

  // ---- Édition par ligne ----
  const startEdit = (memberId: string, mk: string) => {
    if (editRow) return;
    const original: Record<string, number> = {};
    months.forEach((m) => (original[m] = contributions[memberId]?.[m] || 0));
    setEditRow({ memberId, draft: { ...original }, original });
  };
  const rowChanges: RowChange[] = editRow
    ? months
        .filter((mk) => (editRow.draft[mk] || 0) !== (editRow.original[mk] || 0))
        .map((mk) => ({ monthKey: mk, before: editRow.original[mk] || 0, after: editRow.draft[mk] || 0 }))
    : [];
  const rowDelta = rowChanges.reduce((sum, c) => sum + (c.after - c.before), 0);

  const applyRowChanges = () => {
    if (!editRow) return;
    rowChanges.forEach((c) => setContribution(editRow.memberId, c.monthKey, c.after));
    toast.success("Modifications enregistrées", { description: `${rowChanges.length} mois mis à jour pour ${members.find((m) => m.id === editRow.memberId)?.name}.` });
    setEditRow(null); setRecapOpen(false); setPasswordStep(null);
  };

  const applyNewContribution = (payload: NewContribution) => {
    payload.months.forEach((mk) => setContribution(payload.memberId, mk, payload.amountPerMonth));
    toast.success("Paiement enregistré", {
      description: `${formatMoney(payload.amountPerMonth * payload.months.length, currency)} pour ${members.find((m) => m.id === payload.memberId)?.name} (${payload.months.map(formatMonthShort).join(", ")}).`,
    });
    setNewOpen(false); setPasswordStep(null);
  };

  const handleExport = async (format: ContributionExportFormat) => {
    setExporting(format);
    try {
      await exportContributions({
        members: visibleMembers, contributions, months, currency,
        periodLabel: `Exercice : ${yearLabel}`,
        filterLabel: `Filtre : ${contribFilters.find((f) => f.key === filter)?.label}${search ? ` | Recherche : ${search}` : ""}`,
        isVisible,
      }, format);
      toast.success(`Export ${format === "xlsx" ? "Excel" : "PDF"} généré`);
    } catch {
      toast.error("Échec de l'export", { description: "Réessayez dans un instant." });
    } finally {
      setExporting(null);
    }
  };

  const handleAddNextMonth = () => {
    const nm = nextMonthKey(monthRangeEnd);
    addNextMonth();
    toast.success(`Mois ajouté : ${formatMonthLong(nm)}`, { description: "Toutes les valeurs sont initialisées à zéro." });
  };

  const editingMember = editRow ? members.find((m) => m.id === editRow.memberId) : null;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <PageHeader
          title="Contributions mensuelles"
          description={`Exercice en cours : ${yearLabel}. Tarif mensuel : ${formatMoney(monthlyAmount, currency)}. Rouge = non payé, orange = partiel, vert = payé.`}
        />
        <div className="flex flex-wrap gap-2 shrink-0">
          <Button onClick={() => setNewOpen(true)} size="sm" className="gap-2">
            <HandCoins className="size-4" />Nouvelle contribution
          </Button>
          <Button onClick={handleAddNextMonth} size="sm" variant="outline" className="gap-2">
            <CalendarPlus className="size-4" />Ajouter le mois suivant
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="outline" className="gap-2" disabled={Boolean(exporting)}>
                {exporting ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />}
                Exporter<ChevronDown className="size-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleExport("xlsx")}><FileSpreadsheet className="size-4" />Exporter en Excel (.xlsx)</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport("pdf")}><FileText className="size-4" />Exporter en PDF (.pdf)</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Filtres + recherche */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-2" role="tablist" aria-label="Filtres des contributions">
          {contribFilters.map((f) => (
            <button
              key={f.key}
              role="tab"
              aria-selected={filter === f.key}
              onClick={() => setFilter(f.key)}
              className={cn(
                "flex items-center gap-2 px-3.5 py-2 rounded-full text-xs font-medium border transition-all",
                filter === f.key
                  ? "bg-primary text-primary-foreground border-primary shadow-sm"
                  : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground"
              )}
            >
              {f.label}
              <span className={cn(
                "px-1.5 py-0.5 rounded-full text-[10px] font-semibold tabular",
                filter === f.key ? "bg-primary-foreground/20" : "bg-muted"
              )}>
                {counts[f.key]}
              </span>
            </button>
          ))}
        </div>
        <div className="relative w-full lg:w-64">
          <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher un membre…" className="pl-9" maxLength={60} />
        </div>
      </div>

      {members.length === 0 ? (
        <div className="glass-card p-12 text-center text-muted-foreground">
          Ajoutez des membres pour commencer à enregistrer les contributions.
        </div>
      ) : visibleMembers.length === 0 ? (
        <div className="glass-card p-12 text-center text-muted-foreground">
          Aucune contribution ne correspond à ce filtre{search ? " et à cette recherche" : ""}.
        </div>
      ) : (
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-muted/50 sticky top-0 z-10">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-xs uppercase tracking-wider text-muted-foreground sticky left-0 bg-muted/80 backdrop-blur z-20 min-w-[180px]">
                    Membre
                  </th>
                  {months.map((mk) => (
                    <th key={mk} className="px-2 py-3 text-center font-semibold text-xs uppercase tracking-wider text-muted-foreground min-w-[80px]">
                      {formatMonthShort(mk)}
                    </th>
                  ))}
                  <th className="px-3 py-3 text-right font-semibold text-xs uppercase tracking-wider text-primary sticky right-0 min-w-[110px] z-20 bg-muted shadow-[-4px_0_8px_-4px_hsl(var(--background)/0.4)]">
                    <div className="absolute inset-0 bg-primary/10 pointer-events-none" />
                    <span className="relative">Total</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {visibleMembers.map((m) => {
                  const editing = editRow?.memberId === m.id;
                  const dimmed = editRow && !editing;
                  return (
                    <tr
                      key={m.id}
                      className={cn(
                        "border-t border-border/60 transition-all",
                        editing && "bg-primary/5 ring-1 ring-inset ring-primary/30",
                        dimmed && "opacity-40 blur-[1px] pointer-events-none select-none",
                        !editRow && "hover:bg-muted/20"
                      )}
                    >
                      <td className="px-4 py-2 sticky left-0 bg-card z-10 font-medium border-r border-border/60">
                        <div className="flex items-center gap-2">
                          <span className={cn("size-1.5 rounded-full", m.active ? "bg-success" : "bg-muted-foreground/40")} />
                          <span className="truncate">{m.name}</span>
                          {editing && <span className="text-[10px] uppercase tracking-wide text-primary font-semibold">Édition</span>}
                        </div>
                      </td>
                      {months.map((mk) => {
                        const value = editing ? editRow.draft[mk] || 0 : contributions[m.id]?.[mk] || 0;
                        const visible = isVisible(m.id, mk);
                        return (
                          <ContribCell
                            key={mk}
                            value={value}
                            expected={expectedFor(mk)}
                            editable={editing}
                            dimmed={!visible}
                            onActivate={() => startEdit(m.id, mk)}
                            onChange={(v) => editing && setEditRow({ ...editRow, draft: { ...editRow.draft, [mk]: v } })}
                          />
                        );
                      })}
                      <td className="relative px-3 py-2 text-right font-mono font-semibold tabular sticky right-0 border-l border-border/60 bg-card z-10 shadow-[-4px_0_8px_-4px_hsl(var(--background)/0.4)]">
                        <div className="absolute inset-0 bg-primary/10 pointer-events-none" />
                        <span className="relative">{formatMoney(visibleTotalByMember(m.id), currency)}</span>
                      </td>
                    </tr>
                  );
                })}
                <tr className={cn("border-t-2 border-border bg-muted/40 font-semibold transition-all", editRow && "opacity-40 blur-[1px]")}>
                  <td className="px-4 py-3 sticky left-0 bg-muted z-10 border-r border-border/60">Total / mois</td>
                  {months.map((mk) => (
                    <td key={mk} className={cn("px-2 py-3 text-center font-mono tabular text-xs", visibleTotalByMonth(mk) === 0 && "text-muted-foreground/60")}>
                      {visibleTotalByMonth(mk) ? formatMoney(visibleTotalByMonth(mk), currency) : "—"}
                    </td>
                  ))}
                  <td className="relative px-3 py-3 text-right font-mono tabular sticky right-0 border-l border-border/60 text-primary bg-muted z-10 shadow-[-4px_0_8px_-4px_hsl(var(--background)/0.4)]">
                    <div className="absolute inset-0 bg-primary/20 pointer-events-none" />
                    <span className="relative">{formatMoney(grandTotal, currency)}</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Barre d'actions de l'édition par ligne */}
      {editRow && editingMember && (
        <div className="fixed bottom-0 inset-x-0 z-40 border-t border-border bg-background/95 backdrop-blur-xl">
          <div className="max-w-5xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-3">
            <div className="text-sm min-w-0">
              <p className="font-medium truncate">Édition : {editingMember.name}</p>
              <p className="text-xs text-muted-foreground">
                {rowChanges.length === 0
                  ? "Aucune modification pour le moment."
                  : `${rowChanges.length} mois modifié${rowChanges.length > 1 ? "s" : ""} · variation ${rowDelta >= 0 ? "+" : ""}${formatMoney(rowDelta, currency)}`}
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setEditRow(null)}>
                <X className="size-4" />Annuler
              </Button>
              <Button size="sm" disabled={rowChanges.length === 0} onClick={() => setRecapOpen(true)}>
                <Check className="size-4" />Confirmer
              </Button>
            </div>
          </div>
        </div>
      )}

      {newOpen && (
        <NewContributionDialog
          members={members}
          months={months}
          expectedFor={expectedFor}
          currency={currency}
          yearLabel={yearLabel}
          onClose={() => setNewOpen(false)}
          onSubmit={(payload) => setPasswordStep({ kind: "new", payload })}
        />
      )}

      {recapOpen && editRow && editingMember && (
        <ContributionRecapDialog
          memberName={editingMember.name}
          changes={rowChanges}
          expectedFor={expectedFor}
          currency={currency}
          busy={false}
          onClose={() => setRecapOpen(false)}
          onConfirm={() => { setRecapOpen(false); setPasswordStep({ kind: "row" }); }}
        />
      )}

      {passwordStep && (
        <MemberConfirmation
          title="Confirmer l'enregistrement"
          name={passwordStep.kind === "new"
            ? `Paiement de ${formatMoney(passwordStep.payload.amountPerMonth * passwordStep.payload.months.length, currency)} · ${members.find((m) => m.id === passwordStep.payload.memberId)?.name}`
            : `${rowChanges.length} modification${rowChanges.length > 1 ? "s" : ""} · ${editingMember?.name ?? ""}`}
          verify={verifyPassword}
          onClose={() => setPasswordStep(null)}
          onConfirm={() => passwordStep.kind === "new" ? applyNewContribution(passwordStep.payload) : applyRowChanges()}
        />
      )}
    </div>
  );
};

const ContribCell = ({
  value, expected, editable, dimmed, onActivate, onChange,
}: {
  value: number;
  expected: number;
  editable: boolean;
  dimmed: boolean;
  onActivate: () => void;
  onChange: (v: number) => void;
}) => {
  const [local, setLocal] = useState(value ? String(value) : "");
  const [focused, setFocused] = useState(false);
  const status = cellStatus(value, expected);

  return (
    <td className={cn("px-1 py-1 text-center transition-opacity", dimmed && "opacity-30")}>
      <input
        type="number"
        inputMode="decimal"
        min={0}
        step={0.01}
        readOnly={!editable}
        value={focused && editable ? local : (value ? String(value) : "")}
        onFocus={(e) => {
          if (!editable) { onActivate(); return; }
          setFocused(true); setLocal(value ? String(value) : ""); e.target.select();
        }}
        onClick={() => { if (!editable) onActivate(); }}
        onChange={(e) => editable && setLocal(e.target.value)}
        onBlur={() => {
          if (!editable) return;
          setFocused(false);
          const n = parseFloat(local);
          onChange(Number.isFinite(n) && n > 0 ? n : 0);
        }}
        onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }}
        title={status === "over" ? `Dépassement : attendu ${formatMoney(expected)}` : undefined}
        className={cn(
          "w-full text-center bg-transparent rounded-md py-1.5 px-1 text-xs font-mono tabular outline-none transition-colors",
          editable ? "focus:bg-primary/10 focus:ring-2 focus:ring-primary/40" : "cursor-pointer",
          status === "over" && "ring-1 ring-info/50 bg-info/10",
          statusTextClass[status]
        )}
        placeholder="0"
      />
    </td>
  );
};

export default Contributions;
