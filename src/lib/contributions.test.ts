import { describe, expect, it } from "vitest";
import { cellStatus, filterMatches, statusCounts } from "./contributions";
import { expectedAmountFor } from "./app-settings";

describe("cellStatus", () => {
  it("classe zéro/vide, partiel, payé et dépassement", () => {
    expect(cellStatus(0, 25000)).toBe("empty");
    expect(cellStatus(-5, 25000)).toBe("empty");
    expect(cellStatus(10000, 25000)).toBe("partial");
    expect(cellStatus(25000, 25000)).toBe("paid");
    expect(cellStatus(30000, 25000)).toBe("over");
  });
});

describe("filterMatches", () => {
  it("le filtre payé inclut les dépassements", () => {
    expect(filterMatches("over", "paid")).toBe(true);
    expect(filterMatches("over", "all")).toBe(true);
    expect(filterMatches("over", "partial")).toBe(false);
  });
  it("un seul statut par filtre", () => {
    expect(filterMatches("partial", "partial")).toBe(true);
    expect(filterMatches("empty", "empty")).toBe(true);
    expect(filterMatches("paid", "empty")).toBe(false);
  });
});

describe("statusCounts", () => {
  it("compte les cellules membre/mois, pas les membres", () => {
    const members = [
      { id: "a", name: "A", active: true, createdAt: "" },
      { id: "b", name: "B", active: true, createdAt: "" },
    ];
    const contributions = { a: { "2026-01": 25000, "2026-02": 10000 }, b: { "2026-01": 30000 } };
    const counts = statusCounts(members, contributions, ["2026-01", "2026-02"], () => 25000);
    expect(counts).toEqual({ all: 4, partial: 1, paid: 2, empty: 1 });
  });
});

describe("expectedAmountFor", () => {
  const settings = { monthlyAmount: 25000, history: [{ amount: 25000, from: "2026-01" }, { amount: 20000, from: "2025-01" }] };
  it("applique le tarif historique selon le mois", () => {
    expect(expectedAmountFor("2025-10", settings)).toBe(20000);
    expect(expectedAmountFor("2026-03", settings)).toBe(25000);
  });
  it("retombe sur le montant courant avant tout historique", () => {
    expect(expectedAmountFor("2024-06", settings)).toBe(25000);
  });
});
