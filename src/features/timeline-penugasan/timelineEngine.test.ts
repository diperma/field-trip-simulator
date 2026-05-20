import { describe, expect, it } from "vitest";
import { employees } from "../../data/employees";
import { provinceRates } from "../../data/rates";
import { seedAssignments } from "../../data/seedAssignments";
import { calculateAssignment } from "../../engine/costCalculator";
import { buildTimeline, markerForAssignment } from "./timelineEngine";

describe("buildTimeline", () => {
  it("builds assignment and employee markers using workbook marker codes", () => {
    const assignments = seedAssignments.map((assignment) =>
      calculateAssignment(assignment, employees, provinceRates),
    );

    const timeline = buildTimeline(assignments, "2026-06-01", "2026-06-04");
    const assignmentOne = timeline.assignmentRows.find((row) => row.id === "assignment-1");
    const assignmentTwo = timeline.assignmentRows.find((row) => row.id === "assignment-2");
    const iman = timeline.employeeRows.find((row) => row.label === "Iman Kadarman");

    expect(markerForAssignment(1, "DL")).toBe("1a");
    expect(assignmentOne?.hp).toBe(4);
    expect(assignmentTwo?.hp).toBe(4);
    expect(assignmentOne?.cells.map((cell) => cell.markers)).toEqual([["1a"], ["1a"], ["1a"], ["1a"]]);
    expect(assignmentTwo?.cells.map((cell) => cell.markers)).toEqual([["2a"], ["2a"], ["2a"], ["2a"]]);
    expect(iman?.hp).toBe(3);
    expect(iman?.cells.map((cell) => cell.markers)).toEqual([[], ["1a"], ["1a"], ["1a"]]);
  });
});
