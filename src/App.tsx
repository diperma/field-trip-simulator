import { BarChart3, CalendarDays, ClipboardList, Database } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { employees } from "./data/employees";
import { provinceRates } from "./data/rates";
import { seedAssignments } from "./data/seedAssignments";
import type { AssignmentInput, AssignmentComputed } from "./domain/assignment";
import { DashboardPage } from "./features/dashboard/DashboardPage";
import { buildPlanningDashboard } from "./features/planning/planningSelectors";
import { RencanaPenugasanPage } from "./features/rencana-penugasan/RencanaPenugasanPage";
import { TimelinePenugasanPage } from "./features/timeline-penugasan/TimelinePenugasanPage";
import { buildTimeline } from "./features/timeline-penugasan/timelineEngine";
import { calculateAssignment } from "./engine/costCalculator";
import { DatabasePage } from "./features/planning/DatabasePage";

type AppModule = "rencana" | "dashboard" | "timeline" | "database";

const STORAGE_KEY = "field-trip-simulator.assignments.v1";

function formatDateLocal(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function getTimelineRange(assignments: AssignmentComputed[]) {
  let minDate: string | null = null;
  let maxDate: string | null = null;

  for (const assignment of assignments) {
    for (const member of assignment.members) {
      if (member.startDate) {
        if (!minDate || member.startDate < minDate) minDate = member.startDate;
      }
      if (member.endDate) {
        if (!maxDate || member.endDate > maxDate) maxDate = member.endDate;
      }
    }
  }

  const today = new Date();
  const defaultStart = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-01`;
  const endOfNext = new Date(today.getFullYear(), today.getMonth() + 2, 0);
  const defaultEnd = formatDateLocal(endOfNext);

  if (!minDate || !maxDate) {
    return { start: defaultStart, end: defaultEnd };
  }

  const minParts = minDate.split("-");
  const maxParts = maxDate.split("-");
  const start = `${minParts[0]}-${String(minParts[1]).padStart(2, "0")}-01`;

  const lastDay = new Date(parseInt(maxParts[0], 10), parseInt(maxParts[1], 10), 0);
  const end = formatDateLocal(lastDay);

  return { start, end };
}

export function App() {
  const [activeModule, setActiveModule] = useState<AppModule>("dashboard");
  const [assignments, setAssignments] = useState<AssignmentInput[]>(loadAssignments);
  const [activeNo, setActiveNo] = useState(assignments[0]?.no ?? 0);
  const [savedAt, setSavedAt] = useState("");

  // Backend Vercel Endpoint Configuration State
  const [apiUrl, setApiUrl] = useState(() => {
    return window.localStorage.getItem("field-trip-simulator.api-url") || "";
  });

  // Track if we are currently performing initial backend fetch to prevent sync race conditions
  const [isHydrating, setIsHydrating] = useState(true);

  // Load from database backend on boot & when API URL changes
  useEffect(() => {
    let active = true;
    async function loadFromBackend() {
      setIsHydrating(true);
      try {
        const base = apiUrl ? apiUrl.replace(/\/$/, "") : "";
        const res = await fetch(`${base}/api/assignments`);
        if (!res.ok) throw new Error("HTTP error " + res.status);
        const data = await res.json();
        if (active && Array.isArray(data) && data.length > 0) {
          setAssignments(data);
          // Set activeNo if not already pointing to a valid one
          if (!data.some((a) => a.no === activeNo)) {
            setActiveNo(data[0].no);
          }
        }
      } catch (err) {
        console.warn("⚠️ Gagal mengambil data dari server API, menggunakan fallback cache browser:", err);
      } finally {
        if (active) setIsHydrating(false);
      }
    }
    loadFromBackend();
    return () => {
      active = false;
    };
  }, [apiUrl]);

  // Compute computed lists and selector rollups
  const computedAssignments = useMemo(
    () => assignments.map((assignment) => calculateAssignment(assignment, employees, provinceRates)),
    [assignments],
  );
  const dashboard = useMemo(
    () => buildPlanningDashboard(computedAssignments, employees),
    [computedAssignments],
  );
  const { start, end } = useMemo(() => getTimelineRange(computedAssignments), [computedAssignments]);
  const timeline = useMemo(
    () => buildTimeline(computedAssignments, start, end),
    [computedAssignments, start, end],
  );

  // Sync state to local storage AND database backend upon changes
  useEffect(() => {
    // Save to client browser cache instantly
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(assignments));
    
    setSavedAt(
      new Intl.DateTimeFormat("id-ID", {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      }).format(new Date()),
    );

    // Sync to backend DB (Only if we aren't currently loading the state from DB on start)
    if (!isHydrating) {
      const timer = setTimeout(async () => {
        try {
          const base = apiUrl ? apiUrl.replace(/\/$/, "") : "";
          const res = await fetch(`${base}/api/assignments`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(assignments),
          });
          if (!res.ok) throw new Error("Sync HTTP error " + res.status);
        } catch (err) {
          console.warn("⚠️ Sinkronisasi database backend tertunda:", err);
        }
      }, 500); // 500ms debounce to prevent spamming server on rapid keystrokes

      return () => clearTimeout(timer);
    }
  }, [assignments, apiUrl, isHydrating]);

  // Reset database endpoint triggers Mongoose seed reload
  async function handleResetSeeds() {
    try {
      const base = apiUrl ? apiUrl.replace(/\/$/, "") : "";
      const res = await fetch(`${base}/api/assignments/seed`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Seed failed " + res.status);
      const data = await res.json();
      setAssignments(data);
      if (data[0]) {
        setActiveNo(data[0].no);
      }
    } catch (err) {
      console.error("Gagal menyetel ulang database seed:", err);
      // Fallback local reset
      setAssignments(seedAssignments);
      setActiveNo(seedAssignments[0].no);
    }
  }

  function openAssignment(assignmentNo: number) {
    setActiveNo(assignmentNo);
    setActiveModule("rencana");
  }

  return (
    <main className={activeModule === "rencana" ? "app-shell" : "app-shell app-shell-wide"}>
      {/* Nav order: Dashboard → Timeline → Rencana → Database */}
      <nav className="module-nav" aria-label="Modul simulator">
        <button
          className={activeModule === "dashboard" ? "module-tab active" : "module-tab"}
          type="button"
          onClick={() => setActiveModule("dashboard")}
        >
          <BarChart3 size={17} />
          Dashboard
        </button>
        <button
          className={activeModule === "timeline" ? "module-tab active" : "module-tab"}
          type="button"
          onClick={() => setActiveModule("timeline")}
        >
          <CalendarDays size={17} />
          Timeline
        </button>
        <button
          className={activeModule === "rencana" ? "module-tab active" : "module-tab"}
          type="button"
          onClick={() => setActiveModule("rencana")}
        >
          <ClipboardList size={17} />
          Rencana
        </button>
        <button
          className={activeModule === "database" ? "module-tab active" : "module-tab"}
          type="button"
          onClick={() => setActiveModule("database")}
        >
          <Database size={17} />
          Database
        </button>
      </nav>

      {activeModule === "dashboard" && (
        <DashboardPage
          computedAssignments={computedAssignments}
          dashboard={dashboard}
          onOpenAssignment={openAssignment}
        />
      )}
      {activeModule === "timeline" && <TimelinePenugasanPage timeline={timeline} />}
      {activeModule === "rencana" && (
        <RencanaPenugasanPage
          activeNo={activeNo}
          assignments={assignments}
          computedAssignments={computedAssignments}
          savedAt={savedAt}
          onActiveNoChange={setActiveNo}
          onAssignmentsChange={setAssignments}
        />
      )}
      {activeModule === "database" && (
        <DatabasePage
          assignments={assignments}
          onAssignmentsChange={setAssignments}
          onResetSeeds={handleResetSeeds}
        />
      )}
    </main>
  );
}

function loadAssignments(): AssignmentInput[] {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : seedAssignments;
  } catch {
    return seedAssignments;
  }
}
