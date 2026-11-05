import { describe, expect, it } from "vitest";
import { expenseRecipientSchema, matchesRecipient, recipientCounts } from "./expenses";

describe("Expense recipients", () => {
  it("requires a member selection for an internal recipient", () => {
    expect(expenseRecipientSchema.safeParse({ kind: "internal", memberId: "", name: "Membre" }).success).toBe(false);
    expect(expenseRecipientSchema.safeParse({ kind: "internal", memberId: "m1", name: "Membre" }).success).toBe(true);
  });
  it("requires nonblank text for an external recipient", () => {
    expect(expenseRecipientSchema.safeParse({ kind: "external", name: "  " }).success).toBe(false);
    expect(expenseRecipientSchema.parse({ kind: "external", name: " Fournisseur " }).name).toBe("Fournisseur");
  });
  it("counts and filters internal, external and legacy expenses without inventing recipients", () => {
    const expenses = [{ recipient: { kind: "internal" as const, memberId: "m1", name: "Membre" } }, { recipient: { kind: "external" as const, name: "Fournisseur" } }, {}];
    expect(recipientCounts(expenses)).toEqual({ all: 3, internal: 1, external: 1 });
    expect(expenses.filter(e => matchesRecipient(e, "internal"))).toEqual([expenses[0]]);
    expect(expenses.filter(e => matchesRecipient(e, "external"))).toEqual([expenses[1]]);
    expect(expenses.filter(e => matchesRecipient(e, "all"))).toHaveLength(3);
  });
});