import type { AssignmentComputed } from "../../domain/assignment";
import type { Employee } from "../../domain/employee";
import { formatCurrency } from "../../engine/costCalculator";
import { findScheduleConflicts } from "../../engine/validators";

export type AssignmentDashboardRow = {
  no: number;
  pkptId: number;
  description: string;
  teamSize: number;
  startDate: string;
  endDate: string;
  totalHp: number;
  dailyAllowance: number;
  lodging: number;
  transport: number;
  other: number;
  total: number;
  expectedTotal: number;
  difference: number;
  warningCount: number;
};

export type PlanningDashboard = {
  rows: AssignmentDashboardRow[];
  assignmentCount: number;
  teamRowCount: number;
  totalHp: number;
  plannedTotal: number;
  expectedTotal: number;
  difference: number;
  conflictCount: number;
  employeesUsed: number;
};

export function buildPlanningDashboard(
  assignments: AssignmentComputed[],
  employees: Employee[],
): PlanningDashboard {
  const rows = assignments.map((assignment) => {
    const dates = assignment.members.flatMap((member) => [member.startDate, member.endDate]).filter(Boolean);
    const sortedDates = [...dates].sort();
    const totalHp = assignment.members.reduce((sum, member) => sum + member.hp, 0);

    return {
      no: assignment.no,
      pkptId: assignment.pkptId,
      description: assignment.description,
      teamSize: assignment.members.length,
      startDate: sortedDates[0] ?? "",
      endDate: sortedDates[sortedDates.length - 1] ?? "",
      totalHp,
      dailyAllowance: assignment.totals.dailyAllowance,
      lodging: assignment.totals.lodging,
      transport: assignment.totals.transport,
      other: assignment.totals.other,
      total: assignment.totals.total,
      expectedTotal: assignment.expectedTotal,
      difference: assignment.totals.total - assignment.expectedTotal,
      warningCount: assignment.warnings.length,
    };
  });
  const uniqueEmployees = new Set(
    assignments.flatMap((assignment) => assignment.members.map((member) => member.employeeName)),
  );
  const plannedTotal = rows.reduce((sum, row) => sum + row.total, 0);
  const expectedTotal = rows.reduce((sum, row) => sum + row.expectedTotal, 0);

  return {
    rows,
    assignmentCount: rows.length,
    teamRowCount: rows.reduce((sum, row) => sum + row.teamSize, 0),
    totalHp: rows.reduce((sum, row) => sum + row.totalHp, 0),
    plannedTotal,
    expectedTotal,
    difference: plannedTotal - expectedTotal,
    conflictCount: findScheduleConflicts(assignments).length,
    employeesUsed: [...uniqueEmployees].filter((employee) =>
      employees.some((candidate) => candidate.name === employee),
    ).length,
  };
}

export function formatDifference(value: number): string {
  if (value === 0) return "Sesuai";
  return value > 0 ? `Lebih ${formatCurrency(value)}` : `Kurang ${formatCurrency(Math.abs(value))}`;
}
