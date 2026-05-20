import { BarChart3, CalendarDays, ClipboardList, Database } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
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
const API_URL_KEY = "field-trip-simulator.api-url";
const DEFAULT_API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ??
  (import.meta.env.DEV ? "" : "https://field-trip-simulator.vercel.app");

function getApiBaseUrl(): string {
  return (window.localStorage.getItem(API_URL_KEY) || DEFAULT_API_BASE_URL).replace(/\/$/, "");
}

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
    return getApiBaseUrl();
  });

  // Track if we are currently performing initial backend fetch to prevent sync race conditions
  const [isHydrating, setIsHydrating] = useState(true);
  const backendSnapshotRef = useRef<AssignmentInput[] | null>(null);

  // Load from database backend on boot & when API URL changes
  useEffect(() => {
    let active = true;
    async function loadFromBackend() {
      setIsHydrating(true);
      try {
        const res = await fetch(`${apiUrl}/api/assignments`);
        if (!res.ok) throw new Error("HTTP error " + res.status);
        const data = await res.json();
        if (active && Array.isArray(data)) {
          backendSnapshotRef.current = data;
          setAssignments(data);
          // Set activeNo if not already pointing to a valid one
          if (!data.some((a) => a.no === activeNo)) {
            setActiveNo(data[0]?.no ?? 0);
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

    if (isHydrating || !backendSnapshotRef.current) return;

    const previous = backendSnapshotRef.current;
    const timer = setTimeout(async () => {
      try {
        await syncAssignmentChanges(apiUrl, previous, assignments);
        backendSnapshotRef.current = assignments;
      } catch (err) {
        console.warn("⚠️ Sinkronisasi database backend tertunda:", err);
      }
    }, 500); // 500ms debounce to prevent spamming server on rapid keystrokes

    return () => clearTimeout(timer);
  }, [assignments, apiUrl, isHydrating]);

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
          apiUrl={apiUrl}
          assignments={assignments}
          onApiUrlChange={setApiUrl}
          onAssignmentsChange={setAssignments}
        />
      )}
    </main>
  );
}

function comparableAssignment(assignment: AssignmentInput): AssignmentInput {
  const { _id, __v, createdAt, updatedAt, ...editable } = assignment as AssignmentInput & {
    _id?: string;
    __v?: number;
    createdAt?: string;
    updatedAt?: string;
  };
  return editable;
}

async function syncAssignmentChanges(
  apiUrl: string,
  previousAssignments: AssignmentInput[],
  nextAssignments: AssignmentInput[],
) {
  const previousByNo = new Map(previousAssignments.map((assignment) => [assignment.no, comparableAssignment(assignment)]));
  const nextByNo = new Map(nextAssignments.map((assignment) => [assignment.no, comparableAssignment(assignment)]));

  const requests: Promise<Response>[] = [];

  for (const [no, next] of nextByNo.entries()) {
    const previous = previousByNo.get(no);
    if (JSON.stringify(previous) !== JSON.stringify(next)) {
      requests.push(
        fetch(`${apiUrl}/api/assignments/${no}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(next),
        }),
      );
    }
  }

  for (const no of previousByNo.keys()) {
    if (!nextByNo.has(no)) {
      requests.push(fetch(`${apiUrl}/api/assignments/${no}`, { method: "DELETE" }));
    }
  }

  if (requests.length === 0) return;

  const responses = await Promise.all(requests);
  const failed = responses.find((res) => !res.ok);
  if (failed) {
    throw new Error(`Sync HTTP error ${failed.status}`);
  }
}

function loadAssignments(): AssignmentInput[] {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : seedAssignments;
  } catch {
    return seedAssignments;
  }
}
