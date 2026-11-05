import { describe, expect, it } from "vitest";
import { Member, emptyMember, filterMembers, getMemberStatus, memberCounts, memberDetails, memberFunctions, memberSchema, memberStatusPatch } from "./members";
import { defaultDemoCredential, hashDemoPassword, migrateDemoState, verifyDemoPassword } from "./demo-password";
const draft = { ...emptyMember, surname: "Wite", postname: "Ilunga", firstName: "Esdras", phone: "+243 812 345 678" };
const members: Member[] = [
  { id: "1", name: "Wite", active: true, createdAt: "2026-10-17", ...draft },
  { id: "2", name: "Ancien membre", active: false, createdAt: "2026-10-17" },
  { id: "3", name: "Suspendu", active: false, status: "Suspendu", function: "Inspecteur", createdAt: "2026-10-17" },
];
describe("Member requirements", () => {
  for (const key of ["surname", "postname", "firstName", "phone"] as const) it(`requires ${key}`, () => expect(memberSchema.safeParse({ ...draft, [key]: " " }).success).toBe(false));
  it("allows an omitted email", () => expect(memberSchema.parse(draft).email).toBe(""));
  it("validates email", () => expect(memberSchema.safeParse({ ...draft, email: "invalid" }).success).toBe(false));
  it("validates telephone", () => expect(memberSchema.safeParse({ ...draft, phone: "abcdef" }).success).toBe(false));
  it("accepts the two genders only", () => { expect(memberSchema.safeParse({ ...draft, gender: "Féminin" }).success).toBe(true); expect(memberSchema.safeParse({ ...draft, gender: "Autre" }).success).toBe(false); });
  it("supports the four functions", () => expect(memberFunctions).toEqual(["Aucune", "Inspecteur", "Contrôleur", "Agent administratif"]));
  it("retains a full name for financial modules", () => expect(memberDetails(draft).name).toBe("Wite Ilunga Esdras"));
  it("suspension marks a member inactive financially", () => expect(memberStatusPatch("Suspendu")).toEqual({ status: "Suspendu", active: false }));
  it("activation clears suspension", () => expect(getMemberStatus({ ...members[2], ...memberStatusPatch("Actif") })).toBe("Actif"));
  it("deactivation sets Inactif", () => expect(memberStatusPatch("Inactif")).toEqual({ status: "Inactif", active: false }));
  it("counts suspended separately from inactive", () => expect(memberCounts(members)).toEqual({ all: 3, Actif: 1, Inactif: 1, Suspendu: 1 }));
  it("combines search, status and function", () => expect(filterMembers(members, { search: "inspecteur", status: "Suspendu", function: "Inspecteur" }).map(m => m.id)).toEqual(["3"]));
  it("keeps legacy names and statuses", () => expect(filterMembers(members, { search: "Ancien", status: "Inactif", function: "Aucune" }).map(m => m.id)).toEqual(["2"]));
  it("filtered export source is not paginated", () => { const list = Array.from({ length: 25 }, (_, i) => ({ ...members[0], id: String(i) })); expect(filterMembers(list, { search: "", status: "Actif", function: "all" })).toHaveLength(25); });
});
describe("Demo-only password verification", () => {
  it("rejects incorrect password", () => expect(verifyDemoPassword("incorrect", defaultDemoCredential)).toBe(false));
  it("accepts the connected account verifier", () => { const credential = hashDemoPassword("Test123!"); expect(verifyDemoPassword("Test123!", credential)).toBe(true); expect(verifyDemoPassword("Test123", credential)).toBe(false); });
  it("migrates plaintext without dropping financial data", () => { const state = migrateDemoState({ profile: { name: "Account", password: "Legacy123!" }, members }); expect(state.profile).not.toHaveProperty("password"); expect(state).toHaveProperty("members", members); expect(verifyDemoPassword("Legacy123!", state.demoCredential)).toBe(true); });
});