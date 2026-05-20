# Database Reset Incident Report

Date: 2026-05-20

## Summary

The production MongoDB `assignments` collection was being overwritten during normal website refreshes. The issue was not caused by Git itself resetting the database. It was caused by frontend synchronization behavior that could write browser-local state back into MongoDB during page boot.

The most dangerous path was:

1. Website opens or refreshes.
2. React initializes assignment state from browser `localStorage` or seed defaults before the backend fetch finishes.
3. The app fetches `/api/assignments` from the Vercel API.
4. If MongoDB is empty, slow, or returns a different state, the app can briefly hold:
   - backend snapshot: MongoDB data, possibly `[]`
   - current UI state: old browser cache or blank local assignments
5. The autosave effect sees a difference and writes the browser-local assignments to MongoDB.

This made refresh behave like a restore-from-local-cache operation.

## Production Evidence

Checked endpoint:

```text
https://field-trip-simulator.vercel.app/api/db-status
```

Observed result:

```json
{
  "status": "connected",
  "storageType": "MongoDB Atlas Cloud",
  "dbName": "field-trip-simulator"
}
```

This confirms production is connected to MongoDB Atlas, not local JSON fallback.

Checked endpoint:

```text
https://field-trip-simulator.vercel.app/api/assignments
```

Observed during investigation:

```json
[]
```

After another refresh/client write, the collection contained blank assignment records with current timestamps, proving that a frontend client was still capable of writing local blank state into MongoDB.

## Root Causes

### Root Cause 1: Autosave Ran From Browser State

The app initialized from:

```text
localStorage key: field-trip-simulator.assignments.v1
```

Then it synced changes automatically. That is acceptable for local-only use, but risky when MongoDB is the durable source of truth.

### Root Cause 2: Bulk Replace Endpoint Was Too Easy To Trigger

The old API behavior accepted an array on:

```text
POST /api/assignments
```

and handled it by deleting all records and inserting the posted array.

That made stale browser data dangerous because a single request could replace the whole collection.

This was already changed in the previous fix:

```text
POST /api/assignments
```

now rejects array payloads.

### Root Cause 3: Diff Sync Still Had A Hydration Race

The first fix changed sync from full replacement to per-assignment `PUT`/`DELETE`, but a refresh could still race:

```text
backend snapshot = []
browser-local state = cached assignments
```

The diff sync could then create or update records from browser-local data even though the user had not edited anything during that session.

### Root Cause 4: Stale Open Tabs And Cached Bundles Could Still Write

Even after deploying safer frontend code, an already-open tab or cached bundle could continue calling old write endpoints.

GitHub Pages also caches static assets. A browser may keep running older JavaScript until the page is fully refreshed and the cache expires.

## Fixes Applied

### Fix 1: Autosave Requires A Real User Edit

The app now tracks whether the user actually changed assignments in the current session.

Backend synchronization is blocked unless all are true:

```text
initial backend load finished
backend snapshot exists
user edited data after backend load
```

This prevents refresh-only writes.

### Fix 2: Hydration Writes Are Not Marked Dirty

When `/api/assignments` loads from MongoDB, the app updates state directly without marking it as a user edit.

Only UI-driven assignment changes call the dirty-tracking wrapper.

### Fix 3: Write Safety Header Required

All write routes now require:

```text
X-Assignment-Client: field-trip-simulator-v2
```

Protected routes:

```text
POST /api/assignments
PUT /api/assignments/:no
DELETE /api/assignments/:no
POST /api/assignments/replace?confirm=replace-assignments
```

If an old browser tab or stale cached bundle tries to write without this header, the API returns:

```text
428 Precondition Required
```

This is the main protection against stale clients.

### Fix 4: Full Replace Is Explicit Only

Full database replacement remains possible only through:

```text
POST /api/assignments/replace?confirm=replace-assignments
```

This is used only by the Database page raw JSON restore/import tools.

Normal editing no longer uses full replacement.

### Fix 5: Workbook Seed Reset Button Removed

The Rencana page no longer has the “restore workbook examples” action. That removes an accidental path that could restore seed examples into the live database.

## Future Push Checklist

Before and after every deployment:

1. Confirm API is using MongoDB:

```bash
curl https://field-trip-simulator.vercel.app/api/db-status
```

Expected:

```text
storageType: MongoDB Atlas Cloud
```

2. Confirm assignment count before refresh:

```bash
curl https://field-trip-simulator.vercel.app/api/assignments
```

3. Refresh the website once.

4. Confirm assignment count again:

```bash
curl https://field-trip-simulator.vercel.app/api/assignments
```

The records must not change unless a user edited data.

5. Test stale-client protection:

```bash
curl -X PUT https://field-trip-simulator.vercel.app/api/assignments/999 \
  -H "Content-Type: application/json" \
  -d "{\"no\":999,\"members\":[]}"
```

Expected:

```text
428 Precondition Required
```

6. Test current-client write behavior only from the app UI or with the safety header.

## Operational Notes

- Do not use `api/seed-db.js` against production unless intentionally replacing production data.
- Do not reintroduce ordinary auto-seeding on `GET /api/assignments`.
- Do not allow `POST /api/assignments` to accept arrays.
- Do not let browser `localStorage` become the source of truth for production.
- MongoDB Atlas is the durable source of truth. Browser cache is only a display fallback.

## Remaining Recommendation

Add server-side audit logging for writes:

```text
route
assignment no
operation
timestamp
client header
origin
user agent
```

That would make future incidents traceable to a specific browser/client version.
