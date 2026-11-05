import { describe, expect, it } from "vitest";
import { createSettings, currencies, roles } from "./settings-model";

describe("settings prototype", () => {
  it("offers CDF and USD currencies", () => {
    expect(currencies).toEqual(["CDF", "USD"]);
  });
  it("offers the four requested roles", () => {
    expect(roles).toEqual(["Administrateur", "Trésorier", "Secrétaire", "Membre"]);
  });
  it("keeps simulated permission edits isolated between sessions", () => {
    const first = createSettings();
    const second = createSettings();
    first.permissions.Membre[5] = true;
    expect(second.permissions.Membre[5]).toBe(false);
  });
});