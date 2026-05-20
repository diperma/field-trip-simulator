import {
  AlertTriangle,
  CalendarDays,
  CopyPlus,
  Plus,
  RotateCcw,
  Save,
  Trash2,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { employees } from "../../data/employees";
import { provinceRates } from "../../data/rates";
import { seedAssignments } from "../../data/seedAssignments";
import type {
  AssignmentComputed,
  AssignmentInput,
  AssignmentMemberInput,
  AssignmentType,
  CostField,
} from "../../domain/assignment";
import { daysInclusive, formatCurrency } from "../../engine/costCalculator";
import { findScheduleConflicts } from "../../engine/validators";

// ── Derived constants (computed once, not on every render) ────────────────
const sortedEmployees = [...employees].sort((a, b) => a.name.localeCompare(b.name, "id"));
const sortedProvinces = [...provinceRates].sort((a, b) =>
  a.province.localeCompare(b.province, "id"),
);
const validEmployeeNames = new Set(employees.map((e) => e.name));
const validProvinceNames = new Set(provinceRates.map((r) => r.province));

const costFields: Array<{ field: CostField; label: string }> = [
  { field: "dailyAllowance", label: "Uang Harian" },
  { field: "lodging", label: "Penginapan" },
  { field: "transport", label: "Transport" },
  { field: "other", label: "Dll." },
];

const blankMember: AssignmentMemberInput = {
  employeeName: employees[0].name,
  assignmentType: "DL",
  province: "Jawa Timur",
  city: "",
  startDate: "2026-06-01",
  endDate: "2026-06-01",
  hp: 1,
};

// ── Types ─────────────────────────────────────────────────────────────────
type RencanaPenugasanPageProps = {
  assignments: AssignmentInput[];
  computedAssignments: AssignmentComputed[];
  activeNo: number;
  savedAt: string;
  onActiveNoChange: (activeNo: number) => void;
  onAssignmentsChange: (assignments: AssignmentInput[]) => void;
};

// ── Helpers ───────────────────────────────────────────────────────────────
function formatDateShort(dateStr: string): string {
  if (!dateStr) return "";
  return new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short" }).format(
    new Date(`${dateStr}T00:00:00`),
  );
}

function tabMeta(assignment: AssignmentComputed): string {
  const dates = assignment.members
    .map((m) => m.startDate)
    .filter(Boolean)
    .sort();
  const province = assignment.members[0]?.province;
  const parts: string[] = [];
  if (dates[0]) parts.push(formatDateShort(dates[0]));
  if (province) parts.push(province);
  return parts.join(" · ") || "Belum ada data";
}

// ── Page component ────────────────────────────────────────────────────────
export function RencanaPenugasanPage({
  assignments,
  computedAssignments,
  activeNo,
  savedAt,
  onActiveNoChange,
  onAssignmentsChange,
}: RencanaPenugasanPageProps) {
  const activeAssignment =
    assignments.find((a) => a.no === activeNo) ?? assignments[0];
  const activeComputed = computedAssignments.find(
    (a) => a.no === activeAssignment?.no,
  );
  const scheduleConflicts = findScheduleConflicts(computedAssignments);

  // Local UI state
  const [confirmAction, setConfirmAction] = useState<"delete" | "reset" | null>(null);
  const confirmTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [openOverrides, setOpenOverrides] = useState<Set<number>>(new Set());
  // Tracks the raw text in each employee name input (can be mid-typing / invalid)
  const [nameDrafts, setNameDrafts] = useState<Record<number, string>>({});

  // Reset local state when switching to a different assignment
  useEffect(() => {
    setOpenOverrides(new Set());
    setNameDrafts({});
    setConfirmAction(null);
  }, [activeAssignment?.no]);

  // ── Assignment-level mutations ──────────────────────────────────────────
  function updateActive(next: AssignmentInput) {
    onAssignmentsChange(
      assignments.map((a) => (a.no === activeAssignment.no ? next : a)),
    );
    onActiveNoChange(next.no);
  }

  function updateMember(index: number, patch: Partial<AssignmentMemberInput>) {
    const members = activeAssignment.members.map((m, i) =>
      i === index ? { ...m, ...patch } : m,
    );
    updateActive({ ...activeAssignment, members });
  }

  function updateManualCost(index: number, field: CostField, value: string) {
    const member = activeAssignment.members[index];
    const manualCosts = { ...(member.manualCosts ?? {}) };
    if (value === "") {
      delete manualCosts[field];
    } else {
      manualCosts[field] = Number(value);
    }
    updateMember(index, {
      manualCosts,
      manualTransport: field === "transport" ? undefined : member.manualTransport,
    });
  }

  function addAssignment() {
    const nextNo = assignments.length
      ? Math.max(...assignments.map((a) => a.no)) + 1
      : 1;
    const next: AssignmentInput = {
      no: nextNo,
      pkptId: 0,
      description: "",
      assignmentType: "DL",
      expectedTotal: 0,
      members: [{ ...blankMember }],
    };
    onAssignmentsChange([...assignments, next]);
    onActiveNoChange(nextNo);
  }

  function duplicateAssignment() {
    const nextNo = assignments.length
      ? Math.max(...assignments.map((a) => a.no)) + 1
      : 1;
    const next = {
      ...activeAssignment,
      no: nextNo,
      description: `${activeAssignment.description} (copy)`,
      members: activeAssignment.members.map((m) => ({
        ...m,
        manualCosts: { ...m.manualCosts },
      })),
    };
    onAssignmentsChange([...assignments, next]);
    onActiveNoChange(nextNo);
  }

  function deleteAssignment() {
    const next = assignments.filter((a) => a.no !== activeAssignment.no);
    onAssignmentsChange(next);
    onActiveNoChange(next[0]?.no ?? 0);
  }

  function resetToSeeds() {
    onAssignmentsChange(seedAssignments);
    onActiveNoChange(seedAssignments[0].no);
  }

  function removeMember(index: number) {
    updateActive({
      ...activeAssignment,
      members: activeAssignment.members.filter((_, i) => i !== index),
    });
  }

  function addMember() {
    const first = activeAssignment.members[0];
    updateActive({
      ...activeAssignment,
      members: [
        ...activeAssignment.members,
        {
          ...blankMember,
          assignmentType: activeAssignment.assignmentType,
          province: first?.province ?? blankMember.province,
          city: first?.city ?? "",
          startDate: first?.startDate ?? blankMember.startDate,
          endDate: first?.endDate ?? blankMember.endDate,
          hp: first?.hp ?? 1,
        },
      ],
    });
  }

  // ── Inline confirm ──────────────────────────────────────────────────────
  function requestConfirm(action: "delete" | "reset") {
    if (confirmTimer.current) clearTimeout(confirmTimer.current);
    setConfirmAction(action);
    confirmTimer.current = setTimeout(() => setConfirmAction(null), 5000);
  }

  function executeConfirm() {
    if (confirmAction === "delete") deleteAssignment();
    else if (confirmAction === "reset") resetToSeeds();
    setConfirmAction(null);
    if (confirmTimer.current) clearTimeout(confirmTimer.current);
  }

  // ── Override panel toggle ───────────────────────────────────────────────
  function toggleOverride(index: number) {
    setOpenOverrides((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  }

  // ── Employee name datalist handler ──────────────────────────────────────
  function handleNameChange(index: number, value: string) {
    setNameDrafts((prev) => ({ ...prev, [index]: value }));
    if (validEmployeeNames.has(value)) {
      updateMember(index, { employeeName: value });
    }
  }

  // ── Empty state ─────────────────────────────────────────────────────────
  if (!activeAssignment) {
    return (
      <section className="workspace single-column">
        <div className="empty-state">
          <h2>Belum ada penugasan</h2>
          <button className="primary-action" type="button" onClick={addAssignment}>
            <Plus size={18} />
            Penugasan
          </button>
        </div>
      </section>
    );
  }

  // ── Render ──────────────────────────────────────────────────────────────
  return (
    <>
      {/* Shared datalists (referenced by list="" on inputs) */}
      <datalist id="employee-list">
        {sortedEmployees.map((e) => (
          <option key={e.name} value={e.name} />
        ))}
      </datalist>
      <datalist id="province-list">
        {sortedProvinces.map((r) => (
          <option key={r.province} value={r.province} />
        ))}
      </datalist>

      {/* ── Sidebar ── */}
      <aside className="sidebar">
        <div className="brand-block">
          <p className="eyebrow">D302 TA 2026</p>
          <h1>Rencana Penugasan TW II</h1>
        </div>

        <button className="primary-action" type="button" onClick={addAssignment}>
          <Plus size={18} />
          Penugasan
        </button>

        <nav className="assignment-list" aria-label="Daftar penugasan">
          {computedAssignments.map((assignment) => (
            <button
              className={assignment.no === activeNo ? "assignment-tab active" : "assignment-tab"}
              key={assignment.no}
              type="button"
              onClick={() => onActiveNoChange(assignment.no)}
            >
              <span>No. {assignment.no}</span>
              <strong>{formatCurrency(assignment.totals.total)}</strong>
              <small>PKPT {assignment.pkptId || "–"}</small>
              <small>{tabMeta(assignment)}</small>
            </button>
          ))}
        </nav>
      </aside>

      {/* ── Workspace ── */}
      <section className="workspace">
        <header className="topbar">
          <div>
            <p className="eyebrow">Module pertama</p>
            <h2>Susunan Tim dan Perhitungan Biaya</h2>
          </div>
          <div className="topbar-actions">
            {confirmAction ? (
              /* Inline confirm replaces action buttons */
              <div className="confirm-inline">
                <span>
                  {confirmAction === "delete"
                    ? "Hapus penugasan ini?"
                    : "Kembalikan ke contoh workbook?"}
                </span>
                <button className="confirm-yes" type="button" onClick={executeConfirm}>
                  Ya
                </button>
                <button type="button" onClick={() => setConfirmAction(null)}>
                  Batal
                </button>
              </div>
            ) : (
              <>
                <button
                  className="icon-button"
                  type="button"
                  onClick={duplicateAssignment}
                  title="Duplikasi penugasan"
                >
                  <CopyPlus size={18} />
                </button>
                <button
                  className="icon-button danger"
                  type="button"
                  onClick={() => requestConfirm("delete")}
                  title="Hapus penugasan"
                >
                  <Trash2 size={18} />
                </button>
                <button
                  className="icon-button"
                  type="button"
                  onClick={() => requestConfirm("reset")}
                  title="Kembalikan contoh workbook"
                >
                  <RotateCcw size={18} />
                </button>
              </>
            )}
            <span className="save-indicator" title="Data tersimpan otomatis di browser ini">
              <Save size={16} />
              {savedAt || "Siap disimpan"}
            </span>
          </div>
        </header>

        <section className="editor-grid">
          <div className="editor-panel">
            {/* ── Assignment header form ── */}
            <div className="form-grid">
              {/* No. is now a read-only badge */}
              <div>
                <p className="eyebrow" style={{ marginBottom: 8 }}>
                  No.
                </p>
                <span className="read-only-badge">No. {activeAssignment.no}</span>
              </div>
              <label>
                ID PKPT
                <input
                  type="number"
                  value={activeAssignment.pkptId}
                  onChange={(e) =>
                    updateActive({ ...activeAssignment, pkptId: Number(e.target.value) })
                  }
                />
              </label>
              <label>
                Jenis
                <select
                  value={activeAssignment.assignmentType}
                  onChange={(e) => {
                    const nextType = e.target.value as AssignmentType;
                    updateActive({
                      ...activeAssignment,
                      assignmentType: nextType,
                      members: activeAssignment.members.map((m) => ({
                        ...m,
                        assignmentType: nextType,
                      })),
                    });
                  }}
                >
                  <option value="DL">DL</option>
                  <option value="DLDK">DLDK</option>
                </select>
              </label>
              <label>
                Target Workbook
                <input
                  type="number"
                  value={activeAssignment.expectedTotal}
                  onChange={(e) =>
                    updateActive({
                      ...activeAssignment,
                      expectedTotal: Number(e.target.value),
                    })
                  }
                />
              </label>
              <label className="full-span">
                Uraian Penugasan
                <textarea
                  value={activeAssignment.description}
                  onChange={(e) =>
                    updateActive({ ...activeAssignment, description: e.target.value })
                  }
                />
              </label>
            </div>

            {/* ── Team section header ── */}
            <div className="table-header">
              <div>
                <h3>Susunan Tim</h3>
                <p>{activeAssignment.members.length} anggota</p>
              </div>
              <button className="secondary-action" type="button" onClick={addMember}>
                <Plus size={16} />
                Anggota
              </button>
            </div>

            {/* ── Member cards ── */}
            <div className="member-cards">
              {activeAssignment.members.map((member, index) => {
                const computed = activeComputed?.members[index];
                const rawName = nameDrafts[index] ?? member.employeeName;
                const isNameValid = validEmployeeNames.has(rawName);
                const isOverrideOpen = openOverrides.has(index);

                return (
                  <div
                    key={index}
                    className={isNameValid ? "member-card" : "member-card locked"}
                  >
                    {/* Card header: name | grade | total | remove */}
                    <div className="member-card-header">
                      <div className="member-name-wrap">
                        <input
                          className={
                            isNameValid ? "member-name-input" : "member-name-input invalid"
                          }
                          list="employee-list"
                          placeholder="Nama pegawai..."
                          value={rawName}
                          onChange={(e) => handleNameChange(index, e.target.value)}
                        />
                        {!isNameValid && (
                          <span className="field-error">
                            Nama tidak ditemukan dalam daftar pegawai
                          </span>
                        )}
                      </div>
                      <span className={isNameValid ? "grade-pill" : "grade-pill invalid"}>
                        {computed?.grade || "–"}
                      </span>
                      <strong className="member-total">
                        {formatCurrency(computed?.cost.total ?? 0)}
                      </strong>
                      <button
                        className="icon-button subtle"
                        type="button"
                        onClick={() => removeMember(index)}
                        title="Hapus anggota"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                    {/* Card body: province | city | start | end | hp | isi-hp */}
                    <div className="member-card-body">
                      <label>
                        Provinsi
                        <input
                          list="province-list"
                          placeholder="Pilih provinsi..."
                          value={member.province}
                          className={validProvinceNames.has(member.province) ? "" : "invalid"}
                          onChange={(e) => updateMember(index, { province: e.target.value })}
                        />
                      </label>
                      <label>
                        Lokus
                        <input
                          placeholder="Kab/Kota..."
                          value={member.city}
                          onChange={(e) => updateMember(index, { city: e.target.value })}
                        />
                      </label>
                      <label>
                        Mulai
                        <input
                          type="date"
                          value={member.startDate}
                          onChange={(e) =>
                            updateMember(index, { startDate: e.target.value })
                          }
                        />
                      </label>
                      <label>
                        Selesai
                        <input
                          type="date"
                          value={member.endDate}
                          onChange={(e) =>
                            updateMember(index, { endDate: e.target.value })
                          }
                        />
                      </label>
                      <label>
                        HP
                        <input
                          type="number"
                          min={1}
                          value={member.hp}
                          onChange={(e) =>
                            updateMember(index, { hp: Number(e.target.value) })
                          }
                        />
                      </label>
                      {/* Isi HP lives in the card body, next to HP */}
                      <div style={{ display: "flex", alignItems: "flex-end" }}>
                        <button
                          className="secondary-action compact"
                          type="button"
                          title="Isi HP dari selisih tanggal"
                          onClick={() => {
                            const hp = daysInclusive(member.startDate, member.endDate);
                            updateMember(index, { hp: Math.max(hp, 0) });
                          }}
                        >
                          Isi HP
                        </button>
                      </div>
                    </div>

                    {/* Override toggle */}
                    <button
                      className={isOverrideOpen ? "override-toggle open" : "override-toggle"}
                      type="button"
                      onClick={() => toggleOverride(index)}
                    >
                      <span className="override-toggle-icon">›</span>
                      Override biaya
                    </button>

                    {/* Override panel — hidden by default */}
                    <div className={isOverrideOpen ? "override-panel open" : "override-panel"}>
                      {costFields.map(({ field, label }) => (
                        <label key={field}>
                          {label}
                          <input
                            type="number"
                            placeholder={formatCurrency(computed?.cost[field] ?? 0)}
                            value={
                              member.manualCosts?.[field] ??
                              (field === "transport" ? (member.manualTransport ?? "") : "")
                            }
                            onChange={(e) => updateManualCost(index, field, e.target.value)}
                          />
                        </label>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── Summary panel ── */}
          <aside className="summary-panel">
            <div className="summary-card strong">
              <p>Total Penugasan</p>
              <strong>{formatCurrency(activeComputed?.totals.total ?? 0)}</strong>
              <span>Target: {formatCurrency(activeAssignment.expectedTotal)}</span>
            </div>

            <div className="summary-list">
              <CostLine label="Uang Harian" value={activeComputed?.totals.dailyAllowance ?? 0} />
              <CostLine label="Penginapan" value={activeComputed?.totals.lodging ?? 0} />
              <CostLine label="Transport" value={activeComputed?.totals.transport ?? 0} />
              <CostLine label="Dll." value={activeComputed?.totals.other ?? 0} />
            </div>

            <div className="warnings">
              <h3>
                <AlertTriangle size={18} />
                Pemeriksaan
              </h3>
              {activeComputed?.warnings.length || scheduleConflicts.length ? (
                [...(activeComputed?.warnings ?? []), ...scheduleConflicts].map((w) => (
                  <p key={w}>{w}</p>
                ))
              ) : (
                <p className="clean-state">Contoh ini cocok dengan workbook.</p>
              )}
            </div>

            <div className="notes">
              <h3>
                <CalendarDays size={18} />
                Catatan Modul
              </h3>
              <p>Data tersimpan otomatis di browser lokal.</p>
              <p>Kolom override kosong berarti memakai formula workbook.</p>
            </div>
          </aside>
        </section>
      </section>
    </>
  );
}

function CostLine({ label, value }: { label: string; value: number }) {
  return (
    <div className="cost-line">
      <span>{label}</span>
      <strong>{formatCurrency(value)}</strong>
    </div>
  );
}
