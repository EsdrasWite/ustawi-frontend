import { FormEvent, useMemo, useState } from "react";
import { AlertTriangle, Check, HandCoins, Loader2, Search, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Member } from "@/lib/members";
import { formatMoney, formatMonthLong, formatMonthShort } from "@/lib/store";
import { cn } from "@/lib/utils";

export type NewContribution = { memberId: string; months: string[]; amountPerMonth: number };

export function NewContributionDialog({
  members, months, expectedFor, currency, yearLabel, onClose, onSubmit,
}: {
  members: Member[];
  months: string[];
  expectedFor: (monthKey: string) => number;
  currency: string;
  yearLabel: string;
  onClose: () => void;
  onSubmit: (payload: NewContribution) => void;
}) {
  const [search, setSearch] = useState("");
  const [memberId, setMemberId] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [paid, setPaid] = useState("");

  const matches = useMemo(() => {
    const q = search.trim().toLowerCase();
    return members.filter((m) => !q || m.name.toLowerCase().includes(q));
  }, [members, search]);

  const expectedTotal = selected.reduce((sum, mk) => sum + expectedFor(mk), 0);
  const paidValue = parseFloat(paid);
  const paidValid = Number.isFinite(paidValue) && paidValue > 0;
  const diff = paidValid ? paidValue - expectedTotal : null;
  const canSubmit = Boolean(memberId) && selected.length > 0 && paidValid && diff === 0;

  const toggleMonth = (mk: string) =>
    setSelected((s) => (s.includes(mk) ? s.filter((x) => x !== mk) : [...s, mk].sort()));

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!canSubmit) return;
    onSubmit({ memberId, months: selected, amountPerMonth: expectedTotal / selected.length });
  }

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-lg max-h-[90dvh] overflow-y-auto w-[calc(100%-2rem)] rounded-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><HandCoins className="size-5 text-primary" />Nouvelle contribution</DialogTitle>
          <DialogDescription>Exercice financier en cours : {yearLabel} (défini dans les paramètres)</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="contrib-search">Membre<span className="text-destructive"> *</span></Label>
            <div className="relative">
              <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input id="contrib-search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher un membre…" className="pl-9" maxLength={60} />
            </div>
            <div className="border border-border rounded-lg max-h-36 overflow-y-auto divide-y divide-border/60">
              {matches.length === 0 && <p className="text-sm text-muted-foreground px-3 py-4 text-center">Aucun membre ne correspond.</p>}
              {matches.map((m) => (
                <button
                  type="button"
                  key={m.id}
                  onClick={() => setMemberId(m.id)}
                  className={cn(
                    "w-full flex items-center justify-between px-3 py-2 text-sm text-left transition-colors",
                    memberId === m.id ? "bg-primary/10 text-primary font-medium" : "hover:bg-muted/50"
                  )}
                >
                  <span className="truncate">{m.name}</span>
                  {memberId === m.id && <Check className="size-4 shrink-0" />}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Mois concernés<span className="text-destructive"> *</span> <span className="text-xs text-muted-foreground font-normal">(plusieurs mois possibles)</span></Label>
            <div className="flex flex-wrap gap-2">
              {months.map((mk) => {
                const active = selected.includes(mk);
                return (
                  <button
                    type="button"
                    key={mk}
                    onClick={() => toggleMonth(mk)}
                    aria-pressed={active}
                    className={cn(
                      "px-3 py-1.5 rounded-full text-xs font-medium border transition-all",
                      active
                        ? "bg-primary text-primary-foreground border-primary shadow-sm"
                        : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground"
                    )}
                  >
                    {active && <Check className="size-3 inline mr-1 -mt-0.5" />}
                    {formatMonthShort(mk)}
                  </button>
                );
              })}
            </div>
          </div>

          {selected.length > 0 && (
            <div className="rounded-lg border border-border bg-muted/30 divide-y divide-border/60 text-sm">
              {selected.map((mk) => (
                <div key={mk} className="flex justify-between px-3 py-2">
                  <span className="text-muted-foreground">{formatMonthLong(mk)}</span>
                  <span className="font-mono tabular">{formatMoney(expectedFor(mk), currency)}</span>
                </div>
              ))}
              <div className="flex justify-between px-3 py-2 font-semibold">
                <span>Total attendu</span>
                <span className="font-mono tabular text-primary">{formatMoney(expectedTotal, currency)}</span>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="contrib-paid">Montant versé<span className="text-destructive"> *</span></Label>
            <Input
              id="contrib-paid" type="number" inputMode="decimal" min={0} step="0.01"
              value={paid} onChange={(e) => setPaid(e.target.value)}
              placeholder={expectedTotal ? String(expectedTotal) : "0"} className="font-mono"
            />
            {diff !== null && diff !== 0 && (
              <p className="text-xs text-destructive flex items-center gap-1.5" role="alert">
                <AlertTriangle className="size-3.5" />
                {diff > 0
                  ? `Dépassement de ${formatMoney(diff, currency)} par rapport au total attendu.`
                  : `Il manque ${formatMoney(-diff, currency)} pour atteindre le total attendu.`}
              </p>
            )}
            {diff === 0 && selected.length > 0 && (
              <p className="text-xs text-success flex items-center gap-1.5"><Check className="size-3.5" />Le montant correspond au total attendu.</p>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={onClose}>Annuler</Button>
            <Button type="submit" disabled={!canSubmit}><Save className="size-4" />Enregistrer</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export type RowChange = { monthKey: string; before: number; after: number };

export function ContributionRecapDialog({
  memberName, changes, expectedFor, currency, busy, onClose, onConfirm,
}: {
  memberName: string;
  changes: RowChange[];
  expectedFor: (monthKey: string) => number;
  currency: string;
  busy: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const overChanges = changes.filter((c) => c.after > expectedFor(c.monthKey));
  const delta = changes.reduce((sum, c) => sum + (c.after - c.before), 0);
  return (
    <Dialog open onOpenChange={(open) => { if (!open && !busy) onClose(); }}>
      <DialogContent className="max-w-md max-h-[90dvh] overflow-y-auto w-[calc(100%-2rem)] rounded-lg">
        <DialogHeader>
          <DialogTitle>Récapitulatif des modifications</DialogTitle>
          <DialogDescription>{memberName} · {changes.length} mois modifié{changes.length > 1 ? "s" : ""}</DialogDescription>
        </DialogHeader>
        <div className="rounded-lg border border-border divide-y divide-border/60 text-sm">
          {changes.map((c) => {
            const over = c.after > expectedFor(c.monthKey);
            return (
              <div key={c.monthKey} className="flex items-center justify-between px-3 py-2">
                <span className="text-muted-foreground">{formatMonthLong(c.monthKey)}</span>
                <span className={cn("font-mono tabular", over && "text-info font-semibold")}>
                  {formatMoney(c.before, currency)} → {formatMoney(c.after, currency)}
                </span>
              </div>
            );
          })}
          <div className="flex justify-between px-3 py-2 font-semibold">
            <span>Variation totale</span>
            <span className={cn("font-mono tabular", delta >= 0 ? "text-success" : "text-destructive")}>
              {delta >= 0 ? "+" : ""}{formatMoney(delta, currency)}
            </span>
          </div>
        </div>
        {overChanges.length > 0 && (
          <div className="rounded-lg border border-info/40 bg-info/10 px-3 py-2.5 text-xs flex gap-2">
            <AlertTriangle className="size-4 text-info shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-info">Dépassement du tarif mensuel</p>
              {overChanges.map((c) => (
                <p key={c.monthKey} className="text-muted-foreground mt-1">
                  {formatMonthLong(c.monthKey)} : attendu {formatMoney(expectedFor(c.monthKey), currency)}, dépassement de {formatMoney(c.after - expectedFor(c.monthKey), currency)}.
                </p>
              ))}
            </div>
          </div>
        )}
        <DialogFooter className="gap-2">
          <Button type="button" variant="outline" disabled={busy} onClick={onClose}>Retour</Button>
          <Button disabled={busy} onClick={onConfirm}>{busy && <Loader2 className="size-4 animate-spin" />}Valider et confirmer</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
