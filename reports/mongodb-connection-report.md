# MongoDB Connection Report

Date: 2026-05-20

## Summary

The app is not yet reliably using MongoDB as the durable database in production.

MongoDB Atlas is reachable from this workspace and the `field-trip-simulator` database currently contains two `assignments` documents:

- No. 1, ID PKPT `130483`
- No. 2, ID PKPT `129905`

However, the deployed Vercel API at `https://field-trip-simulator.vercel.app/api/db-status` reports:

- `storageType`: `Local JSON File`
- `dbName`: `local-backup-db.json`

That means the production backend is falling back to temporary server-side file storage instead of writing to MongoDB Atlas. On Vercel serverless functions, this local file is not a safe durable database. It can reset or disappear between function instances and deployments.

## User-Visible Symptom

When assignments are deleted and the page is refreshed, the app can appear to return to the beginning workbook seed data.

There are three likely reasons in the current code:

1. Production API fallback is active.
   The Vercel API says it is saving to `local-backup-db.json`, not MongoDB. This is the biggest issue.

2. Empty MongoDB collections were automatically seeded.
   This has now been removed from `api/index.js`. Empty MongoDB state should remain empty after refresh.

3. The GitHub Pages frontend does not have a fixed production API base URL.
   The app reads the backend URL from browser local storage (`field-trip-simulator.api-url`). If that value is missing, it calls `/api/assignments` on the current website origin. On GitHub Pages, that path is not the Vercel API, so the app falls back to browser/local seed behavior.

## Evidence Checked

- Direct MongoDB Atlas connection from local workspace: successful.
- MongoDB database name: `field-trip-simulator`.
- MongoDB assignment document count: `2`.
- Vercel API status endpoint: reachable, but reports `Local JSON File`.
- GitHub Pages `/api/db-status`: not a valid API route for this app.
- Local repo has one modified file: `api/index.js`.

## Code Findings

### `api/index.js`

The backend contains a MongoDB model and CRUD endpoints, but it also has a local-file fallback path.

Important behavior:

- `GET /api/db-status` reports whether the API is using MongoDB or fallback storage.
- `GET /api/assignments` now returns the actual database rows and does not auto-seed when there are no assignment records.
- `POST /api/assignments` with an array deletes all records and inserts the posted array.
- The reset seed API route has been removed from `api/index.js`.

Risk:

- If MongoDB connection fails on Vercel, writes go to `local-backup-db.json`.
- If MongoDB is empty, the seed examples are recreated automatically.

### `src/App.tsx`

The frontend stores assignments in browser local storage and also tries to sync to the backend.

Important behavior:

- The app starts from browser local storage or `seedAssignments`.
- It fetches `/api/assignments` after boot.
- It only replaces local state from the backend when returned data is a non-empty array.
- It stores the API URL in browser local storage instead of build-time configuration.

Risk:

- If the backend returns an empty array, the frontend may keep old local data.
- If the GitHub Pages browser does not have the Vercel API URL saved, it will not talk to Vercel.

### `src/features/planning/DatabasePage.tsx`

The Database page lets the user enter a Vercel backend URL and stores it in browser local storage.

Risk:

- Saving the URL here updates local storage but does not update the `apiUrl` state owned by `App.tsx` until refresh.
- This makes the connection status page and the main app sync behavior easier to desynchronize.

### `api/seed-db.js`

This utility can seed MongoDB Atlas manually.

Risk:

- Running it intentionally deletes all assignment records and restores the two workbook examples.

## Security Finding

The MongoDB connection string is currently hardcoded in source files. This should be treated as a credential leak risk.

Required action:

- Rotate the MongoDB database user password.
- Remove the hardcoded default URI from source code.
- Store `MONGODB_URI` only in environment variables, especially in Vercel project settings.

## Recommended Fix Plan

1. Set `MONGODB_URI` in Vercel environment variables.
   Use the MongoDB Atlas URI for the `field-trip-simulator` database. Redeploy after saving the variable.

2. Remove the default hardcoded MongoDB URI from `api/index.js` and `api/seed-db.js`.
   The API should fail clearly if `MONGODB_URI` is missing instead of silently using a secret in source code.

3. Remove production local-file fallback.
   In production, failed MongoDB connection should return an error. Local JSON fallback is acceptable only for local development.

4. Stop auto-seeding on ordinary `GET /api/assignments`.
   Implemented. Deleted data should not reappear simply because the collection is empty.

5. Add a fixed frontend API base URL for production.
   Implemented. Production builds default to `https://field-trip-simulator.vercel.app`, with `VITE_API_BASE_URL` and the browser local-storage override available when needed.

6. Make empty assignment arrays valid state.
   The frontend should accept `[]` from the backend and render "Belum ada penugasan" after refresh, instead of preserving old seed data.

7. Add database persistence tests or manual checks:
   - Delete all assignments.
   - Refresh GitHub Pages.
   - Confirm the app still shows "Belum ada penugasan".
   - Confirm MongoDB `assignments` count is `0`.
   - Add one assignment.
   - Refresh again.
   - Confirm MongoDB and UI both show the same assignment.

## Immediate Interpretation

The repository is connected to GitHub, Vercel, and MongoDB at the infrastructure level, but the running production API was not persisting assignment edits to MongoDB during this check. The code has been adjusted so production must use `MONGODB_URI` successfully, and the fallback/auto-seed/reset paths that hid connection failures have been removed.
