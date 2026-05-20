import type { AssignmentComputed } from "../domain/assignment";

export function findScheduleConflicts(assignments: AssignmentComputed[]): string[] {
  const byEmployee = new Map<string, Array<{ assignmentNo: number; date: string }>>();

  for (const assignment of assignments) {
    for (const member of assignment.members) {
      const dates = expandDates(member.startDate, member.endDate);
      for (const date of dates) {
        const rows = byEmployee.get(member.employeeName) ?? [];
        rows.push({ assignmentNo: assignment.no, date });
        byEmployee.set(member.employeeName, rows);
      }
    }
  }

  const conflicts: string[] = [];
  for (const [employee, rows] of byEmployee.entries()) {
    const seen = new Map<string, number[]>();
    for (const row of rows) {
      const dates = seen.get(row.date) ?? [];
      dates.push(row.assignmentNo);
      seen.set(row.date, dates);
    }
    for (const [date, assignmentNos] of seen.entries()) {
      const unique = [...new Set(assignmentNos)];
      if (unique.length > 1) {
        conflicts.push(`${employee} memiliki penugasan bertabrakan pada ${date}: no. ${unique.join(", ")}.`);
      }
    }
  }

  return conflicts;
}

export function expandDates(startDate: string, endDate: string): string[] {
  const start = new Date(`${startDate}T00:00:00`);
  const end = new Date(`${endDate}T00:00:00`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return [];

  const dates: string[] = [];
  let cursor = new Date(start);
  while (cursor <= end) {
    const y = cursor.getFullYear();
    const m = String(cursor.getMonth() + 1).padStart(2, "0");
    const d = String(cursor.getDate()).padStart(2, "0");
    dates.push(`${y}-${m}-${d}`);
    cursor.setDate(cursor.getDate() + 1);
  }
  return dates;
}

