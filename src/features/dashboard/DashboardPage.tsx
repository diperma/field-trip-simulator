import { AlertTriangle, ClipboardList, Coins, Users } from "lucide-react";
import type { ReactNode } from "react";
import type { AssignmentComputed } from "../../domain/assignment";
import { formatCurrency } from "../../engine/costCalculator";
import type { PlanningDashboard } from "../planning/planningSelectors";
import { formatDifference } from "../planning/planningSelectors";

type DashboardPageProps = {
  dashboard: PlanningDashboard;
  computedAssignments: AssignmentComputed[];
  onOpenAssignment: (assignmentNo: number) => void;
};

export function DashboardPage({ dashboard, computedAssignments, onOpenAssignment }: DashboardPageProps) {
  return (
    <section className="workspace single-column">
      <header className="topbar">
        <div>
          <p className="eyebrow">Dashboard</p>
          <h2>Total Setiap Pengajuan</h2>
        </div>
      </header>

      <section className="metric-grid">
        <Metric icon={<ClipboardList size={18} />} label="Penugasan" value={`${dashboard.assignmentCount}`} />
        <Metric icon={<Users size={18} />} label="Baris Tim" value={`${dashboard.teamRowCount}`} />
        <Metric icon={<Coins size={18} />} label="Total Rencana" value={formatCurrency(dashboard.plannedTotal)} />
        <Metric icon={<AlertTriangle size={18} />} label="Konflik Jadwal" value={`${dashboard.conflictCount}`} />
      </section>

      <section className="dashboard-panel">
        <div className="dashboard-table dashboard-head">
          <span>Penugasan</span>
          <span>Periode</span>
          <span>Tim</span>
          <span>Uang Harian</span>
          <span>Penginapan</span>
          <span>Transport</span>
          <span>Dll.</span>
          <span>Total</span>
          <span>Selisih</span>
        </div>
        {dashboard.rows.map((row) => {
          const assignment = computedAssignments.find((candidate) => candidate.no === row.no);
          return (
            <button
              className="dashboard-table dashboard-row"
              key={row.no}
              type="button"
              onClick={() => onOpenAssignment(row.no)}
            >
              <span>
                <strong>No. {row.no}</strong>
                <small>PKPT {row.pkptId || "-"}</small>
                <small>{row.description || "Belum ada uraian"}</small>
              </span>
              <span>
                {row.startDate || "-"}
                <small>{row.endDate || "-"}</small>
              </span>
              <span>
                {row.teamSize} orang
                <small>{row.totalHp} HP</small>
              </span>
              <span>{formatCurrency(row.dailyAllowance)}</span>
              <span>{formatCurrency(row.lodging)}</span>
              <span>{formatCurrency(row.transport)}</span>
              <span>{formatCurrency(row.other)}</span>
              <span>
                <strong>{formatCurrency(row.total)}</strong>
                <small>Target {formatCurrency(row.expectedTotal)}</small>
              </span>
              <span className={row.expectedTotal === 0
                ? "status-neutral"
                : row.difference === 0
                  ? "status-ok"
                  : "status-warn"
              }>
                {row.expectedTotal === 0
                  ? "Target belum diisi"
                  : formatDifference(row.difference)}
                {!!assignment?.warnings.length && <small>{assignment.warnings.length} peringatan</small>}
              </span>
            </button>
          );
        })}
      </section>
    </section>
  );
}

function Metric({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="metric-card">
      <span>{icon}</span>
      <p>{label}</p>
      <strong>{value}</strong>
    </div>
  );
}
