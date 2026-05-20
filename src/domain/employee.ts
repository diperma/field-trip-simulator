export type Employee = {
  id: number;
  name: string;
  nip: string;
  grade: string;
};

export function gradeGroup(grade: string): "es2" | "iv" | "iiiIi" | "unknown" {
  if (grade === "Es.2") return "es2";
  if (grade.includes("IV")) return "iv";
  if (grade.includes("III") || grade.includes("II")) return "iiiIi";
  return "unknown";
}
