import { useRef, useState } from "react";
import {
  Building2,
  Wallet,
  CalendarRange,
  Receipt,
  Users,
  ShieldCheck,
  Bell,
  Palette,
  Database,
  History,
  Save,
  Loader2,
  Check,
  Plus,
  Upload,
  Download,
  FileSpreadsheet,
  FileText,
  RotateCcw,
  Search,
  Settings2,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  AssociationSettings,
  ContributionSettings,
  FinancialYearSettings,
  ExpenseSettings,
  SettingsSectionProps,
} from "@/components/settings/FinancialSettings";
import {
  MemberSettings,
  UserSettings,
  NotificationSettings,
  AppearanceSettings,
} from "@/components/settings/AccessSettings";
import {
  Choice,
  Field,
  Group,
  Status,
} from "@/components/settings/SettingsControls";
import {
  createSettings,
  initialEvents,
  roles,
  SettingsData,
} from "@/components/settings/settings-model";
import { useAppSettings } from "@/lib/app-settings";

const sections = [
  {
    id: "association",
    label: "Association",
    icon: Building2,
    description: "Identité, coordonnées et devise de votre association.",
  },
  {
    id: "contributions",
    label: "Cotisations",
    icon: Wallet,
    description: "Montants, échéances et règles de contribution.",
  },
  {
    id: "financial",
    label: "Exercice financier",
    icon: CalendarRange,
    description: "Périodes comptables, clôture et report des soldes.",
  },
  {
    id: "expenses",
    label: "Dépenses",
    icon: Receipt,
    description: "Catégories, plafonds et circuit de validation.",
  },
  {
    id: "members",
    label: "Membres",
    icon: Users,
    description: "Statuts, adhésion et obligations de cotisation.",
  },
  {
    id: "users",
    label: "Utilisateurs et permissions",
    icon: ShieldCheck,
    description: "Comptes et responsabilités au sein de l’association.",
  },
  {
    id: "notifications",
    label: "Notifications",
    icon: Bell,
    description: "Rappels, alertes et confirmations de paiement.",
  },
  {
    id: "appearance",
    label: "Apparence",
    icon: Palette,
    description: "Personnalisez votre environnement de travail.",
  },
  {
    id: "data",
    label: "Données",
    icon: Database,
    description: "Importation, exportation et sauvegardes.",
  },
  {
    id: "history",
    label: "Historique",
    icon: History,
    description: "Toutes les opérations, en un seul endroit.",
  },
];

export default function Settings() {
  const [active, setActive] = useState("association");
  const [data, setData] = useState(createSettings);
  const [saved, setSaved] = useState(createSettings);
  const [busy, setBusy] = useState(false);
  const [events, setEvents] = useState(initialEvents);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("Toutes les actions");
  const [confirmation, setConfirmation] = useState<{
    title: string;
    description: string;
    action: () => void;
  } | null>(null);
  const [modal, setModal] = useState<
    | "category"
    | "exemption"
    | "user"
    | "status"
    | "amount"
    | "import"
    | "export"
    | null
  >(null);
  const [name, setName] = useState("");
  const [detail, setDetail] = useState("");
  const [role, setRole] = useState("Membre");
  const [date, setDate] = useState("2026-11-01");
  const [selectedFile, setSelectedFile] = useState("");
  const [exportFormat, setExportFormat] = useState("Excel (.xlsx)");
  const [exportScope, setExportScope] = useState("Toutes les données");
  const [backup, setBackup] = useState<SettingsData | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const section = sections.find((item) => item.id === active) || sections[0];
  const dirty = JSON.stringify(data) !== JSON.stringify(saved);
  const log = (action: string, details: string) =>
    setEvents((items) => [
      {
        user: "Admin Ustawi",
        action,
        date: new Intl.DateTimeFormat("fr-FR", {
          dateStyle: "short",
          timeStyle: "short",
        }).format(new Date()),
        details,
      },
      ...items,
    ]);
  const patch: SettingsSectionProps["patch"] = (key, value) =>
    setData(
      (current) =>
        ({
          ...current,
          [key]: Array.isArray(current[key])
            ? value
            : { ...current[key], ...value },
        }) as SettingsData,
    );
  const confirm: SettingsSectionProps["confirm"] = (
    title,
    description,
    action,
  ) => setConfirmation({ title, description, action });
  const add: SettingsSectionProps["add"] = (kind) => {
    setName("");
    setDetail("");
    setRole("Membre");
    setModal(kind);
  };
  const props = { data, patch, confirm, add };
  const simulate = async (message: string, action?: () => void) => {
    setBusy(true);
    await new Promise((resolve) => setTimeout(resolve, 650));
    action?.();
    setBusy(false);
    toast({
      title: message,
      description: "Simulation terminée · aucune donnée réelle modifiée.",
    });
  };
  const save = async () => {
    await simulate("Paramètres enregistrés", () => {
      setSaved(structuredClone(data));
      log("Paramètres", `Enregistrement des paramètres · ${section.label}.`);
      // Partage l'exercice, le tarif et la devise avec la page Contributions (état de session, sans backend).
      useAppSettings.getState().applySettings({
        currency: data.association.currency,
        monthlyAmount: parseFloat(data.contributions.amount) || 0,
        fyStart: data.financial.start.slice(0, 7),
        fyEnd: data.financial.end.slice(0, 7),
        history: data.contributions.history
          .map((h) => ({
            amount: parseFloat(h.amount) || 0,
            from: h.date.slice(0, 7),
          }))
          .filter((h) => h.amount > 0 && /^\d{4}-\d{2}$/.test(h.from)),
        expenseCategories: data.expenses.categories
          .map((c) => ({
            name: c.name.trim(),
            limit: parseFloat(c.limit) || 0,
          }))
          .filter((c) => c.name),
      });
    });
  };
  const submitModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (modal === "category")
      patch("expenses", {
        categories: [
          ...data.expenses.categories,
          { name, limit: detail || "0" },
        ],
      });
    if (modal === "exemption")
      patch("contributions", {
        exemptions: [
          ...data.contributions.exemptions,
          { name, reason: detail, until: date },
        ],
      });
    if (modal === "status" && !data.members.statuses.includes(name.trim()))
      patch("members", { statuses: [...data.members.statuses, name.trim()] });
    if (modal === "user")
      patch("users", [
        ...data.users,
        { name, email: detail, role, active: true },
      ]);
    if (modal === "amount")
      patch("contributions", {
        history: [
          { amount: name, date, author: "Admin Ustawi" },
          ...data.contributions.history,
        ],
      });
    if (modal === "import" || modal === "export") {
      await simulate(
        modal === "import" ? "Import Excel simulé" : "Export simulé",
        () =>
          log(
            "Données",
            modal === "import"
              ? `Aperçu d’import : ${selectedFile}`
              : `Export ${exportFormat} · ${exportScope}`,
          ),
      );
    } else
      toast({
        title: "Modification ajoutée",
        description:
          "Enregistrez les paramètres pour la conserver dans cette session.",
      });
    setModal(null);
  };
  const content = () => {
    if (active === "association") return <AssociationSettings {...props} />;
    if (active === "contributions") return <ContributionSettings {...props} />;
    if (active === "financial") return <FinancialYearSettings {...props} />;
    if (active === "expenses") return <ExpenseSettings {...props} />;
    if (active === "members") return <MemberSettings {...props} />;
    if (active === "users") return <UserSettings {...props} />;
    if (active === "notifications") return <NotificationSettings {...props} />;
    if (active === "appearance") return <AppearanceSettings {...props} />;
    if (active === "data")
      return (
        <>
          <Group
            title="Importer des données"
            description="Membres, cotisations et dépenses depuis un fichier Excel."
          >
            <div className="border border-dashed border-border rounded-lg px-5 py-8 flex flex-col items-center text-center">
              <FileSpreadsheet className="size-8 text-primary mb-3" />
              <p className="text-sm font-medium">Import Excel</p>
              <p className="text-xs text-muted-foreground mt-2 mb-5">
                .xlsx · Aperçu et vérification avant importation
              </p>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setSelectedFile("");
                  setModal("import");
                }}
              >
                <Upload />
                Choisir un fichier
              </Button>
            </div>
          </Group>
          <Group title="Exporter les données">
            <div className="grid sm:grid-cols-2 gap-4">
              {[
                {
                  title: "Excel",
                  icon: FileSpreadsheet,
                  format: "Excel (.xlsx)",
                  text: "Tableaux financiers et listes de membres",
                },
                {
                  title: "PDF",
                  icon: FileText,
                  format: "PDF (.pdf)",
                  text: "Synthèse financière et rapports",
                },
              ].map(({ title, icon: Icon, format, text }) => (
                <div
                  key={title}
                  className="border border-border rounded-lg p-5"
                >
                  <Icon className="text-info size-6 mb-3" />
                  <h4 className="font-medium">{title}</h4>
                  <p className="text-xs text-muted-foreground mt-2 mb-4">
                    {text}
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setExportFormat(format);
                      setModal("export");
                    }}
                  >
                    <Download />
                    Exporter {title}
                  </Button>
                </div>
              ))}
            </div>
          </Group>
          <Group title="Sauvegarde et restauration">
            <div className="flex flex-wrap items-center justify-between gap-4 bg-muted/40 rounded-lg p-4 mb-5">
              <div>
                <p className="text-sm font-medium">
                  Sauvegarde de démonstration
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {backup
                    ? "Disponible dans cette session"
                    : "Aucune sauvegarde dans cette session"}
                </p>
              </div>
              <Status warning={!backup}>
                {backup ? "Disponible" : "Non créée"}
              </Status>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button
                type="button"
                variant="outline"
                disabled={busy}
                onClick={() =>
                  simulate("Sauvegarde créée", () => {
                    setBackup(structuredClone(saved));
                    log("Données", "Sauvegarde de démonstration créée.");
                  })
                }
              >
                {busy ? <Loader2 className="animate-spin" /> : <Database />}
                Créer une sauvegarde
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={!backup}
                onClick={() =>
                  confirm(
                    "Restaurer la sauvegarde ?",
                    "Les paramètres de cette maquette seront remplacés par la sauvegarde de session. Les données réelles restent inchangées.",
                    () => {
                      if (backup) {
                        setData(structuredClone(backup));
                        setSaved(structuredClone(backup));
                        log(
                          "Données",
                          "Restauration de la sauvegarde de session.",
                        );
                      }
                    },
                  )
                }
              >
                <RotateCcw />
                Restaurer
              </Button>
            </div>
          </Group>
        </>
      );
    return (
      <>
        <Group
          title="Journal des opérations"
          action={<Badge variant="secondary">{events.length} opérations</Badge>}
        >
          <div className="grid sm:grid-cols-[1fr_200px] gap-4 mb-5">
            <div className="relative">
              <Search className="absolute left-3 top-3 size-4 text-muted-foreground" />
              <Input
                aria-label="Rechercher dans l’historique"
                placeholder="Rechercher une opération…"
                className="pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Choice
              label="Filtrer par action"
              value={filter}
              options={[
                "Toutes les actions",
                "Paramètres",
                "Cotisation",
                "Dépense",
                "Membre",
                "Exercice",
                "Données",
              ]}
              onChange={setFilter}
            />
          </div>
          <div className="divide-y divide-border">
            {events
              .filter(
                (event) =>
                  (filter === "Toutes les actions" ||
                    event.action === filter) &&
                  `${event.user} ${event.action} ${event.details}`
                    .toLowerCase()
                    .includes(search.toLowerCase()),
              )
              .map((event, i) => (
                <div key={i} className="py-5 flex gap-4">
                  <div className="size-8 shrink-0 flex items-center justify-center bg-muted rounded-full">
                    <History className="size-4 text-muted-foreground" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap justify-between gap-2">
                      <p className="text-sm font-medium">
                        {event.user}{" "}
                        <Badge variant="secondary" className="ml-2">
                          {event.action}
                        </Badge>
                      </p>
                      <time className="text-xs text-muted-foreground">
                        {event.date}
                      </time>
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">
                      {event.details}
                    </p>
                  </div>
                </div>
              ))}
            {!events.some(
              (event) =>
                (filter === "Toutes les actions" || event.action === filter) &&
                `${event.user} ${event.action} ${event.details}`
                  .toLowerCase()
                  .includes(search.toLowerCase()),
            ) && (
              <p className="text-sm text-muted-foreground py-10 text-center">
                Aucune opération correspondante.
              </p>
            )}
          </div>
        </Group>
      </>
    );
  };

  return (
    <div className="animate-fade-in overflow-x-clip">
      <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-display text-3xl sm:text-4xl font-bold">
              Paramètres
            </h1>
            <Badge
              variant="outline"
              className="border-info/30 bg-info/10 text-info"
            >
              Maquette
            </Badge>
          </div>
          <p className="text-muted-foreground mt-2">
            L’essentiel pour une gestion à votre image.
          </p>
        </div>
        <div className="flex gap-2 items-center text-xs text-muted-foreground">
          <ShieldCheck className="size-4 text-primary" />
          Espace administrateur
        </div>
      </div>
      <div className="grid lg:grid-cols-[220px_minmax(0,1fr)] gap-6 lg:gap-9">
        <aside className="min-w-0">
          <div className="lg:sticky lg:top-28">
            <p className="hidden lg:block text-[10px] uppercase font-semibold text-muted-foreground mb-3 px-3">
              Configuration
            </p>
            <nav
              aria-label="Sections des paramètres"
              className="flex lg:flex-col overflow-x-auto lg:overflow-visible gap-1 pb-3 lg:pb-0"
            >
              {sections.map((item) => (
                <Button
                  type="button"
                  key={item.id}
                  variant="ghost"
                  aria-current={active === item.id ? "page" : undefined}
                  onClick={() => setActive(item.id)}
                  className={cn(
                    "justify-start h-auto py-3 px-3 shrink-0 lg:whitespace-normal lg:text-left gap-3 rounded-lg",
                    active === item.id
                      ? "bg-primary/10 text-primary hover:bg-primary/15 hover:text-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  <item.icon className="size-4 shrink-0" />
                  <span className="flex-1">{item.label}</span>
                  {active === item.id && (
                    <ChevronRight className="hidden lg:block size-3" />
                  )}
                </Button>
              ))}
            </nav>
            <div className="hidden lg:block mt-8 border-t border-border pt-5 px-3">
              <Settings2 className="size-5 text-muted-foreground mb-3" />
              <p className="text-xs font-medium">Les Horizons</p>
              <p className="text-xs text-muted-foreground mt-1">
                Exercice 2026 · {data.association.currency}
              </p>
              <p className="text-[11px] text-info mt-4 leading-relaxed">
                Données fictives · Session de démonstration
              </p>
            </div>
          </div>
        </aside>
        <div className="min-w-0">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              save();
            }}
            className="min-w-0"
          >
            <div className="flex items-center gap-3 border-b border-border pb-5">
              <div className="size-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <section.icon className="size-5" />
              </div>
              <div>
                <h2 className="font-display text-xl font-semibold">
                  {section.label}
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  {section.description}
                </p>
              </div>
            </div>
            {content()}
            {active !== "history" && active !== "data" && (
              <div className="lg:sticky lg:bottom-0 z-20 bg-background/95 backdrop-blur border-t border-border py-4 flex flex-wrap justify-between gap-3 items-center">
                <span className="text-xs text-muted-foreground flex gap-2 items-center">
                  {dirty ? (
                    <>
                      <span className="size-1.5 bg-warning rounded-full" />
                      Modifications non enregistrées
                    </>
                  ) : (
                    <>
                      <Check className="size-3 text-success" />
                      Tous les paramètres sont à jour
                    </>
                  )}
                </span>
                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={!dirty || busy}
                    onClick={() => {
                      setData(structuredClone(saved));
                      toast({ title: "Modifications annulées" });
                    }}
                  >
                    Annuler
                  </Button>
                  <Button type="submit" disabled={!dirty || busy}>
                    {busy ? <Loader2 className="animate-spin" /> : <Save />}
                    {busy ? "Enregistrement…" : "Enregistrer"}
                  </Button>
                </div>
              </div>
            )}
          </form>
          <p className="text-xs text-muted-foreground mt-4 mb-5">
            Maquette interactive · Les réglages sont conservés uniquement
            pendant cette visite.
          </p>
        </div>
      </div>
      <AlertDialog
        open={!!confirmation}
        onOpenChange={(open) => {
          if (!open) setConfirmation(null);
        }}
      >
        <AlertDialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle>{confirmation?.title}</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmation?.description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                confirmation?.action();
                setConfirmation(null);
                toast({ title: "Opération simulée confirmée" });
              }}
            >
              Confirmer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <Dialog
        open={!!modal}
        onOpenChange={(open) => {
          if (!open && !busy) setModal(null);
        }}
      >
        <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {
                {
                  category: "Nouvelle catégorie",
                  exemption: "Nouvelle exemption",
                  user: "Inviter un utilisateur",
                  status: "Nouveau statut",
                  amount: "Planifier une cotisation",
                  import: "Import Excel",
                  export: "Exporter un rapport",
                }[modal || "category"]
              }
            </DialogTitle>
            <DialogDescription>
              {modal === "import" || modal === "export"
                ? "Simulation uniquement : aucun fichier n’est importé ou généré."
                : "Ajoutez cette modification à vos paramètres de démonstration."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={submitModal} className="space-y-5">
            {modal && !["import", "export"].includes(modal) && (
              <Field
                label={
                  modal === "amount"
                    ? `Nouveau montant (${data.association.currency})`
                    : modal === "user"
                      ? "Nom complet"
                      : modal === "exemption"
                        ? "Nom du membre"
                        : "Nom"
                }
                value={name}
                onChange={setName}
                type={modal === "amount" ? "number" : "text"}
                required
              />
            )}
            {(modal === "category" ||
              modal === "exemption" ||
              modal === "user") && (
              <Field
                label={
                  modal === "category"
                    ? "Plafond"
                    : modal === "user"
                      ? "E-mail de l’utilisateur"
                      : "Motif"
                }
                value={detail}
                onChange={setDetail}
                type={
                  modal === "category"
                    ? "number"
                    : modal === "user"
                      ? "email"
                      : "text"
                }
                required
              />
            )}
            {modal === "user" && (
              <Choice
                label="Rôle"
                value={role}
                options={roles}
                onChange={setRole}
              />
            )}
            {(modal === "amount" || modal === "exemption") && (
              <Field
                label={
                  modal === "amount" ? "Date d’effet" : "Fin de l’exemption"
                }
                value={date}
                type="date"
                onChange={setDate}
                required
              />
            )}
            {modal === "import" && (
              <>
                <input
                  ref={fileInput}
                  className="hidden"
                  type="file"
                  accept=".xlsx"
                  aria-label="Fichier Excel"
                  onChange={(e) =>
                    setSelectedFile(e.target.files?.[0]?.name || "")
                  }
                />
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => fileInput.current?.click()}
                >
                  <Upload />
                  {selectedFile || "Sélectionner un fichier .xlsx"}
                </Button>
                <Choice
                  label="Type de données"
                  value={exportScope}
                  options={[
                    "Toutes les données",
                    "Membres",
                    "Cotisations",
                    "Dépenses",
                  ]}
                  onChange={setExportScope}
                />
                {selectedFile && (
                  <div className="bg-info/10 text-info p-3 rounded-md text-sm">
                    Fichier sélectionné : {selectedFile}
                    <p className="mt-1 text-xs">
                      Aperçu simulé · Le contenu du fichier n’est pas analysé.
                    </p>
                  </div>
                )}
              </>
            )}
            {modal === "export" && (
              <>
                <Choice
                  label="Format"
                  value={exportFormat}
                  options={["Excel (.xlsx)", "PDF (.pdf)"]}
                  onChange={setExportFormat}
                />
                <Choice
                  label="Contenu du rapport"
                  value={exportScope}
                  options={[
                    "Toutes les données",
                    "Membres",
                    "Cotisations",
                    "Dépenses",
                    "Synthèse financière",
                  ]}
                  onChange={setExportScope}
                />
                <p className="text-sm text-muted-foreground">
                  Exercice 2026 · {data.association.name} ·{" "}
                  {data.association.currency}
                </p>
              </>
            )}
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                disabled={busy}
                onClick={() => setModal(null)}
              >
                Annuler
              </Button>
              <Button
                type="submit"
                disabled={busy || (modal === "import" && !selectedFile)}
              >
                {busy ? (
                  <Loader2 className="animate-spin" />
                ) : modal === "export" ? (
                  <Download />
                ) : (
                  <Plus />
                )}
                {modal === "import"
                  ? "Simuler l’import"
                  : modal === "export"
                    ? "Simuler l’export"
                    : "Ajouter"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
