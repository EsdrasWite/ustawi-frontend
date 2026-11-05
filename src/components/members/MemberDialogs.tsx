import { FormEvent, useState } from "react";
import { toast } from "sonner";
import { Loader2, LockKeyhole, Save, UserRound, Download, FileCheck2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Member, MemberDraft, memberFunctions, memberGenders, memberSchema, memberToDraft, emptyMember } from "@/lib/members";

export function MemberFormDialog({ member, onClose, onSubmit }: { member: Member | null; onClose: () => void; onSubmit: (draft: MemberDraft) => void }) {
  const [draft, setDraft] = useState<MemberDraft>(() => member ? memberToDraft(member) : { ...emptyMember });
  const [errors, setErrors] = useState<Partial<Record<keyof MemberDraft, string>>>({});
  const [saving, setSaving] = useState(false);
  async function submit(event: FormEvent) {
    event.preventDefault();
    const parsed = memberSchema.safeParse(draft);
    if (!parsed.success) {
      setErrors(Object.fromEntries(parsed.error.issues.map(issue => [issue.path[0], issue.message])));
      toast.error("Veuillez vérifier les champs du formulaire.");
      return;
    }
    setErrors({}); setSaving(true);
    await new Promise(resolve => setTimeout(resolve, 180));
    onSubmit(parsed.data); setSaving(false);
  }
  const fields = [{ key: "surname", label: "Nom", required: true }, { key: "postname", label: "Postnom", required: true }, { key: "firstName", label: "Prénom", required: true }, { key: "phone", label: "Téléphone", required: true }, { key: "email", label: "Email", required: false }] as const;
  return <Dialog open onOpenChange={open => { if (!open && !saving) onClose(); }}><DialogContent className="max-w-xl max-h-[90dvh] overflow-y-auto w-[calc(100%-2rem)] rounded-lg"><DialogHeader><DialogTitle className="flex items-center gap-2"><UserRound className="size-5 text-primary" />{member ? "Modifier le membre" : "Nouveau membre"}</DialogTitle><DialogDescription>{member ? member.name : "Informations du membre"}</DialogDescription></DialogHeader><form onSubmit={submit} noValidate className="space-y-6"><div className="grid sm:grid-cols-2 gap-4">{fields.map(({ key, label, required }) => <div key={key} className={key === "email" ? "space-y-2 sm:col-span-2" : "space-y-2"}><Label htmlFor={`member-${key}`}>{label}{required && <span className="text-destructive"> *</span>}</Label><Input id={`member-${key}`} value={draft[key]} type={key === "email" ? "email" : key === "phone" ? "tel" : "text"} maxLength={key === "email" ? 255 : key === "phone" ? 30 : 60} required={required} aria-invalid={Boolean(errors[key])} aria-describedby={errors[key] ? `error-${key}` : undefined} onChange={e => setDraft({ ...draft, [key]: e.target.value })} />{errors[key] && <p id={`error-${key}`} className="text-xs text-destructive" role="alert">{errors[key]}</p>}</div>)}<div className="space-y-2"><Label htmlFor="member-gender">Genre</Label><Select value={draft.gender} onValueChange={gender => setDraft({ ...draft, gender: gender as MemberDraft["gender"] })}><SelectTrigger id="member-gender"><SelectValue /></SelectTrigger><SelectContent>{memberGenders.map(value => <SelectItem value={value} key={value}>{value}</SelectItem>)}</SelectContent></Select></div><div className="space-y-2"><Label htmlFor="member-function">Fonction</Label><Select value={draft.function} onValueChange={value => setDraft({ ...draft, function: value as MemberDraft["function"] })}><SelectTrigger id="member-function"><SelectValue /></SelectTrigger><SelectContent>{memberFunctions.map(value => <SelectItem value={value} key={value}>{value}</SelectItem>)}</SelectContent></Select></div></div><DialogFooter className="gap-2"><Button type="button" variant="outline" disabled={saving} onClick={onClose}>Annuler</Button><Button type="submit" disabled={saving}>{saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}Enregistrer</Button></DialogFooter></form></DialogContent></Dialog>;
}

export function MemberConfirmation({ title, name, verify, onConfirm, onClose }: { title: string; name: string; verify: (password: string) => boolean; onConfirm: () => void; onClose: () => void }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent) {
    event.preventDefault(); setBusy(true); setError("");
    await new Promise(resolve => setTimeout(resolve, 100));
    if (!verify(password)) { setPassword(""); setError("Mot de passe incorrect. Aucune modification effectuée."); toast.error("Mot de passe incorrect."); setBusy(false); return; }
    setPassword(""); onConfirm(); setBusy(false);
  }
  return <Dialog open onOpenChange={open => { if (!open && !busy) onClose(); }}><DialogContent className="w-[calc(100%-2rem)] rounded-lg"><DialogHeader><DialogTitle className="flex gap-2 items-center"><LockKeyhole className="size-5 text-primary" />{title}</DialogTitle><DialogDescription>{name}</DialogDescription></DialogHeader><form onSubmit={submit} className="space-y-5"><div className="space-y-2"><Label htmlFor="member-confirm-password">Mot de passe de l’utilisateur connecté</Label><Input id="member-confirm-password" type="password" autoComplete="current-password" value={password} maxLength={256} required onChange={e => setPassword(e.target.value)} aria-invalid={Boolean(error)} />{error && <p className="text-sm text-destructive" role="alert">{error}</p>}</div><p className="text-xs text-muted-foreground border-l-2 border-warning pl-3">Confirmation de démonstration uniquement, sans sécurité d’authentification réelle.</p><DialogFooter className="gap-2"><Button type="button" variant="outline" onClick={onClose} disabled={busy}>Annuler</Button><Button type="submit" disabled={busy || !password}>{busy && <Loader2 className="size-4 animate-spin" />}Confirmer</Button></DialogFooter></form></DialogContent></Dialog>;
}

export function MemberExportDialog({ busy, count, filename, onClose, onDownload }: { busy: boolean; count: number; filename: string; onClose: () => void; onDownload: () => void }) {
  return <Dialog open onOpenChange={open => { if (!open && !busy) onClose(); }}><DialogContent className="w-[calc(100%-2rem)] rounded-lg"><DialogHeader><DialogTitle>Exporter les membres</DialogTitle><DialogDescription>{count} membre{count > 1 ? "s" : ""} correspondant aux filtres actifs</DialogDescription></DialogHeader><div className="flex items-center gap-3 py-5">{busy ? <Loader2 className="size-8 animate-spin text-primary" /> : <FileCheck2 className="size-8 text-success" />}<span className="text-sm break-all">{busy ? "Préparation du fichier…" : filename}</span></div><DialogFooter className="gap-2"><Button variant="outline" disabled={busy} onClick={onClose}>Fermer</Button><Button disabled={busy} onClick={onDownload}><Download className="size-4" />Télécharger</Button></DialogFooter></DialogContent></Dialog>;
}