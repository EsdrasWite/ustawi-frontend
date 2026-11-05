import { z } from "zod";

export const memberStatuses = ["Actif", "Inactif", "Suspendu"] as const;
export const memberFunctions = ["Aucune", "Inspecteur", "Contrôleur", "Agent administratif"] as const;
export const memberGenders = ["Masculin", "Féminin"] as const;
export type MemberStatus = typeof memberStatuses[number];
const requiredName = z.string().trim().min(1, "Champ obligatoire").max(60, "60 caractères maximum");
export const memberSchema = z.object({
  surname: requiredName,
  postname: requiredName,
  firstName: requiredName,
  gender: z.enum(memberGenders),
  phone: z.string().trim().min(1, "Téléphone obligatoire").max(30, "30 caractères maximum").regex(/^\+?[\d\s().-]{6,30}$/, "Numéro de téléphone invalide").refine(v => v.replace(/\D/g, "").length >= 6, "Au moins 6 chiffres"),
  email: z.union([z.literal(""), z.string().trim().email("Adresse e-mail invalide").max(255, "255 caractères maximum")]),
  function: z.enum(memberFunctions),
});
export type MemberDraft = z.infer<typeof memberSchema>;
export type Member = {
  id: string; name: string; active: boolean; createdAt: string;
  surname?: string; postname?: string; firstName?: string;
  gender?: MemberDraft["gender"]; phone?: string; email?: string;
  function?: MemberDraft["function"]; status?: MemberStatus;
};
export const emptyMember: MemberDraft = { surname: "", postname: "", firstName: "", gender: "Masculin", phone: "", email: "", function: "Aucune" };
export function getMemberStatus(member: Member): MemberStatus {
  return member.status === "Suspendu" ? "Suspendu" : member.active ? "Actif" : "Inactif";
}
export function memberToDraft(member: Member): MemberDraft {
  return { surname: member.surname ?? member.name, postname: member.postname ?? "", firstName: member.firstName ?? "", gender: member.gender ?? "Masculin", phone: member.phone ?? "", email: member.email ?? "", function: member.function ?? "Aucune" };
}
export function memberDetails(draft: MemberDraft) {
  const valid = memberSchema.parse(draft);
  return { ...valid, name: `${valid.surname} ${valid.postname} ${valid.firstName}` };
}
export function memberStatusPatch(status: MemberStatus) { return { status, active: status === "Actif" }; }
export type MemberFilters = { search: string; status: string; function: string };
export type MemberSort = "surname" | "postname" | "firstName" | "gender" | "phone" | "email" | "function" | "status";
export const memberColumns: { key: MemberSort; label: string }[] = [
  { key: "surname", label: "Nom" }, { key: "postname", label: "Postnom" }, { key: "firstName", label: "Prénom" }, { key: "gender", label: "Genre" }, { key: "phone", label: "Téléphone" }, { key: "email", label: "Email" }, { key: "function", label: "Fonction" }, { key: "status", label: "Statut" },
];
export function memberValue(member: Member, key: MemberSort): string {
  if (key === "status") return getMemberStatus(member);
  if (key === "surname") return member.surname ?? member.name;
  if (key === "function") return member.function ?? "Aucune";
  return member[key] ?? "";
}
const normalize = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
export function filterMembers(members: Member[], filters: MemberFilters, sort: MemberSort = "surname", ascending = true): Member[] {
  const search = normalize(filters.search.trim());
  return members.filter(m => (filters.status === "all" || getMemberStatus(m) === filters.status)
    && (filters.function === "all" || (m.function ?? "Aucune") === filters.function)
    && (!search || normalize(memberColumns.map(c => memberValue(m, c.key)).join(" ")).includes(search)))
    .sort((a, b) => (ascending ? 1 : -1) * memberValue(a, sort).localeCompare(memberValue(b, sort), "fr", { numeric: true, sensitivity: "base" }));
}
export function memberCounts(members: Member[]) {
  return { all: members.length, Actif: members.filter(m => getMemberStatus(m) === "Actif").length, Inactif: members.filter(m => getMemberStatus(m) === "Inactif").length, Suspendu: members.filter(m => getMemberStatus(m) === "Suspendu").length };
}