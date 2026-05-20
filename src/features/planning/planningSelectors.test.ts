import { describe, expect, it } from "vitest";
import { employees } from "../../data/employees";
import { provinceRates } from "../../data/rates";
import { seedAssignments } from "../../data/seedAssignments";
import { calculateAssignment } from "../../engine/costCalculator";
import { buildPlanningDashboard } from "./planningSelectors";

describe("buildPlanningDashboard", () => {
  it("summarizes assignment submissions and workbook target differences", () => {
    const assignments = seedAssignments.map((assignment) =>
      calculateAssignment(assignment, employees, provinceRates),
    );

    const dashboard = buildPlanningDashboard(assignments, employees);

    expect(dashboard.assignmentCount).toBe(2);
    expect(dashboard.teamRowCount).toBe(8);
    expect(dashboard.plannedTotal).toBe(61463000);
    expect(dashboard.expectedTotal).toBe(61463000);
    expect(dashboard.difference).toBe(0);
    expect(dashboard.rows.map((row) => row.total)).toEqual([41546000, 19917000]);
  });
});
