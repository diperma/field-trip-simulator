import {
  AlertTriangle,
  CheckCircle2,
  Database,
  Download,
  FileSpreadsheet,
  Play,
  RefreshCw,
  Server,
  Upload,
} from "lucide-react";
import { useEffect, useState } from "react";
import type { AssignmentInput } from "../../domain/assignment";
import { employees } from "../../data/employees";
import { provinceRates } from "../../data/rates";

type DatabasePageProps = {
  apiUrl: string;
  assignments: AssignmentInput[];
  onApiUrlChange: (apiUrl: string) => void;
  onAssignmentsChange: (assignments: AssignmentInput[]) => void;
};

type DbStatus = {
  status: string;
  storageType: string;
  details: string;
  dbName: string;
  uri: string;
};

const API_URL_KEY = "field-trip-simulator.api-url";

export function DatabasePage({
  apiUrl,
  assignments,
  onApiUrlChange,
  onAssignmentsChange,
}: DatabasePageProps) {

  // DB Connection Info
  const [dbInfo, setDbInfo] = useState<DbStatus | null>(null);
  const [dbLoading, setDbLoading] = useState(false);
  const [pingLatency, setPingLatency] = useState<number | null>(null);
  const [pingStatus, setPingStatus] = useState<"idle" | "testing" | "success" | "error">("idle");
  const [pingError, setPingError] = useState("");

  // Raw JSON Editor CRUD Workaround
  const [jsonText, setJsonText] = useState("");
  const [jsonStatus, setJsonStatus] = useState<{ type: "success" | "error" | "idle"; message: string }>({
    type: "idle",
    message: "",
  });

  // Sync JSON editor when assignments state changes from database
  useEffect(() => {
    setJsonText(JSON.stringify(assignments, null, 2));
  }, [assignments]);

  // Fetch db status on load
  useEffect(() => {
    fetchDbStatus();
  }, [apiUrl]);

  async function fetchDbStatus() {
    setDbLoading(true);
    const start = performance.now();
    try {
      const base = apiUrl ? apiUrl.replace(/\/$/, "") : "";
      const res = await fetch(`${base}/api/db-status`);
      if (!res.ok) throw new Error("HTTP error " + res.status);
      const data = await res.json();
      const end = performance.now();
      setDbInfo(data);
      setPingLatency(Math.round(end - start));
      setPingStatus("success");
    } catch (err: any) {
      setDbInfo(null);
      setPingStatus("error");
      setPingError(err.message || "Gagal menghubungi server");
    } finally {
      setDbLoading(false);
    }
  }

  // Save Vercel API URL configuration
  function handleSaveApiUrl(url: string) {
    const trimmed = url.trim().replace(/\/$/, "");
    onApiUrlChange(trimmed);
    if (trimmed) {
      window.localStorage.setItem(API_URL_KEY, trimmed);
    } else {
      window.localStorage.removeItem(API_URL_KEY);
    }
    setPingStatus("idle");
  }

  // Live validation of raw JSON input
  function handleJsonChange(text: string) {
    setJsonText(text);
    if (!text.trim()) {
      setJsonStatus({ type: "idle", message: "" });
      return;
    }
    try {
      const parsed = JSON.parse(text);
      if (!Array.isArray(parsed)) {
        setJsonStatus({ type: "error", message: "JSON harus berupa array [] dari assignment." });
        return;
      }
      // Basic check of object fields
      const isValid = parsed.every((a, idx) => {
        return typeof a === "object" && a !== null && "no" in a;
      });
      if (!isValid) {
        setJsonStatus({
          type: "error",
          message: "Setiap objek assignment harus memiliki field 'no' (nomor assignment).",
        });
        return;
      }
      setJsonStatus({ type: "success", message: "Struktur JSON valid! Siap disimpan ke database." });
    } catch (e: any) {
      setJsonStatus({ type: "error", message: "Kesalahan Sintaks JSON: " + e.message });
    }
  }

  // Save the raw JSON data back to database (Bulk update CRUD workaround)
  async function handleApplyJson() {
    try {
      const parsed = JSON.parse(jsonText);
      const base = apiUrl ? apiUrl.replace(/\/$/, "") : "";
      const res = await fetch(`${base}/api/assignments/replace?confirm=replace-assignments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed),
      });
      if (!res.ok) throw new Error("Gagal menyimpan data ke database server.");
      const nextData = await res.json();
      onAssignmentsChange(nextData);
      setJsonStatus({ type: "success", message: "Database berhasil diperbarui dengan Raw JSON!" });
    } catch (err: any) {
      setJsonStatus({ type: "error", message: "Gagal menyimpan: " + err.message });
    }
  }

  // File Upload Database Restore Handler
  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);
        if (!Array.isArray(parsed)) {
          alert("Gagal mengimpor: File harus berisi array [] data assignment.");
          return;
        }

        const base = apiUrl ? apiUrl.replace(/\/$/, "") : "";
        const res = await fetch(`${base}/api/assignments/replace?confirm=replace-assignments`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(parsed),
        });

        if (!res.ok) throw new Error("Gagal menyimpan impor ke server database.");
        const nextData = await res.json();
        onAssignmentsChange(nextData);
        alert("Database berhasil dipulihkan dari cadangan!");
      } catch (err: any) {
        alert("Gagal mengimpor cadangan database: " + err.message);
      }
    };
    reader.readAsText(file);
  }

  // Download DB Backup as JSON file
  function handleDownloadJson() {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(assignments, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `field-trip-assignments-db-${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  }

  // Export Flattened Table as Excel-Ready CSV
  function handleExportCsv() {
    // Generate Flat Columns for spreadsheet comparison
    const headers = [
      "No Assignment",
      "ID PKPT",
      "Uraian Penugasan",
      "Nama Pegawai",
      "Golongan",
      "Jenis Perjalanan",
      "Lokus Provinsi",
      "Lokus Kab/Kota",
      "Tanggal Mulai",
      "Tanggal Selesai",
      "Hari Penugasan (HP)",
      "Uang Harian",
      "Penginapan",
      "Transport",
      "Dll",
      "Total Person",
    ];

    const rows = [headers];

    assignments.forEach((a) => {
      a.members.forEach((m) => {
        const row = [
          a.no.toString(),
          a.pkptId.toString(),
          a.description.replace(/"/g, '""'),
          m.employeeName,
          employees.find((e) => e.name === m.employeeName)?.grade || "-",
          m.assignmentType,
          m.province,
          m.city,
          m.startDate,
          m.endDate,
          m.hp.toString(),
          m.manualCosts?.dailyAllowance ? m.manualCosts.dailyAllowance.toString() : "Formula",
          m.manualCosts?.lodging ? m.manualCosts.lodging.toString() : "Formula",
          m.manualCosts?.transport ? m.manualCosts.transport.toString() : m.manualTransport ? m.manualTransport.toString() : "Formula",
          m.manualCosts?.other ? m.manualCosts.other.toString() : "Formula",
          "" // Will compute sum dynamically in excel
        ];
        rows.push(row);
      });
    });

    const csvContent =
      "data:text/csv;charset=utf-8," +
      rows.map((e) => e.map((val) => `"${val.replace(/"/g, '""')}"`).join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `rencana_penugasan_flat_excel_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  }

  return (
    <section className="workspace single-column">
      <header className="topbar">
        <div>
          <p className="eyebrow">Data & Integrasi</p>
          <h2>Pusat Kontrol Database & Cloud Deployment</h2>
        </div>
      </header>

      {/* ── Section 1: Server Config & Dynamic Vercel Settings ── */}
      <section className="dashboard-panel database-settings-panel">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div>
            <h3>🔌 API Cloud Deployment Settings</h3>
            <p>Konfigurasikan endpoint Vercel agar static page di GitHub Pages terhubung ke database cloud.</p>
          </div>
          {pingStatus === "success" && (
            <div className="status-badge ok" style={{ animation: "pulse 2s infinite" }}>
              <span className="dot online"></span>
              Server Online ({pingLatency}ms)
            </div>
          )}
          {pingStatus === "error" && (
            <div className="status-badge warning">
              <span className="dot offline"></span>
              Server Offline
            </div>
          )}
        </div>

        <div className="api-config-grid">
          <label style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            Vercel Backend URL
            <div style={{ display: "flex", gap: 10 }}>
              <input
                type="text"
                className="database-api-input"
                placeholder="https://field-trip-simulator.vercel.app (Kosongkan untuk localhost)"
                value={apiUrl}
                onChange={(e) => handleSaveApiUrl(e.target.value)}
                style={{ flex: 1 }}
              />
              <button
                type="button"
                className="secondary-action compact"
                onClick={fetchDbStatus}
                disabled={dbLoading}
                style={{ display: "flex", alignItems: "center", gap: 6 }}
              >
                <RefreshCw size={14} className={dbLoading ? "spinner" : ""} />
                Test Ping
              </button>
            </div>
          </label>
        </div>

        {pingStatus === "error" && (
          <div className="warning-banner" style={{ marginTop: 15 }}>
            <AlertTriangle size={18} />
            <div>
              <strong>Koneksi Gagal:</strong> {pingError}. Data belum tersambung ke MongoDB sampai endpoint API sehat.
            </div>
          </div>
        )}

        {pingStatus === "success" && dbInfo && (
          <div className="success-banner" style={{ marginTop: 15 }}>
            <CheckCircle2 size={18} />
            <div>
              <strong>Koneksi Tersambung!</strong> Menyimpan ke **{dbInfo.storageType}** | Database: <code>{dbInfo.dbName}</code>.
            </div>
          </div>
        )}
      </section>

      {/* ── Section 2: Databases Overview & Metrics ── */}
      <section className="metric-grid" style={{ marginBottom: 30 }}>
        {/* DB 1: Assignments */}
        <div className="metric-card database-card">
          <div className="db-card-header">
            <span><Database size={18} /></span>
            <span className="db-badge writeable">READ/WRITE</span>
          </div>
          <p>Assignments DB</p>
          <strong>{assignments.length} Dokumen</strong>
          <small>Tabel: <code>field-trip-simulator.assignments</code></small>
        </div>

        {/* DB 2: Employees */}
        <div className="metric-card database-card">
          <div className="db-card-header">
            <span><Server size={18} /></span>
            <span className="db-badge readonly">READ ONLY</span>
          </div>
          <p>Employees Master</p>
          <strong>{employees.length} Pegawai</strong>
          <small>Tabel: <code>Daftar Pegawai D302</code></small>
        </div>

        {/* DB 3: SBM Rates */}
        <div className="metric-card database-card">
          <div className="db-card-header">
            <span><Server size={18} /></span>
            <span className="db-badge readonly">READ ONLY</span>
          </div>
          <p>SBM Rate Matrix</p>
          <strong>{provinceRates.length} Provinsi</strong>
          <small>Tabel: <code>SBM TA 2026</code></small>
        </div>
      </section>

      {/* ── Section 3: Data Operations & Backup/Restore ── */}
      <section className="dashboard-panel" style={{ marginBottom: 30 }}>
        <h3>Ekspor & Impor Database</h3>
        <p>Gunakan operasi di bawah ini untuk mencadangkan data Anda atau menyalin data rencana penugasan ke Excel.</p>

        <div className="db-actions-grid" style={{ display: "flex", gap: 15, flexWrap: "wrap", marginTop: 20 }}>
          {/* Export JSON */}
          <button
            type="button"
            className="secondary-action"
            onClick={handleDownloadJson}
            style={{ display: "flex", alignItems: "center", gap: 8 }}
          >
            <Download size={16} />
            Unduh JSON Backup
          </button>

          {/* Export Excel CSV */}
          <button
            type="button"
            className="primary-action"
            onClick={handleExportCsv}
            style={{ display: "flex", alignItems: "center", gap: 8 }}
          >
            <FileSpreadsheet size={16} />
            Ekspor Flat CSV (Excel)
          </button>

          {/* Import JSON */}
          <label className="secondary-action file-upload-label" style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
            <Upload size={16} />
            Unggah JSON Backup
            <input
              type="file"
              accept=".json"
              onChange={handleFileUpload}
              style={{ display: "none" }}
            />
          </label>
        </div>
      </section>

      {/* ── Section 4: Live JSON CRUD Workaround Editor ── */}
      <section className="dashboard-panel raw-editor-section">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 15 }}>
          <div>
            <h3>✍️ CRUD Raw JSON Editor (Workaround Escape Hatch)</h3>
            <p>Butuh edit batch atau bypass validasi form? Sunting isi database assignments dalam format NoSQL JSON langsung di bawah.</p>
          </div>
          <button
            type="button"
            className="primary-action"
            onClick={handleApplyJson}
            disabled={jsonStatus.type === "error" || !jsonText.trim()}
            style={{ display: "flex", alignItems: "center", gap: 8 }}
          >
            <Play size={16} />
            Simpan Raw JSON ke DB
          </button>
        </div>

        {jsonStatus.message && (
          <div className={`json-alert ${jsonStatus.type}`} style={{ marginBottom: 15 }}>
            {jsonStatus.type === "success" ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
            <span>{jsonStatus.message}</span>
          </div>
        )}

        <div className="editor-wrapper">
          <textarea
            className="raw-json-textarea"
            spellCheck={false}
            value={jsonText}
            onChange={(e) => handleJsonChange(e.target.value)}
          />
        </div>
      </section>
    </section>
  );
}
