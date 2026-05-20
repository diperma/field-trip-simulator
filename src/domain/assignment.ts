export type AssignmentType = "DL" | "DLDK";

export type CostBreakdown = {
  dailyAllowance: number;
  lodging: number;
  transport: number;
  other: number;
  total: number;
  transportIsOverride: boolean;
  overrideFields: CostField[];
};

export type CostField = "dailyAllowance" | "lodging" | "transport" | "other";

export type ManualCostOverrides = Partial<Record<CostField, number>>;

export type AssignmentMemberInput = {
  employeeName: string;
  assignmentType: AssignmentType;
  province: string;
  city: string;
  startDate: string;
  endDate: string;
  hp: number;
  manualTransport?: number;
  manualCosts?: ManualCostOverrides;
};

export type AssignmentMemberComputed = AssignmentMemberInput & {
  grade: string;
  cost: CostBreakdown;
  warnings: string[];
};

export type AssignmentInput = {
  no: number;
  pkptId: number;
  description: string;
  assignmentType: AssignmentType;
  expectedTotal: number;
  members: AssignmentMemberInput[];
};

export type AssignmentComputed = AssignmentInput & {
  members: AssignmentMemberComputed[];
  totals: CostBreakdown;
  warnings: string[];
};
