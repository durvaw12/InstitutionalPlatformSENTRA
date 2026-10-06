# Sentra frontend

Incident reporting and response dashboard for educational institutions (SRS EDU-WB-2026-078-SRS-v1.2).
React 19 + JavaScript (JSX) + Vite + React Router. No backend needed: a persisted service layer
(`src/store/AppStore.jsx`) simulates the API and database.

## Run

    npm install
    npm run dev          # http://localhost:3000
    npm run build

## Accounts

There is no seeded data. Create accounts on `/signup`.
Administrator accounts need the access code `SENTRA-ADMIN` (change `ADMIN_CODE` in `src/store/AppStore.jsx`).
To see the cross-dashboard updates, sign in as a different role in a second browser tab:
sessions are per tab, data is shared and syncs live.

## Administrator dashboard

- **Add new user** (Users page): opens a form for name, email, role, department, and a temporary password (`AddUserModal.jsx`, `store.createUser`). The administrator stays signed in.
- Administrators do not file or track reports. `New report`, `My reports`, and `Track a report` are hidden from their menu and dashboard, and those routes are limited to students and staff. Administrators manage reports from `All incidents` and the report detail page.
- Departments are listed in `DEPARTMENTS` in `src/store/constants.js`.
- The layout is fluid from 320px up: the menu collapses behind a button at 900px and below, and tables turn into labelled cards at 1100px and below. Tables need a `data-label` on each cell and `className="stack"` to do this.

## Structure

    src/
      main.jsx, App.jsx                 entry point and route table
      pages/                            one file per screen
        LandingPage, LoginPage, SignupPage
        Dashboard (student/staff), StaffDashboard (assigned cases), MyReports
        ReportIncident, ReportConfirmation, ReportDetails, TrackReport
        AwarenessHub, Notifications
        AdminOverview, AdminIncidents, AdminIncidentDetails, AdminUsers
      components/                       Layout, ui, AuthForm, IncidentsList, RecentTable,
                                        ReportView, ManagePanel, AddUserModal, PdfButton, CampusIllustration
      store/AppStore.jsx                persisted store, permissions and all actions (the "API")
      store/constants.js                statuses, priorities, categories, departments
      utils/pdf.js                      report PDF generator (jsPDF)
      styles/                           designSystem, landingPage, loginPage, dashboard, adminDashboard, awarenessHub

## SRS coverage

| Requirement | Where |
|---|---|
| FR-01 login, role access, AC-01 | `AuthForm.jsx`, `Layout.jsx` (`RequireAuth`, `RequireRole`) |
| FR-02, FR-03, FR-04, FR-05 | `ReportIncident.jsx`, `store.submitReport` |
| FR-06, AC-05 | `TrackReport.jsx`, `ReportDetails.jsx` |
| FR-07, FR-08 | `AdminIncidents.jsx`, `AdminIncidentDetails.jsx` (`ManagePanel.jsx`), `AdminUsers.jsx` |
| FR-09, AC-06 | `AwarenessHub.jsx` (admins can add and remove content) |
| FR-10 | in-app notifications: `Notifications.jsx`, `store.notify` |
| NFR-03 anonymity, AC-04 | anonymous reports store no reporter identity; the owner link is kept apart in `DB.owners` |

## Limits to know about

- Data lives in the browser (`localStorage`, about 5 MB), so attachments are capped at 1 MB.
- Passwords are salted and hashed with SHA-256 in the browser. That is fine for a prototype,
  but real authentication (JWT and bcrypt/argon2) belongs in the Express API.
- FR-10 is in-app only; email delivery needs the backend.
- Swap `AppStore.jsx` actions for `fetch` calls to move to the MERN backend. Pages only call those functions.
