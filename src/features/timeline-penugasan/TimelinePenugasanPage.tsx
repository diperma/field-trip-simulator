import { AlertTriangle } from "lucide-react";
import type { TimelineModel, TimelineRow } from "./timelineEngine";

type TimelinePenugasanPageProps = {
  timeline: TimelineModel;
};

// Color palette for assignment markers, keyed by assignment number (1-indexed).
// Colors are darkened so white text stays readable.
const MARKER_COLORS: Record<number, string> = {
  1: "#b8930f", // amber (brand, darkened)
  2: "#2e6db5", // blue
  3: "#2e8a5a", // green
  4: "#b55220", // orange
  5: "#7040b5", // purple
  6: "#1a8ab5", // cyan
  7: "#b5306a", // pink
  8: "#4ab530", // lime
};

function markerColor(marker: string): string {
  const num = parseInt(marker, 10);
  return MARKER_COLORS[((num - 1) % 8) + 1] ?? MARKER_COLORS[1];
}

type MonthGroup = { label: string; count: number; monthIndex: number };

function groupDatesByMonth(dates: string[]): MonthGroup[] {
  const groups: MonthGroup[] = [];
  let current: MonthGroup | null = null;
  for (const date of dates) {
    const d = new Date(`${date}T00:00:00`);
    const monthIndex = d.getMonth();
    const label = new Intl.DateTimeFormat("id-ID", { month: "short", year: "2-digit" }).format(d);
    if (current && current.monthIndex === monthIndex) {
      current.count++;
    } else {
      current = { label, count: 1, monthIndex };
      groups.push(current);
    }
  }
  return groups;
}

function isWeekend(dateStr: string): boolean {
  const day = new Date(`${dateStr}T00:00:00`).getDay();
  return day === 0 || day === 6;
}

function monthLabel(date: string): string {
  return new Intl.DateTimeFormat("id-ID", { month: "short" }).format(
    new Date(`${date}T00:00:00`),
  );
}

export function TimelinePenugasanPage({ timeline }: TimelinePenugasanPageProps) {
  const monthGroups = groupDatesByMonth(timeline.dates);

  return (
    <section className="workspace single-column">
      <header className="topbar">
        <div>
          <p className="eyebrow">Timeline Penugasan Tw II</p>
          <h2>Kalender Penugasan dan Beban Pegawai</h2>
        </div>
      </header>

      {!!timeline.warnings.length && (
        <div className="timeline-warning">
          <AlertTriangle size={18} />
          <span>{timeline.warnings.length} perbedaan HP dan marker perlu dicek.</span>
        </div>
      )}

      <TimelineSection
        title="Penugasan"
        dates={timeline.dates}
        rows={timeline.assignmentRows}
        monthGroups={monthGroups}
      />
      <TimelineSection
        title="Pegawai"
        dates={timeline.dates}
        rows={timeline.employeeRows}
        monthGroups={monthGroups}
      />
    </section>
  );
}

function TimelineSection({
  title,
  dates,
  rows,
  monthGroups,
}: {
  title: string;
  dates: string[];
  rows: TimelineRow[];
  monthGroups: MonthGroup[];
}) {
  return (
    <section className="timeline-panel">
      <div className="timeline-title">
        <h3>{title}</h3>
        <p>{rows.length} baris</p>
      </div>
      <div className="timeline-scroll">
        <div
          className="timeline-grid"
          style={{ gridTemplateColumns: `220px 60px repeat(${dates.length}, 34px)` }}
        >
          {/* ── Row 1: Month band ── */}
          {/* Empty cells for Name and HP columns */}
          <div className="timeline-sticky timeline-head-cell" style={{ minHeight: 26 }} />
          <div className="timeline-head-cell" style={{ minHeight: 26 }} />
          {/* Month band cells — each spans its day count */}
          {monthGroups.map((group, i) => (
            <div
              key={i}
              className={`timeline-month-band timeline-month-${group.monthIndex}`}
              style={{ gridColumn: `span ${group.count}` }}
            >
              {group.label}
            </div>
          ))}

          {/* ── Row 2: Day headers ── */}
          <div className="timeline-sticky timeline-head-cell">Nama</div>
          <div className="timeline-head-cell">HP</div>
          {dates.map((date) => (
            <div
              className={`timeline-head-cell day-head${isWeekend(date) ? " weekend" : ""}`}
              key={date}
            >
              <span>{new Date(`${date}T00:00:00`).getDate()}</span>
              <small>{monthLabel(date)}</small>
            </div>
          ))}

          {/* ── Data rows ── */}
          {rows.map((row) => (
            <TimelineDataRow dates={dates} key={row.id} row={row} />
          ))}
        </div>
      </div>
    </section>
  );
}

function TimelineDataRow({ dates, row }: { dates: string[]; row: TimelineRow }) {
  return (
    <>
      <div className="timeline-sticky timeline-label" title={row.detail}>
        <strong>{row.label}</strong>
        <small>{row.detail}</small>
      </div>
      <div className={row.hp === row.expectedHp ? "timeline-hp" : "timeline-hp warning"}>
        {row.hp}
      </div>
      {dates.map((date, index) => {
        const cell = row.cells[index];
        return (
          <div
            className={[
              "timeline-cell",
              cell.hasConflict ? "conflict" : "",
              isWeekend(date) ? "weekend" : "",
            ]
              .filter(Boolean)
              .join(" ")}
            key={`${row.id}-${date}`}
          >
            {cell.markers.map((marker) => (
              <span
                key={`${date}-${marker}`}
                style={{ backgroundColor: markerColor(marker) }}
              >
                {marker}
              </span>
            ))}
          </div>
        );
      })}
    </>
  );
}
