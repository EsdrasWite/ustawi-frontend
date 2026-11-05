import { ReactNode } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function Field({ label, value, onChange, type = "text", hint, required = false }: { label: string; value: string; onChange: (value: string) => void; type?: string; hint?: string; required?: boolean }) {
  const id = `settings-${label.replace(/\s/g, "-")}`;
  return <div className="space-y-2 min-w-0"><Label htmlFor={id}>{label}</Label><Input id={id} value={value} onChange={(e) => onChange(e.target.value)} type={type} required={required} min={type === "number" ? 0 : undefined} className="bg-background" />{hint && <p className="text-xs text-muted-foreground">{hint}</p>}</div>;
}
export function Choice({ label, value, options, onChange }: { label: string; value: string; options: readonly string[]; onChange: (value: string) => void }) {
  const id = `settings-${label.replace(/\s/g, "-")}`;
  return <div className="space-y-2 min-w-0"><Label htmlFor={id}>{label}</Label><Select value={value} onValueChange={onChange}><SelectTrigger id={id}><SelectValue /></SelectTrigger><SelectContent>{options.map((option) => <SelectItem key={option} value={option}>{option}</SelectItem>)}</SelectContent></Select></div>;
}
export function ToggleRow({ label, description, checked, onChange }: { label: string; description?: string; checked: boolean; onChange: (value: boolean) => void }) {
  return <div className="flex items-center justify-between gap-6 py-4 border-b border-border/60 last:border-0"><div className="min-w-0"><p className="text-sm font-medium">{label}</p>{description && <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{description}</p>}</div><Switch aria-label={label} checked={checked} onCheckedChange={onChange} /></div>;
}
export function Group({ title, description, children, action }: { title: string; description?: string; children: ReactNode; action?: ReactNode }) {
  return <section className="py-6 border-b border-border/60 last:border-0"><div className="flex flex-wrap items-center justify-between gap-3 mb-5"><div><h3 className="font-display text-base font-semibold">{title}</h3>{description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}</div>{action}</div>{children}</section>;
}
export function Status({ children, warning = false }: { children: ReactNode; warning?: boolean }) {
  return <span className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium ${warning ? "bg-muted text-muted-foreground" : "bg-success/10 text-success"}`}><span className={`size-1.5 rounded-full ${warning ? "bg-muted-foreground" : "bg-success"}`} />{children}</span>;
}