import { useEffect, useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Plus,
  MoreHorizontal,
  Search,
  Download,
  FileSpreadsheet,
  FileText,
  Pencil,
  PauseCircle,
  UserCheck,
  UserX,
  Users,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";
import { toast } from "sonner";
import {
  Member,
  MemberDraft,
  MemberSort,
  MemberStatus,
  memberColumns,
  memberCounts,
  memberDetails,
  memberFunctions,
  memberStatuses,
  memberStatusPatch,
  memberValue,
  getMemberStatus,
  filterMembers,
} from "@/lib/members";
import {
  MemberConfirmation,
  MemberExportDialog,
  MemberFormDialog,
} from "@/components/members/MemberDialogs";
import type { MemberExportFormat } from "@/lib/member-exports";
import { deliverMemberExport } from "@/lib/member-exports";

type PendingAction = {
  member: Member;
  status?: MemberStatus;
  draft?: MemberDraft;
};
type ExportState = {
  busy: boolean;
  count: number;
  filename: string;
  blob?: Blob;
};
const statusStyles: Record<MemberStatus, string> = {
  Actif: "bg-success/10 text-success",
  Inactif: "bg-muted text-muted-foreground",
  Suspendu: "bg-warning/10 text-warning",
};
const Members = () => {
  const members = useStore((s) => s.members);
  const addMember = useStore((s) => s.addMember);
  const updateMember = useStore((s) => s.updateMember);
  const verifyPassword = useStore((s) => s.verifyPassword);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [functionFilter, setFunctionFilter] = useState("all");
  const [sort, setSort] = useState<MemberSort>("surname");
  const [ascending, setAscending] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<{ member: Member | null } | null>(null);
  const [pending, setPending] = useState<PendingAction | null>(null);
  const [exportState, setExportState] = useState<ExportState | null>(null);
  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 220);
    return () => clearTimeout(timer);
  }, []);
  const filters = useMemo(
    () => ({ search, status, function: functionFilter }),
    [search, status, functionFilter],
  );
  const filtered = useMemo(
    () => filterMembers(members, filters, sort, ascending),
    [members, filters, sort, ascending],
  );
  const counts = useMemo(() => memberCounts(members), [members]);
  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, pages);
  const displayed = filtered.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );
  const hasFilters =
    search !== "" || status !== "all" || functionFilter !== "all";
  function changeStatus(value: string) {
    setStatus(value);
    setPage(1);
  }
  function submitMember(draft: MemberDraft) {
    try {
      if (form?.member) {
        setPending({ member: form.member, draft });
        setForm(null);
      } else {
        addMember(draft);
        setForm(null);
        toast.success("Membre ajouté.");
      }
    } catch {
      toast.error("Impossible d’enregistrer ce membre.");
    }
  }
  function confirmAction() {
    if (!pending) return;
    const current = useStore
      .getState()
      .members.find((m) => m.id === pending.member.id);
    if (!current) {
      toast.error("Ce membre n’existe plus.");
      setPending(null);
      return;
    }
    try {
      updateMember(
        current.id,
        pending.draft
          ? memberDetails(pending.draft)
          : memberStatusPatch(pending.status ?? getMemberStatus(current)),
      );
      toast.success(
        pending.draft
          ? "Membre modifié."
          : `Statut mis à jour : ${pending.status}.`,
      );
      setPending(null);
    } catch {
      toast.error("Impossible de modifier ce membre.");
    }
  }
  async function prepareExport(format: MemberExportFormat) {
    const snapshot = [...filtered];
    const filename = `Ustawi-membres-${new Date().toISOString().slice(0, 10)}.${format}`;
    setExportState({ busy: true, count: snapshot.length, filename });
    try {
      const { createMemberExport } = await import("@/lib/member-exports");
      const blob = await createMemberExport(snapshot, format, filters);
      setExportState({ busy: false, count: snapshot.length, filename, blob });
    } catch {
      setExportState(null);
      toast.error("L’export a échoué. Veuillez réessayer.");
    }
  }
  async function downloadExport() {
    if (!exportState?.blob) return;
    try {
      await deliverMemberExport(exportState.blob, exportState.filename);
    } catch {
      toast.error("Impossible de télécharger le fichier.");
    }
  }
  const kpis = [
    {
      value: "all",
      label: "Tous les membres",
      icon: Users,
      count: counts.all,
      color: "text-info bg-info/10",
    },
    {
      value: "Actif",
      label: "Membres actifs",
      icon: UserCheck,
      count: counts.Actif,
      color: "text-success bg-success/10",
    },
    {
      value: "Inactif",
      label: "Membres inactifs",
      icon: UserX,
      count: counts.Inactif,
      color: "text-muted-foreground bg-muted",
    },
    {
      value: "Suspendu",
      label: "Membres suspendus",
      icon: PauseCircle,
      count: counts.Suspendu,
      color: "text-warning bg-warning/10",
    },
  ];
  return (
    <div className="space-y-6 min-w-0 animate-fade-in">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <PageHeader
          title="Membres"
          description="Gérez les membres contributeurs de votre association."
        />
        <div className="flex gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                disabled={
                  loading || !filtered.length || Boolean(exportState?.busy)
                }
              >
                <Download className="size-4" />
                Exporter
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={() => void prepareExport("xlsx")}>
                <FileSpreadsheet className="size-4 mr-2" />
                Excel (.xlsx)
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => void prepareExport("pdf")}>
                <FileText className="size-4 mr-2" />
                PDF (.pdf)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button onClick={() => setForm({ member: null })}>
            <Plus className="size-4" />
            Nouveau membre
          </Button>
        </div>
      </div>
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        {kpis.map(({ value, label, icon: Icon, count, color }) => (
          <Button
            key={value}
            variant="outline"
            aria-pressed={status === value}
            onClick={() => changeStatus(value)}
            className={`h-auto min-h-28 p-4 flex items-start justify-between gap-2 whitespace-normal bg-card hover:bg-card hover:text-foreground text-left rounded-lg ${status === value ? "border-primary ring-1 ring-primary/30" : "border-border/60"}`}
          >
            <div className="min-w-0">
              <span className="block text-xs text-muted-foreground font-medium">
                {label}
              </span>
              {loading ? (
                <Skeleton className="h-8 w-12 mt-2" />
              ) : (
                <span className="block text-3xl font-display tabular font-semibold mt-2">
                  {count}
                </span>
              )}
            </div>
            <span
              className={`size-8 rounded-md flex items-center justify-center shrink-0 ${color}`}
            >
              <Icon className="size-4" />
            </span>
          </Button>
        ))}
      </div>
      <section className="space-y-4" aria-label="Liste des membres">
        <div className="flex flex-col lg:flex-row gap-3">
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3 top-3 size-4 text-muted-foreground" />
            <Input
              aria-label="Rechercher un membre"
              placeholder="Rechercher un membre…"
              maxLength={255}
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="pl-9 bg-card"
            />
          </div>
          <div className="flex flex-wrap sm:flex-nowrap gap-3">
            <Select value={status} onValueChange={changeStatus}>
              <SelectTrigger
                aria-label="Filtrer par statut"
                className="w-full sm:w-44 bg-card"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                {memberStatuses.map((value) => (
                  <SelectItem value={value} key={value}>
                    {value}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={functionFilter}
              onValueChange={(value) => {
                setFunctionFilter(value);
                setPage(1);
              }}
            >
              <SelectTrigger
                aria-label="Filtrer par fonction"
                className="w-full sm:w-52 bg-card"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les fonctions</SelectItem>
                {memberFunctions.map((value) => (
                  <SelectItem value={value} key={value}>
                    {value}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {hasFilters && (
              <Button
                variant="ghost"
                size="icon"
                title="Effacer les filtres"
                aria-label="Effacer les filtres"
                onClick={() => {
                  setSearch("");
                  changeStatus("all");
                  setFunctionFilter("all");
                }}
              >
                <X className="size-4" />
              </Button>
            )}
          </div>
        </div>
        <div className="border border-border/60 rounded-lg overflow-hidden bg-card">
          <div className="overflow-x-auto w-full max-w-full">
            <table className="w-full text-sm min-w-[1140px]">
              <thead className="bg-muted/50">
                <tr>
                  {memberColumns.map((column) => (
                    <th
                      key={column.key}
                      aria-sort={
                        sort === column.key
                          ? ascending
                            ? "ascending"
                            : "descending"
                          : "none"
                      }
                      className="text-left font-medium px-4 py-3"
                    >
                      <Button
                        variant="ghost"
                        size="sm"
                        className="p-0 h-7 hover:bg-transparent text-muted-foreground gap-2"
                        onClick={() => {
                          if (sort === column.key) setAscending(!ascending);
                          else {
                            setSort(column.key);
                            setAscending(true);
                          }
                          setPage(1);
                        }}
                      >
                        {column.label}
                        {sort === column.key ? (
                          ascending ? (
                            <ArrowUp className="size-3" />
                          ) : (
                            <ArrowDown className="size-3" />
                          )
                        ) : (
                          <ArrowUpDown className="size-3 opacity-40" />
                        )}
                      </Button>
                    </th>
                  ))}
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground sticky right-0 z-10 bg-muted">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading
                  ? Array.from({ length: 5 }, (_, i) => (
                      <tr key={i} className="border-t border-border/60">
                        {Array.from({ length: 9 }, (_, j) => (
                          <td key={j} className="p-4">
                            <Skeleton className="h-5 w-20" />
                          </td>
                        ))}
                      </tr>
                    ))
                  : displayed.map((member) => (
                      <tr
                        key={member.id}
                        className="border-t border-border/60 hover:bg-muted/20"
                      >
                        {memberColumns.map(({ key }) => (
                          <td
                            key={key}
                            className={`px-4 py-4 ${key === "surname" ? "font-medium" : "text-muted-foreground"}`}
                          >
                            <span
                              className={
                                key === "status"
                                  ? `inline-flex px-2 py-1 text-xs font-medium rounded-md ${statusStyles[getMemberStatus(member)]}`
                                  : "block max-w-56 break-words"
                              }
                            >
                              {memberValue(member, key) || "—"}
                            </span>
                          </td>
                        ))}
                        <td className="px-4 py-3 text-right sticky right-0 z-10 bg-card">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                aria-label={`Actions pour ${member.name}`}
                                title="Actions du membre"
                              >
                                <MoreHorizontal className="size-5" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onSelect={() => setForm({ member })}
                              >
                                <Pencil className="size-4 mr-2" />
                                Modifier
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                disabled={
                                  getMemberStatus(member) === "Suspendu"
                                }
                                onSelect={() =>
                                  setPending({ member, status: "Suspendu" })
                                }
                              >
                                <PauseCircle className="size-4 mr-2" />
                                Suspendre
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onSelect={() =>
                                  setPending({
                                    member,
                                    status:
                                      getMemberStatus(member) === "Actif"
                                        ? "Inactif"
                                        : "Actif",
                                  })
                                }
                              >
                                {getMemberStatus(member) === "Actif" ? (
                                  <UserX className="size-4 mr-2" />
                                ) : (
                                  <UserCheck className="size-4 mr-2" />
                                )}
                                {getMemberStatus(member) === "Actif"
                                  ? "Désactiver"
                                  : "Activer"}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    ))}
              </tbody>
            </table>
          </div>
          {!loading && !filtered.length && (
            <div className="text-center py-14 px-4">
              <Users className="size-9 mx-auto mb-3 text-muted-foreground/50" />
              <p className="font-medium text-sm">
                {members.length
                  ? "Aucun membre ne correspond aux filtres."
                  : "Aucun membre pour l’instant."}
              </p>
              {members.length ? (
                <Button
                  variant="link"
                  className="mt-2"
                  onClick={() => {
                    setSearch("");
                    changeStatus("all");
                    setFunctionFilter("all");
                  }}
                >
                  Effacer les filtres
                </Button>
              ) : (
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => setForm({ member: null })}
                >
                  <Plus className="size-4" />
                  Nouveau membre
                </Button>
              )}
            </div>
          )}
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/60 p-4">
            <p
              className="text-xs text-muted-foreground tabular"
              aria-live="polite"
            >
              {filtered.length
                ? `${(currentPage - 1) * pageSize + 1}–${Math.min(currentPage * pageSize, filtered.length)} sur ${filtered.length} membres`
                : "0 membre"}
            </p>
            <div className="flex items-center gap-3">
              <Select
                value={String(pageSize)}
                onValueChange={(value) => {
                  setPageSize(Number(value));
                  setPage(1);
                }}
              >
                <SelectTrigger
                  className="w-20 h-8"
                  aria-label="Membres par page"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[10, 25, 50].map((value) => (
                    <SelectItem key={value} value={String(value)}>
                      {value}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                size="icon"
                variant="outline"
                className="size-8"
                title="Page précédente"
                aria-label="Page précédente"
                disabled={currentPage === 1}
                onClick={() => setPage(currentPage - 1)}
              >
                <ChevronLeft className="size-4" />
              </Button>
              <span className="text-xs tabular">
                {currentPage} / {pages}
              </span>
              <Button
                size="icon"
                variant="outline"
                className="size-8"
                title="Page suivante"
                aria-label="Page suivante"
                disabled={currentPage >= pages}
                onClick={() => setPage(currentPage + 1)}
              >
                <ChevronRight className="size-4" />
              </Button>
            </div>
          </div>
        </div>
      </section>
      {form && (
        <MemberFormDialog
          member={form.member}
          onClose={() => setForm(null)}
          onSubmit={submitMember}
        />
      )}
      {pending && (
        <MemberConfirmation
          key={`${pending.member.id}-${pending.status ?? "edit"}`}
          title={
            pending.draft
              ? "Confirmer la modification"
              : pending.status === "Suspendu"
                ? "Suspendre le membre"
                : pending.status === "Actif"
                  ? "Activer le membre"
                  : "Désactiver le membre"
          }
          name={pending.member.name}
          verify={verifyPassword}
          onConfirm={confirmAction}
          onClose={() => setPending(null)}
        />
      )}
      {exportState && (
        <MemberExportDialog
          busy={exportState.busy}
          count={exportState.count}
          filename={exportState.filename}
          onClose={() => setExportState(null)}
          onDownload={() => void downloadExport()}
        />
      )}
    </div>
  );
};
export default Members;
