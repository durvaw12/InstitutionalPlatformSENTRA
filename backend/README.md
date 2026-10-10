# Sentra backend

Node.js + Express + native MongoDB driver (no Mongoose) + Cloudinary + Multer memory storage + bcryptjs + JWT.

## Run it

```bash
cd backend
cp .env.example .env          # fill MONGODB_URI, JWT_SECRET, CLOUDINARY_*, ADMIN_*
npm install
npm run seed:admin            # optional: also runs automatically on start unless SEED_ADMIN_ON_START=false
npm run dev                   # or: npm start
```

`seed:admin` creates one administrator from `ADMIN_NAME / ADMIN_EMAIL / ADMIN_PASSWORD` only if no administrator exists.
It never promotes an existing account and never prints the password. Default Awareness Hub content is seeded on first start
(`npm run seed:resources` runs it by hand; it does nothing if resources already exist).

Frontend dev server (port 3000) -> add to `vite.config.js`:
`server: { port: 3000, proxy: { '/api': 'http://localhost:5000' } }` and call `/api/...` with `Authorization: Bearer <token>`.

## Conventions

- Success: `{ success: true, ... }`. Error: `{ success: false, message, field?, errors? }` (`field` names the input to highlight, like the frontend's `FieldError`).
- Every user object has `_id` and `id`; `passwordHash` is never returned.
- `:id` params must be 24-hex ObjectIds (400 otherwise). `:referenceId` must look like `INC-2026-0001`.
- Reports are opened by `referenceId` in the UI; all mutations use the Mongo `_id`.

## API

| Method | Path | Access | Notes |
|---|---|---|---|
| POST | /api/auth/register | public | student/staff only; `role: "administrator"` -> 403 |
| POST | /api/auth/login | public | role comes from the DB; inactive -> 403 |
| GET | /api/auth/me | any | |
| PATCH | /api/auth/profile | any | `name, department, phone` |
| PATCH | /api/auth/email | any | `email, password` |
| PATCH | /api/auth/password | any | `currentPassword, newPassword` |
| GET | /api/users | admin | `?role &isActive &q &assignable=true`; each user has `openCases` |
| GET | /api/users/:id | admin or self | |
| POST | /api/users | admin | only API route that can create an administrator |
| PATCH | /api/users/:id | admin | `name, department, phone, role` (not your own role) |
| PATCH | /api/users/:id/status | admin | `{ isActive }` (not yourself) |
| DELETE | /api/users/:id | admin | unassigns their cases, keeps reports they filed |
| POST | /api/incidents | student, staff | multipart: `category, location, description, occurredAt, isAnonymous\|anonymous`, files in `attachments` (<=5) or `attachment` |
| GET | /api/incidents | admin | `?status &priority &category &assignee(id\|none) &assignedDepartment &open=1 &q &sort(updated\|oldest\|newest\|priority) &page &limit` |
| GET | /api/incidents/my | any | `reporterId === me` (same filters). Anonymous reports never appear |
| GET | /api/incidents/assigned | staff, admin | `assignedTo === me` (same filters) |
| GET | /api/incidents/reference/:referenceId | any | owner/assignee/admin: full report. Others: status-only view, anonymous reports only, else 404 |
| GET | /api/incidents/:id | owner, assignee, admin | others get 404 |
| PATCH | /api/incidents/:id/status | admin, assigned staff | `{ status?, note?, isInternal? }`; Resolved needs a public note |
| PATCH | /api/incidents/:id/assignment | admin | `{ assignedTo?, assignedDepartment? }` |
| PATCH | /api/incidents/:id/details | admin | `{ priority?, category? }` |
| DELETE | /api/incidents/:id | admin | removes responses, notifications, Cloudinary files |
| POST | /api/incidents/:id/responses | admin, assigned staff | `{ message, type?, isInternal? }`; `resolution` also sets status Resolved |
| GET | /api/incidents/:id/responses | owner, assignee, admin | internal notes hidden from the reporter |
| GET | /api/notifications | any | own only; `?unread=true`; returns `unreadCount` |
| PATCH | /api/notifications/:id/read | any | own only |
| PATCH | /api/notifications/read-all | any | |
| GET | /api/dashboard/admin | admin | `?days=30`; stats, by category/status/priority, timeline, reports per reporter, recent |
| GET | /api/reports/departments | admin | total/pending/inReview/resolved/critical per `assignedDepartment` |
| GET | /api/reports/departments/:department | admin | same, one department |
| GET | /api/resources | any | Awareness Hub; `?kind &q` |
| POST | /api/resources | admin | `{ kind, title, body, phone? }` |
| DELETE | /api/resources/:id | admin | |

## Frontend files that need changes

The frontend never calls an API: `src/store/AppStore.jsx` keeps everything in localStorage. Replace that store with an API client
(token in memory/sessionStorage, fetch on mount and after each action) and update:

| File | Change |
|---|---|
| src/store/AppStore.jsx | Rewrite as API client. Remove localStorage db, salts/hashes, `ADMIN_CODE`, local permission helpers. Map: `active`->`isActive`, `id`->`referenceId`/`_id`, `anonymous`->`isAnonymous`, `assigneeId/Name`->`assignedTo`/`assignee.name`, `department`->`assignedDepartment`, notification `text/at/read/reportId`->`message/createdAt/isRead/referenceId` |
| vite.config.js | Add `/api` proxy |
| src/components/AuthForm.jsx | Remove the Administrator role option and access-code field from sign-up (the API returns 403); sign-in/sign-up call the auth endpoints |
| src/components/AddUserModal.jsx | `POST /api/users` |
| src/components/Layout.jsx | Load session via `/api/auth/me`; unread badge from `/api/notifications`; sign-out clears the token |
| src/components/ManagePanel.jsx | Split Save into `PATCH .../status` (with note), `.../assignment`, `.../details` |
| src/components/IncidentsList.jsx | Fetch `/incidents`, `/incidents/my`, `/incidents/assigned` with query filters; delete -> `DELETE`; "reports filed" from `/dashboard/admin` `reportsByReporter` |
| src/components/ReportView.jsx | `attachments` is an array of URLs; use `reporter`, `assignee`, `assignedDepartment`, `canManage`, `isOwner` from the response |
| src/components/PdfButton.jsx, src/utils/pdf.js | Use API fields (`referenceId`, `assignedDepartment`, filtered `timeline`) |
| src/components/RecentTable.jsx | Link/key by `referenceId` / `_id` |
| src/pages/ReportIncident.jsx | Send `FormData` (no base64); one or more files in `attachments` |
| src/pages/ReportConfirmation.jsx | Use the create response (anonymous reports cannot be re-fetched by owner) |
| src/pages/TrackReport.jsx | Regex `INC-\d{4}-\d{4,}`, placeholder `INC-2026-0001`, call `/incidents/reference/:referenceId`; handle the status-only view |
| src/pages/AdminOverview.jsx | Use `/api/dashboard/admin` |
| src/pages/Dashboard.jsx, MyReports.jsx, StaffDashboard.jsx, AdminIncidents.jsx | Use the list endpoints (via IncidentsList) |
| src/pages/ReportDetails.jsx, AdminIncidentDetails.jsx | Fetch by reference ID instead of reading the local db |
| src/pages/AdminUsers.jsx | `/api/users`, `PATCH /:id`, `PATCH /:id/status`, `DELETE /:id`; `openCases` comes from the API |
| src/pages/Notifications.jsx | `/api/notifications`, `read-all`, `:id/read` |
| src/pages/AwarenessHub.jsx | `/api/resources` |
| src/pages/MyProfile.jsx | `/api/auth/profile`, `/email`, `/password` (field `current`->`currentPassword`, `next`->`newPassword`) |

No change needed: App.jsx routes, LandingPage, LoginPage, SignupPage, PublicLayout, PublicNav, CampusIllustration, AwarenessHub styling, ui.jsx, constants.js, validation.js, all CSS.

## Decisions to review

- **Anonymous reports:** `reporterId` is never stored, so they cannot appear in "My reports", and the frontend's "you can still track it from your account" no longer holds. The reporter keeps the `referenceId` and uses the reference lookup, which shows status changes only (no description or notes), because reference IDs are sequential.
- **Reference IDs:** `INC-YYYY-NNNN` from an atomic per-year counter (the frontend used `SNT-YYYY-NNNNNN`).
- **Who can file:** student and staff only, as in the frontend. `GET /api/incidents` is administrator-only.
- **Categories:** validated against `utils/constants.js` (copied from the frontend). Edit there if the SRS differs.
- **Extras beyond the spec:** `phone`, `occurredAt`, `resolvedAt`, `isInternal` on responses, `internal` timeline entries, user delete, incident delete, `/details`, `/api/auth/profile|email|password`, `/api/resources`. They exist because the frontend uses them.
- **Cloudinary PDFs:** uploaded with `resource_type: auto`; if PDF links return 401/blocked, enable "PDF and ZIP files delivery" in Cloudinary security settings.
