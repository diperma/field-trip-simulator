import type {
  AssignmentComputed,
  AssignmentInput,
  AssignmentMemberComputed,
  AssignmentMemberInput,
  CostField,
  CostBreakdown,
} from "../domain/assignment";
import type { Employee } from "../domain/employee";
import { gradeGroup } from "../domain/employee";
import type { ProvinceRate } from "../domain/rates";

const DLDK_DAILY_ALLOWANCE = 210000;
const DLDK_TRANSPORT_PER_HP = 170000;
const DL_EXTRA_TRANSPORT = 500000;
const ES2_OTHER_PER_HP = 150000;

export function calculateAssignment(
  assignment: AssignmentInput,
  employees: Employee[],
  rates: ProvinceRate[],
): AssignmentComputed {
  const members = assignment.members.map((member) => calculateMember(member, employees, rates));
  const totals = sumCosts(members.map((member) => member.cost));
  const warnings = [
    ...members.flatMap((member) => member.warnings.map((warning) => `${member.employeeName}: ${warning}`)),
  ];

  if (totals.total !== assignment.expectedTotal) {
    warnings.push(
      `Total differs from workbook target by ${formatCurrency(totals.total - assignment.expectedTotal)}.`,
    );
  }

  return {
    ...assignment,
    members,
    totals,
    warnings,
  };
}

export function calculateMember(
  member: AssignmentMemberInput,
  employees: Employee[],
  rates: ProvinceRate[],
): AssignmentMemberComputed {
  const employee = employees.find((candidate) => candidate.name === member.employeeName);
  const rate = rates.find((candidate) => candidate.province === member.province);
  const grade = employee?.grade ?? "";
  const warnings: string[] = [];

  if (!employee) warnings.push("Pegawai tidak ditemukan dalam Daftar Pegawai D302.");
  if (!rate) warnings.push("Provinsi tidak ditemukan dalam tabel SBM TA 2026.");
  if (rate && member.assignmentType === "DL") {
    warnings.push(...missingDlRateWarnings(rate, grade));
  }
  if (member.hp !== daysInclusive(member.startDate, member.endDate)) {
    warnings.push("HP tidak sesuai dengan jumlah hari dari tanggal mulai hingga selesai.");
  }

  const calculatedDailyAllowance =
    member.assignmentType === "DL" ? (rate?.dailyAllowance ?? 0) * member.hp : DLDK_DAILY_ALLOWANCE * member.hp;
  const calculatedLodging =
    member.assignmentType === "DL" ? Math.max(member.hp - 1, 0) * lodgingRateForGrade(rate, grade) : 0;
  const calculatedTransport =
    member.assignmentType === "DL"
      ? (rate?.transport ?? 0) + (rate?.taxiRoundTrip ?? 0) + DL_EXTRA_TRANSPORT
      : DLDK_TRANSPORT_PER_HP * member.hp;
  const calculatedOther = grade === "Es.2" ? ES2_OTHER_PER_HP * member.hp : 0;
  const manualCosts = {
    ...member.manualCosts,
    ...(member.manualTransport !== undefined ? { transport: member.manualTransport } : {}),
  };
  const overrideFields = Object.entries(manualCosts)
    .filter(([, value]) => value !== undefined)
    .map(([field]) => field as CostField);
  const dailyAllowance = manualCosts.dailyAllowance ?? calculatedDailyAllowance;
  const lodging = manualCosts.lodging ?? calculatedLodging;
  const transport = manualCosts.transport ?? calculatedTransport;
  const other = manualCosts.other ?? calculatedOther;

  const cost = {
    dailyAllowance,
    lodging,
    transport,
    other,
    total: dailyAllowance + lodging + transport + other,
    transportIsOverride: manualCosts.transport !== undefined,
    overrideFields,
  };

  return {
    ...member,
    grade,
    cost,
    warnings,
  };
}

function missingDlRateWarnings(rate: ProvinceRate, grade: string): string[] {
  const warnings: string[] = [];
  if (rate.dailyAllowance === null) warnings.push(`Uang harian belum tersedia untuk ${rate.province}.`);
  if (lodgingRateForGrade(rate, grade) === 0) warnings.push(`Biaya penginapan belum tersedia untuk ${rate.province}/${grade || "golongan kosong"}.`);
  if (rate.transport === null) warnings.push(`Transport belum tersedia untuk ${rate.province}.`);
  if (rate.taxiRoundTrip === null) warnings.push(`Taksi PP belum tersedia untuk ${rate.province}.`);
  return warnings;
}

export function sumCosts(costs: CostBreakdown[]): CostBreakdown {
  return costs.reduce(
    (total, cost) => ({
      dailyAllowance: total.dailyAllowance + cost.dailyAllowance,
      lodging: total.lodging + cost.lodging,
      transport: total.transport + cost.transport,
      other: total.other + cost.other,
      total: total.total + cost.total,
      transportIsOverride: total.transportIsOverride || cost.transportIsOverride,
      overrideFields: [...new Set([...total.overrideFields, ...cost.overrideFields])],
    }),
    {
      dailyAllowance: 0,
      lodging: 0,
      transport: 0,
      other: 0,
      total: 0,
      transportIsOverride: false,
      overrideFields: [],
    },
  );
}

export function lodgingRateForGrade(rate: ProvinceRate | undefined, grade: string): number {
  if (!rate) return 0;

  switch (gradeGroup(grade)) {
    case "es2":
      return rate.lodgingEsII ?? 0;
    case "iv":
      return rate.lodgingGolIV ?? 0;
    case "iiiIi":
      return rate.lodgingGolIIIOrII ?? 0;
    default:
      return 0;
  }
}

export function daysInclusive(startDate: string, endDate: string): number {
  const start = new Date(`${startDate}T00:00:00`);
  const end = new Date(`${endDate}T00:00:00`);
  const diff = end.getTime() - start.getTime();
  if (Number.isNaN(diff)) return 0;
  return Math.floor(diff / 86400000) + 1;
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}
