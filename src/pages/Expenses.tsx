import { useMemo, useState } from "react";
import { useStore, formatMoney, formatMonthLong } from "@/lib/store";
import { useAppSettings } from "@/lib/app-settings";
import { PageHeader } from "@/components/PageHeader";
import { MemberConfirmation } from "@/components/members/MemberDialogs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertTriangle, MoreHorizontal, Plus, Receipt, XCircle } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { expenseRecipientSchema, matchesRecipient, recipientCounts, type ExpenseRecipient, type RecipientFilter } from "@/lib/expenses";
import type { Expense } from "@/lib/store";

const todayISO = () => new Date().toISOString().slice(0, 10);
const ALL = "__all__";

const Expenses = () => {
  const expenses = useStore((s) => s.expenses);
  const members = useStore((s) => s.members);
  const addExpense = useStore((s) => s.addExpense);
  const updateExpense = useStore((s) => s.updateExpense);
  const verifyPassword = useStore((s) => s.verifyPassword);
  const currency = useAppSettings((s) => s.currency);
  const categories = useAppSettings((s) => s.expenseCategories);

  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState("");
  const [date, setDate] = useState(todayISO());
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [pending, setPending] = useState<Omit<Expense, "id"> | null>(null);
  const [toCancel, setToCancel] = useState<Expense | null>(null);
  const [monthFilter, setMonthFilter] = useState(ALL);
  const [typeFilter, setTypeFilter] = useState(ALL);
  const [recipientKind, setRecipientKind] = useState<ExpenseRecipient["kind"]>("internal");
  const [memberId, setMemberId] = useState("");
  const [externalName, setExternalName] = useState("");
  const [recipientFilter, setRecipientFilter] = useState<RecipientFilter>("all");

  const limit = categories.find((c) => c.name === category)?.limit ?? 0;
  const value = parseFloat(amount);
  const overLimit = Boolean(category) && limit > 0 && value > limit;

  const months = useMemo(() => [...new Set(expenses.map((e) => e.date.slice(0, 7)))].sort().reverse(), [expenses]);
  const scopedExpenses = [...expenses]
    .filter((e) => monthFilter === ALL || e.date.startsWith(monthFilter))
    .filter((e) => typeFilter === ALL || e.category === typeFilter)
    .sort((a, b) => b.date.localeCompare(a.date));
  const counts = recipientCounts(scopedExpenses);
  const filtered = scopedExpenses.filter(e => matchesRecipient(e, recipientFilter));
  const total = filtered.filter((e) => !e.cancelled).reduce((s, e) => s + e.amount, 0);

  const reset = () => { setCategory(""); setDescription(""); setAmount(""); setDate(todayISO()); setRecipientKind("internal"); setMemberId(""); setExternalName(""); };

  const submit = () => {
    const schema = z.object({
      category: z.string().min(1, "Choisissez un type de dépense"),
      date: z.string().min(1, "Date requise"),
      description: z.string().trim().min(1, "Description requise").max(200),
      amount: z.number({ invalid_type_error: "Montant requis" }).positive("Montant > 0"),
    });
    const parsed = schema.safeParse({ category, date, description, amount: value });
    if (!parsed.success) return toast.error(parsed.error.errors[0].message);
    if (overLimit) return toast.error(`Le montant dépasse le plafond de ${formatMoney(limit, currency)} pour « ${category} ».`);
    const member = members.find(m => m.id === memberId);
    const recipient = expenseRecipientSchema.safeParse(recipientKind === "internal"
      ? { kind: "internal", memberId: member?.id ?? "", name: member?.name ?? "" }
      : { kind: "external", name: externalName });
    if (!recipient.success) return toast.error(recipient.error.issues[0].message);
    setPending({ category: parsed.data.category, date: parsed.data.date, description: parsed.data.description, amount: parsed.data.amount, recipient: recipient.data });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Dépenses"
        description={`Total affiché : ${formatMoney(total, currency)}`}
        action={
          <Button onClick={() => { reset(); setOpen(true); }} className="gap-2 bg-gradient-primary hover:opacity-90">
            <Plus className="size-4" /> Nouvelle dépense
          </Button>
        }
      />

      <div className="flex flex-wrap gap-2" role="group" aria-label="Filtres des destinataires">
        {([{ key: "all", label: "Toutes catégories" }, { key: "internal", label: "Interne" }, { key: "external", label: "Externes" }] as const).map(f => (
          <Button key={f.key} variant={recipientFilter === f.key ? "default" : "outline"} aria-pressed={recipientFilter === f.key} onClick={() => setRecipientFilter(f.key)} className="gap-2">
            {f.label}<span className="rounded px-1.5 py-0.5 bg-background/20 tabular-nums">{counts[f.key]}</span>
          </Button>
        ))}
      </div>

      <div className="glass-card p-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-[220px_220px_1fr] items-end">
        <div className="space-y-1.5">
          <Label>Mois</Label>
          <Select value={monthFilter} onValueChange={setMonthFilter}>
            <SelectTrigger aria-label="Filtrer par mois"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Tous les mois</SelectItem>
              {months.map((m) => <SelectItem key={m} value={m} className="capitalize">{formatMonthLong(m)}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Type de dépense</Label>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger aria-label="Filtrer par type"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Tous les types</SelectItem>
              {categories.map((c) => <SelectItem key={c.name} value={c.name}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <p className="text-sm text-muted-foreground lg:text-right">{filtered.length} dépense(s)</p>
      </div>

      <div className="glass-card overflow-x-auto">
        {filtered.length === 0 ? (
          <div className="p-12 text-center">
            <Receipt className="size-10 mx-auto text-muted-foreground/50 mb-3" />
            <p className="text-muted-foreground">Aucune dépense trouvée.</p>
          </div>
        ) : (
          <table className="w-full min-w-[640px]">
            <thead className="bg-muted/50">
              <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground">
                <th className="px-5 py-3 font-semibold">Date</th>
                <th className="px-5 py-3 font-semibold">Type</th>
                <th className="px-5 py-3 font-semibold">Destinataire</th>
                <th className="px-5 py-3 font-semibold">Description</th>
                <th className="px-5 py-3 font-semibold text-right">Montant</th>
                <th className="px-5 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((e) => (
                <tr key={e.id} className={`border-t border-border/60 hover:bg-muted/30 ${e.cancelled ? "opacity-50" : ""}`}>
                  <td className="px-5 py-3 font-mono text-sm tabular text-muted-foreground">{new Date(e.date).toLocaleDateString("fr-FR")}</td>
                  <td className="px-5 py-3 text-sm">{e.category ?? "—"}</td>
                  <td className="px-5 py-3 text-sm">
                    {e.recipient ? <><span className="block">{e.recipient.name}</span><span className="text-xs text-muted-foreground">{e.recipient.kind === "internal" ? "Interne" : "Externe"}</span></> : "—"}
                  </td>
                  <td className="px-5 py-3 text-sm">
                    <span className={e.cancelled ? "line-through" : ""}>{e.description}</span>
                    {e.cancelled && <span className="ml-2 text-xs text-destructive">Annulée</span>}
                  </td>
                  <td className="px-5 py-3 text-right font-mono font-semibold tabular text-destructive">-{formatMoney(e.amount, currency)}</td>
                  <td className="px-5 py-3 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button size="icon" variant="ghost" aria-label="Actions"><MoreHorizontal className="size-4" /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem disabled={e.cancelled} onSelect={() => setToCancel(e)} className="text-destructive focus:text-destructive">
                          <XCircle className="size-4 mr-2" /> Annuler
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="w-[calc(100%-2rem)] rounded-lg max-h-[90dvh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nouvelle dépense</DialogTitle>
            <DialogDescription>Les types et plafonds proviennent des Paramètres.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Destinataire</Label>
              <div className="flex gap-2" role="group" aria-label="Destination de la dépense">
                <Button variant={recipientKind === "internal" ? "default" : "outline"} aria-pressed={recipientKind === "internal"} onClick={() => setRecipientKind("internal")}>Interne</Button>
                <Button variant={recipientKind === "external" ? "default" : "outline"} aria-pressed={recipientKind === "external"} onClick={() => setRecipientKind("external")}>Externe</Button>
              </div>
            </div>
            {recipientKind === "internal" ? (
              <div className="space-y-1.5">
                <Label htmlFor="exp-recipient-member">Membre destinataire</Label>
                <Select value={memberId} onValueChange={setMemberId}>
                  <SelectTrigger id="exp-recipient-member"><SelectValue placeholder="Choisir un membre" /></SelectTrigger>
                  <SelectContent>{members.map(m => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}</SelectContent>
                </Select>
                {members.length === 0 && <p className="text-xs text-muted-foreground">Aucun membre disponible.</p>}
              </div>
            ) : (
              <div className="space-y-1.5">
                <Label htmlFor="exp-recipient-external">Destinataire externe</Label>
                <Input id="exp-recipient-external" value={externalName} maxLength={200} onChange={e => setExternalName(e.target.value)} />
              </div>
            )}
            <div className="space-y-1.5">
              <Label>Type de dépense</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger aria-label="Type de dépense"><SelectValue placeholder="Choisir un type" /></SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.name} value={c.name}>{c.name} · plafond {formatMoney(c.limit, currency)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="exp-date">Date</Label>
              <Input id="exp-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="exp-desc">Description</Label>
              <Textarea id="exp-desc" value={description} maxLength={200} onChange={(e) => setDescription(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="exp-amount">Montant ({currency})</Label>
              <Input id="exp-amount" type="number" inputMode="decimal" min={0} value={amount} onChange={(e) => setAmount(e.target.value)} aria-invalid={overLimit} />
              {category && <p className="text-xs text-muted-foreground">Plafond : {formatMoney(limit, currency)}</p>}
              {overLimit && (
                <p role="alert" className="flex items-center gap-2 text-sm text-destructive">
                  <AlertTriangle className="size-4" /> Montant supérieur au plafond de ce type de dépense.
                </p>
              )}
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>Annuler</Button>
            <Button onClick={submit} disabled={overLimit}>Valider</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {pending && (
        <MemberConfirmation
          title="Valider la dépense"
          name={`${pending.recipient?.name} · ${pending.category} · ${pending.description} · ${formatMoney(pending.amount, currency)}`}
          verify={verifyPassword}
          onClose={() => setPending(null)}
          onConfirm={() => { addExpense(pending); setPending(null); setOpen(false); reset(); toast.success("Dépense enregistrée."); }}
        />
      )}

      {toCancel && (
        <MemberConfirmation
          title="Annuler la dépense"
          name={`${toCancel.description} · ${formatMoney(toCancel.amount, currency)}`}
          verify={verifyPassword}
          onClose={() => setToCancel(null)}
          onConfirm={() => { updateExpense(toCancel.id, { cancelled: true }); setToCancel(null); toast.success("Dépense annulée."); }}
        />
      )}
    </div>
  );
};

export default Expenses;
