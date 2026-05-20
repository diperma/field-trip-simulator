# AGENTS.md

## Project Mission

Recreate the logic behind **Rencana Penugasan** as a local **field-trip-simulator** for BPKP-style assignment planning:

- pick or enter PKPT/penugasan items,
- assign staff into teams,
- place assignments on the calendar,
- calculate travel-duty cost components,
- map planned cost to MAK/RO budget lines,
- reconcile planned spending against remaining budget.

In this project, "field trip" means official assignment/travel-duty simulation, not a school trip simulator.

## Current Build Focus

Build the local web app module for **Rencana Penugasan Tw II** first. This module now exists as a working React/Vite app with three local modules: editable Rencana Penugasan, dashboard totals, and Timeline Penugasan Tw II. The active development focus remains assignment entry, cost calculation, timeline consistency, and lightweight validation until the planning workflow feels solid.

Scope for the first module:

- CRUD-style editing for assignment blocks.
- Team member selection from `Daftar Pegawai D302`.
- Grade lookup from employee master data.
- `DL` / `DLDK` selection.
- Province and city/lokus entry.
- Start date, end date, and HP handling.
- Cost calculation for `Uang Harian`, `Penginapan`, `Transport`, `Dll.`, and `Total`.
- Assignment subtotal matching the spreadsheet format.
- Manual override support for `Uang Harian`, `Penginapan`, `Transport`, and `Dll.` cost cells.
- Validation warnings for missing rates, missing grades, date/HP mismatch, and staff schedule conflicts.
- Local autosave in browser storage.
- Dashboard totals per assignment/submission.
- Timeline marker generation for assignment rows and employee rows.

Out of scope for the first module:

- Full budget dashboard recreation.
- Full `Rekap Anggaran` UI.
- Google Sheets write-back.
- Authentication and multi-user collaboration.

## Local Web App Prerequisites

The web app has been scaffolded.

Current stack:

- Node.js runtime
- Vite
- React
- TypeScript
- Vitest
- `lucide-react`
- Local TypeScript seed data copied from the workbook
- Deterministic calculation functions with unit tests

Current project structure:

```text
package.json
vite.config.js
vitest.config.js
tsconfig.json
index.html
src/
  data/
    employees.ts
    rates.ts
    seedAssignments.ts
  domain/
    assignment.ts
    employee.ts
    rates.ts
  engine/
    costCalculator.ts
    validators.ts
  features/
    dashboard/
      DashboardPage.tsx
    planning/
      planningSelectors.ts
      planningSelectors.test.ts
    rencana-penugasan/
      RencanaPenugasanPage.tsx
    timeline-penugasan/
      TimelinePenugasanPage.tsx
      timelineEngine.ts
      timelineEngine.test.ts
  App.tsx
  main.tsx
  styles.css
```

Implemented source datasets:

- Employee list from `Daftar Pegawai D302`.
- Province rates from `SBM TA 2026`.
- Two seed assignment examples from `Rencana Penugasan Tw II`.

Implemented acceptance target:

- Assignment `1`, ID PKPT `130483`, total `41.546.000`.
- Assignment `2`, ID PKPT `129905`, total `19.917.000`.

Run commands:

```bash
npm install
npm test
npm run build
npm run dev
```

The dev server is configured for:

`http://127.0.0.1:5174/`

Verification already performed:

- `npm test`: `4` tests passed.
- `npm run build`: production build succeeded.
- Browser smoke check confirmed the app rendered locally with the Rencana Penugasan TW II UI, Dashboard totals, Timeline Penugasan markers, and matching seed totals.

Tooling note:

- `package.json` scripts use `--configLoader runner` for Vite/Vitest because the default config bundler hit a Windows parent-folder access issue in this workspace.

## Implemented App Behavior

The current local app implements the first working slice of `Rencana Penugasan Tw II` plus dashboard and timeline modules:

- Assignment list for the two seed assignments.
- Module navigation:
  - `Rencana`
  - `Dashboard`
  - `Timeline`
- Local browser autosave of assignment edits.
- Assignment CRUD:
  - create blank assignment
  - duplicate active assignment
  - delete active assignment
  - reset to workbook seed examples
- Editable assignment header:
  - `No.`
  - `ID PKPT`
  - `Jenis` (`DL` or `DLDK`)
  - workbook target total
  - assignment description
- Editable team table:
  - employee dropdown
  - automatic grade display
  - province dropdown
  - city/lokus field
  - start and end date fields
  - `HP`
  - HP auto-fill from inclusive start/end date count
  - computed per-person total
  - explicit manual override inputs for `Uang Harian`, `Penginapan`, `Transport`, and `Dll.`
- Summary panel:
  - assignment total
  - workbook target
  - `Uang Harian`
  - `Penginapan`
  - `Transport`
  - `Dll.`
  - validation messages
- Dashboard module:
  - total assignment count
  - team row count
  - total planned spending
  - schedule conflict count
  - row-level totals for each submission/assignment
  - workbook target difference per assignment
- Timeline module:
  - TW II daily calendar grid from April through early July
  - assignment rows with markers such as `1a` and `2a`
  - employee rows with the same assignment markers
  - `a` marker suffix for `DL`
  - `b` marker suffix for `DLDK`
  - HP/marker mismatch warnings

Important implementation detail:

- Assignment 2 still uses manual `Transport` overrides of `2.827.000` per person, matching the workbook. The current model also supports manual overrides for all four cost cells via `manualCosts`.

## App File Map

- `src/data/employees.ts`: staff seed data from `Daftar Pegawai D302`.
- `src/data/rates.ts`: province rate seed data from `SBM TA 2026`.
- `src/data/seedAssignments.ts`: two seeded `Rencana Penugasan Tw II` examples.
- `src/domain/assignment.ts`: assignment, member, and cost types.
- `src/domain/employee.ts`: employee type and grade grouping helper.
- `src/domain/rates.ts`: province rate type.
- `src/engine/costCalculator.ts`: spreadsheet-equivalent cost formulas.
- `src/engine/validators.ts`: lightweight schedule/date validation helpers.
- `src/engine/costCalculator.test.ts`: anchor tests for Assignment 1 and 2.
- `src/features/dashboard/DashboardPage.tsx`: dashboard totals by submission/assignment.
- `src/features/planning/planningSelectors.ts`: shared rollups used by dashboard and app shell.
- `src/features/planning/planningSelectors.test.ts`: tests for dashboard totals and workbook target differences.
- `src/features/rencana-penugasan/RencanaPenugasanPage.tsx`: editable Rencana Penugasan module UI.
- `src/features/timeline-penugasan/TimelinePenugasanPage.tsx`: Timeline Penugasan Tw II UI.
- `src/features/timeline-penugasan/timelineEngine.ts`: deterministic marker generation for assignment and employee rows.
- `src/features/timeline-penugasan/timelineEngine.test.ts`: tests for marker codes and employee timeline rows.
- `src/App.tsx`: module navigation, shared assignment state, local persistence, and computed selectors.
- `src/styles.css`: app styling.

## Next App Steps

Recommended next implementation order:

1. Split `RencanaPenugasanPage.tsx` into smaller components when the next edit touches the table or summary area:
   - `AssignmentList`
   - `AssignmentHeaderForm`
   - `TeamMemberTable`
   - `CostSummary`
2. Add PKPT lookup from `Daftar PKPT D302` for `pkptId`, `bidwas`, RO, and MAK mapping.
3. Add `jenis_kegiatan`, `jenis_belanja`, `status`, and MAK fields to assignment data.
4. Add budget mapping after the Rencana Penugasan module is stable:
   - planned total by MAK
   - available saldo by MAK
   - overspend warnings
5. Add import/export for local JSON fixtures so planner edits can move between browser sessions.
6. Improve Timeline UI with month grouping, active assignment filtering, and conflict-focused views.

## Source Workbook

Original organization file:

`https://docs.google.com/spreadsheets/d/1GtnefMWQoAsVtr_xb-AFRj5lW_ggGOjLFhbIEVLMFps/edit?gid=2108967951#gid=2108967951`

Shared working copy:

`https://docs.google.com/spreadsheets/d/1onwE1gOSqY2GhFPK2W_3cypQY95awwYS/edit?usp=sharing&ouid=116222367081066365314&rtpof=true&sd=true`

Native Google Sheets working copy:

`https://docs.google.com/spreadsheets/d/17uV-9_xyLSfLaTS61oCQYpr1GZoTYRAtv90FqIgMheE/edit?usp=sharing`

Use the native copy above as the current source of truth. The spreadsheet is readable through the Google Sheets connector, including formulas, validations, and sheet IDs.

## Observed Workbook Shape

Confirmed workbook metadata:

- Title: `Tim KDKMP_Mapping Anggaran D302 TA 2026`
- Locale: `en_US`
- Time zone: `America/Los_Angeles`

Confirmed tabs and sheet IDs:

- `Rekap Anggaran` (`sheetId`: `479247827`)
- `Rincian Anggaran D302` (`sheetId`: `206583896`)
- `Rencana Penugasan Tw II` (`sheetId`: `1715736999`)
- `Timeline Penugasan Tw II` (`sheetId`: `1933981767`)
- `Anggaran PKPT D302` (`sheetId`: `238352999`)
- `Daftar PKPT D302` (`sheetId`: `1876484749`)
- `Daftar Pegawai D302` (`sheetId`: `1072756624`)
- `SBM TA 2026` (`sheetId`: `1771642099`)

The workbook combines four planning layers:

1. Budget summary by RO.
2. Detailed MAK budget and realization.
3. Assignment plan with staff, dates, locations, and travel cost.
4. Timeline/load view by assignment and by employee.

## Key Tables Learned So Far

### Rekap Anggaran

Purpose: summarize budget by RO code.

Observed columns:

- `No`
- `Kode RO`
- `Pagu Awal`
- `Sisa Saldo`
- `Pagu Setelah Revisi`
- `Selisih`

Observed totals:

- Total pagu awal: `4.283.070.000`
- Total sisa saldo: `2.467.886.632`
- Persentase penyerapan: `42,38%`
- Persentase sisa anggaran: `57,62%`

Representative RO codes:

- `FAG.00.001.401`
- `FAG.00.002.401`
- `FAG.00.003.401`
- `FAG.00.005.401`
- `UAG.00.004.401`
- `FAG.51.001.401`
- `FAG.51.002.401`
- `FAG.51.003.401`
- `FAG.51.005.401`
- `UAG.51.004.401`

### Rincian Anggaran D302

Purpose: detail each MAK line and track budget usage.

Observed columns:

- `No.`
- `MAK`
- `Jenis Belanja`
- `Pagu Awal`
- `CS Outstanding`
- `Realisasi Pencairan CS`
- `Sisa Saldo Existing`
- `Rencana Penggunaan Anggaran`
- `Sisa Saldo Setelah Mapping Penugasan`
- `Usulan Revisi`
- `Pagu Setelah Revisi`
- `Sisa Saldo Revisi`

Observed account code mapping:

- `524113` = `Belanja Perjalanan Dinas Dalam Kota`
- `521211` = `Belanja Bahan`
- `524111` = `Belanja Perjalanan Dinas Biasa`
- `522151` = `Belanja Jasa Profesi`
- `521811` = `Belanja Persediaan Barang Konsumsi`

Observed activity code mapping:

- `P` = `Perencanaan`
- `B` = `Pelaksanaan`
- `Q` = `Pelaporan`
- `R` = `Monitoring TL`

Observed planning section in this tab:

- `Penugasan`
- `Bidang Pengawasan`
- `PKPT Distribusi`
- `Jenis Kegiatan`
- `Jenis Belanja`
- `MAK`
- `Rencana Anggaran`
- `Status`
- `Realisasi Pencairan SPJ`

Example planned rows:

- ID PKPT `130483`, Pelaksanaan, `FAG.51.005.401.B.524111`, rencana anggaran `41.546.000`, status `Pengajuan`.
- ID PKPT `129905`, Pelaksanaan, `FAG.51.002.401.B.524111`, rencana anggaran `19.917.000`, status `Pengajuan`.

### Rencana Penugasan Tw II

Purpose: final assignment plan with team composition and detailed travel cost.

Observed layout:

- Each assignment starts with an `ID` row and a long assignment description.
- Then a `Susunan Tim` table lists every assigned employee.
- Each staff row includes grade, assignment type, location, dates, HP, cost components, and total.
- A `Total` row sums cost components for the assignment.

Observed columns:

- `Susunan Tim`
- `Gol.`
- `Jenis Penugasan`
- `Lokus Provinsi`
- `Lokus Kab/Kota` or `Lokus`
- `Tanggal Mulai`
- `Tanggal Selesai`
- `HP`
- `Uang Harian`
- `Penginapan`
- `Transport`
- `Dll.`
- `Total`

Example assignment 1:

- ID PKPT: `130483`
- Type: `DL`
- Planned amount: `41.546.000`
- Lokus: Jawa Timur, Malang
- Staff:
  - Iman Kadarman, `IV/b`, 3 HP, total `7.750.000`
  - Shinta Wayansari, `IV/c`, 4 HP, total `9.394.000`
  - Nurul Syahroni, `III/d`, 4 HP, total `8.134.000`
  - Yoga Parasdya, `III/b`, 4 HP, total `8.134.000`
  - Andi Muhammad Fauzan Mulawarman, `II/d`, 4 HP, total `8.134.000`
- Total cost: `41.546.000`

Example assignment 2:

- ID PKPT: `129905`
- Type: `DL`
- Planned amount: `19.917.000`
- Lokus: Kep. Bangka Belitung, Pangkal Pinang
- Staff:
  - Willy Hutabarat, `III/c`, 4 HP, total `6.639.000`
  - Miftha Adelina Mayesti, `III/b`, 4 HP, total `6.639.000`
  - Wisnu Cahya Adi Wibowo, `III/b`, 4 HP, total `6.639.000`
- Total cost: `19.917.000`

### Timeline Penugasan Tw II

Purpose: show assignment timing and staff load on a daily calendar.

Observed layout:

- Month/day columns for April, May, June, and early July.
- First section: rows per assignment, with day cells marked like `1a` or `2a`.
- Second section: rows per employee, with the same assignment markers on assigned days.
- `HP` column counts hari penugasan per assignment or employee.

Observed legend:

- `a` = `DL`
- `b` = `DLDK`

Observed notes:

- `Waktu penugasan bergantung pada jadwal PJ`

### Anggaran PKPT D302

Purpose: budget plan and availability per PKPT item.

Observed columns:

- `No.`
- `ID PKPT`
- `Uraian PKPT`
- `Bidwas`
- `Triwulan RMP` with I/II/III/IV flags
- `Triwulan RPL` with I/II/III/IV flags
- `MAK`
- `Anggaran`
- `Realisasi`
- `Sisa Saldo`
- `Kebutuhan Anggaran`

Observed logic:

- PKPT rows can have child budget rows such as `DL`, `DLDK`, `DL (Pelaksanaan)`, `DLDK (Pelaksanaan)`, and `DLDK (MonTL)`.
- The workbook tracks planned budget, realization, remaining saldo, and future need by PKPT/MAK.

### Daftar PKPT D302

Purpose: master list of PKPT items and their available quarter/activity mapping.

Observed columns:

- `No.`
- `ID PKPT`
- `Uraian PKPT`
- `Bidwas`
- `Triwulan RMP` I/II/III/IV
- `Triwulan RPL` I/II/III/IV
- `MAK`

Observed flags:

- Quarter availability is represented by `TRUE` values.
- Some rows have status markers such as `v`, `x`, or `realisasi`.

### Staff Master

Purpose: list employees and grades for team selection and rate lookup.

Observed columns:

- `No.`
- `Nama Pegawai`
- `NIP`
- `Gol.`

Observed role-like grade labels at the top:

- `Eselon II` = `Es.2`
- `Korwas` = `IV`
- `Pengendali Teknis` = `IV`
- `Ketua Tim` = `III`
- `Anggota Tim` = `II/III`

### SBM / Rate Table

Purpose: provide travel cost assumptions by province and grade group.

Observed columns:

- `Provinsi`
- `Uang Harian`
- `Biaya Penginapan`
- `Es. I`
- `Es. II`
- `Gol. IV`
- `Gol. III/II`
- `Transport`
- `Taksi PP`

Example rates:

- Jawa Timur: uang harian `410.000`, penginapan Gol. IV `1.234.000`, Gol. III/II `814.000`, transport `3.062.000`, taksi PP `490.000`.
- Kep. Bangka Belitung: uang harian `410.000`, penginapan Gol. IV `1.957.000`, Gol. III/II `724.000`, transport `2.319.000`, taksi PP `526.000`.

## Confirmed Spreadsheet Logic

### Rencana Penugasan Formulas

Representative formulas from `Rencana Penugasan Tw II`:

- Assignment header type: `=D5`
- Assignment header budget: `=N10`
- Staff grade: `=vlookup(B5,'Daftar Pegawai D302'!$C$2:$E$41,3,0)`
- Uang harian: `=IF(D5="DL",vlookup(E5,'SBM TA 2026'!$C$3:$D$40,2,0)*I5,210000*I5)`
- Penginapan: `(HP - 1) * lodging_rate`, only when `Jenis Penugasan` is `DL`; lodging rate is selected from `SBM TA 2026` by province and grade group.
- Transport formula for normal DL rows: `=IF(D5="DL",vlookup(E5,'SBM TA 2026'!$C$3:$J$40,7,0)+vlookup(E5,'SBM TA 2026'!$C$3:$J$40,8,0)+500000,170000*I5)`
- Dll.: `=IFERROR(IF(C5="Es.2",150000*I5,0),0)`
- Person total: `=SUM(J5:M5)`
- Assignment subtotal: `=SUM(N5:N9)`

Validated dropdowns:

- `Susunan Tim` is constrained to role placeholders plus names from `Daftar Pegawai D302`.
- `Jenis Penugasan` is constrained to `DL` or `DLDK`.
- `Lokus Provinsi` is constrained to province names from the SBM/rate table.

### Rincian Anggaran Formulas

Representative formulas from `Rincian Anggaran D302`:

- Baseline total: `=sum(E3:E13)`
- ABT total: `=sum(E15:E43)`
- Jenis belanja lookup: `=vlookup(right(C3,6),$O$1:$P$6,2,0)`
- Sisa saldo existing: `=E3-F3-G3`
- Rencana penggunaan anggaran: `=sumif(text(H$48:H$119),C3,I$48:I$119)`
- Sisa saldo setelah mapping: `=H3-I3`
- Pagu setelah revisi: `=E3+K3`
- Sisa saldo revisi: `=L3-(F3+G3+I3)`

Planning rows in the lower section are formula-driven:

- Penugasan: `=vlookup(B48,'Rencana Penugasan Tw II'!$A$3:$N$996,2,0)`
- Bidang pengawasan: lookup from `Daftar PKPT D302`
- PKPT distribusi: lookup from `Rencana Penugasan Tw II`
- Jenis belanja: derived from `DL` or `DLDK`
- MAK: concatenates RO from `Daftar PKPT D302`, activity code, and account code.
- Rencana anggaran: lookup from `Rencana Penugasan Tw II`

Validated dropdowns:

- `Jenis Kegiatan`: `Perencanaan`, `Pelaksanaan`, `Pelaporan`, `Monitoring TL`
- `Jenis Belanja`: `Belanja Perjalanan Dinas Dalam Kota`, `Belanja Bahan`, `Belanja Perjalanan Dinas Biasa`, `Belanja Jasa Profesi`, `Belanja Persediaan Barang Konsumsi`
- `Status`: `Pengajuan`, `Proses SPJ`, `Pencairan`

### Timeline Formulas

Representative formulas from `Timeline Penugasan Tw II`:

- Assignment HP: `=COUNTA(E3:CM3)`
- Employee HP: `=COUNTA(E34:CM34)`

The timeline grid itself is manually marked with codes:

- `1a`, `2a`, etc. where the number is the assignment number.
- `a` = `DL`
- `b` = `DLDK`

The assignment section and employee section must stay consistent: each marker entered on an assignment date row should also appear on every assigned employee's date row.

## Confirmed Cost Logic From Examples

The rencana penugasan total is the sum of per-person cost:

`person_total = uang_harian + penginapan + transport + dll`

The workbook uses:

- `uang_harian = HP * daily_rate_by_province`
- `penginapan = (HP - 1) * lodging_rate_by_province_and_grade_group` for `DL`
- `uang_harian = 210000 * HP` for `DLDK`
- `transport = 170000 * HP` for `DLDK`
- `transport = transport_rate + taksi_pp + 500000` for formula-driven `DL` rows
- `transport` can be manually overridden in some rows, as seen in assignment 2
- `dll = 150000 * HP` only for `Es.2`; otherwise `0`
- `assignment_total = sum(person_total for all team members)`

Example: Malang/Jawa Timur, 4 HP, Gol. III/II:

- Uang harian: `4 * 410.000 = 1.640.000`
- Penginapan: observed `2.442.000`, equivalent to `3 * 814.000`
- Transport: observed `4.052.000`, equivalent to `3.062.000 + 2 * 490.000`
- Total: `1.640.000 + 2.442.000 + 4.052.000 = 8.134.000`

Example: Pangkal Pinang/Kep. Bangka Belitung, 4 HP, Gol. III/II:

- Uang harian: `4 * 410.000 = 1.640.000`
- Penginapan: observed `2.172.000`, equivalent to `3 * 724.000`
- Transport: observed `2.827.000`; this cell is hardcoded, not formula-driven, so the simulator must allow manual transport override.
- Total: `6.639.000`

## Candidate Domain Model

### `PkptItem`

- `pkpt_id`
- `uraian`
- `bidwas`
- `mak_ro`
- `rmp_quarters`
- `rpl_quarters`
- `status_flag`

### `BudgetLine`

- `mak`
- `ro_code`
- `activity_code`
- `account_code`
- `jenis_kegiatan`
- `jenis_belanja`
- `pagu_awal`
- `realisasi`
- `sisa_saldo`
- `rencana_penggunaan`
- `pagu_setelah_revisi`
- `sisa_saldo_revisi`

### `Employee`

- `name`
- `nip`
- `golongan`
- `role_group`

### `Rate`

- `province`
- `uang_harian`
- `lodging_es_i`
- `lodging_es_ii`
- `lodging_gol_iv`
- `lodging_gol_iii_ii`
- `transport`
- `taksi_pp`

### `Assignment`

- `assignment_no`
- `pkpt_id`
- `description`
- `bidwas`
- `jenis_kegiatan`
- `jenis_penugasan`
- `jenis_belanja`
- `mak`
- `province`
- `city`
- `start_date`
- `end_date`
- `hp`
- `status`
- `team_members`
- `planned_budget`

### `AssignmentMember`

- `employee_name`
- `golongan`
- `role`
- `hp`
- `daily_allowance`
- `lodging`
- `transport`
- `other_cost`
- `total`

## Simulator Logic

Build the simulator around deterministic spreadsheet-equivalent calculations:

1. Load PKPT master data.
2. Load budget lines by MAK/RO/activity/account.
3. Load employees and province rates.
4. Select PKPT items for the quarter.
5. For each planned assignment:
   - choose `jenis_penugasan` (`DL` or `DLDK`),
   - choose province/city,
   - choose start/end dates,
   - assign staff,
   - calculate HP per person,
   - calculate per-person travel cost,
   - sum assignment total,
   - map the total to the chosen MAK line.
6. Render timeline markers:
   - assignment row marker: `<assignment_no>a` for DL or `<assignment_no>b` for DLDK,
   - employee row markers for each assigned staff member and date.
7. Recalculate budget:
   - `rencana_penggunaan_anggaran = sum(assignment totals by MAK)`
   - `sisa_saldo_setelah_mapping = sisa_saldo_existing - rencana_penggunaan_anggaran`
   - `sisa_saldo_revisi = pagu_setelah_revisi - realisasi - rencana_penggunaan_anggaran`
8. Flag conflicts:
   - staff date overlap,
   - assignment outside selected quarter,
   - missing province/rate,
   - missing employee grade,
   - planned cost greater than budget saldo,
   - MAK does not match PKPT/activity/type,
   - timeline marker count does not match HP.

## Numeric Checks To Preserve

Every implementation should expose these checks:

- `assignment_total = sum(member.total)`
- `member.total = uang_harian + penginapan + transport + dll`
- `uang_harian = hp * province.daily_rate`
- `penginapan = lodging_nights * lodging_rate_for_grade`
- `budget_remaining_after_mapping = existing_remaining - planned_usage`
- `ro_total = sum(child_mak_lines)`
- `timeline_hp = count(marked_days)`
- `employee_hp = count(employee_marked_days)`
- `assignment_marker_days = assignment_hp`
- `planned_budget_by_mak <= available_budget_by_mak`

## Implementation Notes

Prefer a small, auditable engine:

- `inputs/` for workbook exports or manually curated CSV fixtures.
- `src/domain/` for PKPT, budget, employee, rate, and assignment entities.
- `src/engine/` for travel-cost, timeline, and budget-reconciliation logic.
- `src/reports/` for recreating the four important workbook views.
- `tests/` for known examples from assignment 1 and 2.

Use spreadsheet terms in model names or mapping comments. The goal is traceability: a planner should be able to compare simulator output with the workbook row by row.

## First Test Cases

### Test Case 1: ID PKPT 130483

Expected:

- Assignment total: `41.546.000`
- Team size: `5`
- Province: `Jawa Timur`
- City: `Malang`
- Marker: `1a`
- MAK: `FAG.51.005.401.B.524111`

### Test Case 2: ID PKPT 129905

Expected:

- Assignment total: `19.917.000`
- Team size: `3`
- Province: `Kep. Bangka Belitung`
- City: `Pangkal Pinang`
- Marker: `2a`
- MAK: `FAG.51.002.401.B.524111`

## Open Questions

- Should `HP` in `Rencana Penugasan Tw II` be calculated from dates in the simulator, manually entered, or both?
- Should the simulator reproduce the manual transport override behavior, or flag it as an exception?
- How are `v`, `x`, and `realisasi` flags interpreted in `Daftar PKPT D302`?
- Can one employee hold overlapping assignments if one is DLDK?
- Should budget use `Sisa Saldo Existing` or `Sisa Saldo Revisi` as the hard constraint?

## Best Next Step

Start implementation with a small engine that reproduces assignment 1 and assignment 2 exactly, including:

1. Staff grade lookup from `Daftar Pegawai D302`.
2. Province rate lookup from `SBM TA 2026`.
3. DL cost formulas and manual transport override support.
4. Timeline marker count checks.
5. MAK/budget mapping using the same RO/activity/account concatenation logic.
