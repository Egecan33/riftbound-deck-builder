// Ported from Riftfoundry apps/web/src/lib/scoring-restrictions.test.ts at origin/main 4b90179.
// 3 of 3 tests ported here; the rest exercise the pair network or deck scoring and belong to plan Tasks 5-6.
import { describe, expect, it } from "vitest";
import gallery from "../../fixtures/riftfoundry-gallery.json";
import {
  baseCardRatingBreakdown,
  type ScoreCard,
} from "@/engine/mine";
const strike = gallery.cards.find((c) => c.id === "ven-146-166")!;
const pickpocket = gallery.cards.find((c) => c.id === "sfd-074-221")!;
const control = (card: ScoreCard, rulesText: string) =>
  baseCardRatingBreakdown({ ...card, rulesText }).boardControl;
describe("damage alternatives and removal scope", () => {
  it("values an instead upgrade between its base and unconditional ceiling", () => {
    const original = control(strike, strike.rulesText);
    expect(original).toBeGreaterThan(
      control(strike, "Deal 4 to a unit at a battlefield."),
    );
    expect(original).toBeLessThan(
      control(strike, "Deal 7 to a unit at a battlefield."),
    );
    expect(original).toBeLessThan(
      control(strike, "Deal 11 to a unit at a battlefield."),
    );
  });
  it("keeps independent damage instructions additive", () => {
    expect(control(strike, "Deal 4 to a unit. Deal 3 to another unit.")).toBe(
      control(strike, "Deal 7 to a unit."),
    );
  });
  it("discounts gear-only answers and respects increasing cost bounds", () => {
    const kill = (target: string) =>
      control(pickpocket, `When you play me, kill ${target}.`);
    expect(kill("a gear with Energy cost no more than [1]")).toBeLessThan(
      kill("a gear with Energy cost no more than [3]"),
    );
    expect(kill("a gear with Energy cost no more than [3]")).toBeLessThan(
      kill("a gear"),
    );
    expect(kill("a gear")).toBeLessThan(kill("a unit"));
    expect(kill("a unit or gear")).toBeGreaterThanOrEqual(kill("a unit"));
    expect(kill("a friendly unit")).toBeLessThan(kill("a unit"));
  });
});
