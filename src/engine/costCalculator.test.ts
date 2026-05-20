import { describe, expect, it } from "vitest";
import { seedAssignments } from "../data/seedAssignments";
import { employees } from "../data/employees";
import { provinceRates } from "../data/rates";
import { calculateAssignment } from "./costCalculator";

describe("calculateAssignment", () => {
  it("reproduces assignment 1 from Rencana Penugasan Tw II", () => {
    const result = calculateAssignment(seedAssignments[0], employees, provinceRates);

    expect(result.totals.dailyAllowance).toBe(7790000);
    expect(result.totals.lodging).toBe(13496000);
    expect(result.totals.transport).toBe(20260000);
    expect(result.totals.total).toBe(41546000);
    expect(result.warnings).toEqual([]);
  });

  it("reproduces assignment 2 with manual transport overrides", () => {
    const result = calculateAssignment(seedAssignments[1], employees, provinceRates);

    expect(result.totals.dailyAllowance).toBe(4920000);
    expect(result.totals.lodging).toBe(6516000);
    expect(result.totals.transport).toBe(8481000);
    expect(result.totals.total).toBe(19917000);
    expect(result.totals.transportIsOverride).toBe(true);
    expect(result.warnings).toEqual([]);
  });
});
