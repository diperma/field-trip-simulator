import type { AssignmentComputed, AssignmentType } from "../../domain/assignment";
import { expandDates } from "../../engine/validators";

export type TimelineCell = {
  date: string;
  markers: string[];
  hasConflict: boolean;
};

export type TimelineRow = {
  id: string;
  label: string;
  detail: string;
  hp: number;
  expectedHp: number;
  cells: TimelineCell[];
  warnings: string[];
};

export type TimelineModel = {
  dates: string[];
  assignmentRows: TimelineRow[];
  employeeRows: TimelineRow[];
  warnings: string[];
};

export function buildTimeline(
  assignments: AssignmentComputed[],
  startDate = "2026-04-01",
  endDate = "2026-07-07",
): TimelineModel {
  const dates = expandDates(startDate, endDate);
  const assignmentRows = assignments.map((assignment) => {
    const markersByDate = new Map<string, string[]>();
    const marker = markerForAssignment(assignment.no, assignment.assignmentType);

    for (const member of assignment.members) {
      for (const date of expandDates(member.startDate, member.endDate)) {
        if (!dates.includes(date)) continue;
        const markers = markersByDate.get(date) ?? [];
        if (!markers.includes(marker)) markers.push(marker);
        markersByDate.set(date, markers);
      }
    }

    const expectedHp = assignment.members.reduce((maxHp, member) => Math.max(maxHp, member.hp), 0);
    return makeRow(
      `assignment-${assignment.no}`,
      `No. ${assignment.no}`,
      `PKPT ${assignment.pkptId || "-"} - ${assignment.description || ""}`,
      expectedHp,
      dates,
      markersByDate,
    );
  });

  const employeeRows = buildEmployeeRows(assignments, dates);
  const warnings = [...assignmentRows, ...employeeRows].flatMap((row) => row.warnings);

  return {
    dates,
    assignmentRows,
    employeeRows,
    warnings,
  };
}

export function markerForAssignment(no: number, assignmentType: AssignmentType): string {
  return `${no}${assignmentType === "DL" ? "a" : "b"}`;
}

function buildEmployeeRows(assignments: AssignmentComputed[], dates: string[]): TimelineRow[] {
  const employeeMaps = new Map<string, Map<string, string[]>>();
  const employeeHp = new Map<string, number>();

  for (const assignment of assignments) {
    const marker = markerForAssignment(assignment.no, assignment.assignmentType);
    for (const member of assignment.members) {
      const markersByDate = employeeMaps.get(member.employeeName) ?? new Map<string, string[]>();
      for (const date of expandDates(member.startDate, member.endDate)) {
        if (!dates.includes(date)) continue;
        const markers = markersByDate.get(date) ?? [];
        markers.push(marker);
        markersByDate.set(date, markers);
      }
      employeeMaps.set(member.employeeName, markersByDate);
      employeeHp.set(member.employeeName, (employeeHp.get(member.employeeName) ?? 0) + member.hp);
    }
  }

  return [...employeeMaps.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([employeeName, markersByDate]) =>
      makeRow(
        `employee-${employeeName}`,
        employeeName,
        "Pegawai",
        employeeHp.get(employeeName) ?? 0,
        dates,
        markersByDate,
      ),
    );
}

function makeRow(
  id: string,
  label: string,
  detail: string,
  expectedHp: number,
  dates: string[],
  markersByDate: Map<string, string[]>,
): TimelineRow {
  const cells = dates.map((date) => {
    const markers = markersByDate.get(date) ?? [];
    return {
      date,
      markers,
      hasConflict: new Set(markers).size > 1,
    };
  });
  const hp = cells.filter((cell) => cell.markers.length > 0).length;
  const warnings = hp === expectedHp ? [] : [`${label}: marker count ${hp} differs from HP ${expectedHp}.`];

  return {
    id,
    label,
    detail,
    hp,
    expectedHp,
    cells,
    warnings,
  };
}
