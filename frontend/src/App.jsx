import { BrowserRouter, Link, Route, Routes } from 'react-router-dom';
import { RequireAuth, RequireRole } from './components/Layout';
import { useSession } from './store/AppStore';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import Dashboard from './pages/Dashboard';
import AdminOverview from './pages/AdminOverview';
import StaffDashboard from './pages/StaffDashboard';
import MyReports from './pages/MyReports';
import ReportIncident from './pages/ReportIncident';
import ReportConfirmation from './pages/ReportConfirmation';
import ReportDetails from './pages/ReportDetails';
import TrackReport from './pages/TrackReport';
import AwarenessHub from './pages/AwarenessHub';
import Notifications from './pages/Notifications';
import AdminIncidents from './pages/AdminIncidents';
import AdminIncidentDetails from './pages/AdminIncidentDetails';
import PublicLayout from './components/PublicLayout';
import AdminUsers from './pages/AdminUsers';
import MyProfile from './pages/MyProfile';

/** Roles that file and track their own reports. Administrators manage reports from the dashboard instead. */
const FILERS = ['student', 'staff'];

const NotFound = () => (
  <div className="card narrow">
    <h1>Page not found</h1>
    <p>That address does not match any page.</p>
    <Link className="btn btn-primary" to="/">
      Go home
    </Link>
  </div>
);

/** /app shows the administrator overview or the student/staff dashboard depending on the role. */
function DashboardRoute() {
  const { me } = useSession();
  return me.role === 'administrator' ? <AdminOverview /> : <Dashboard />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route
          path="/awareness"
          element={
            <PublicLayout active="awareness">
              <AwarenessHub />
            </PublicLayout>
          }
        />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/app" element={<RequireAuth />}>
          <Route index element={<DashboardRoute />} />
          <Route
            path="report/new"
            element={
              <RequireRole roles={FILERS}>
                <ReportIncident />
              </RequireRole>
            }
          />
          <Route
            path="report/submitted/:id"
            element={
              <RequireRole roles={FILERS}>
                <ReportConfirmation />
              </RequireRole>
            }
          />
          <Route
            path="reports"
            element={
              <RequireRole roles={FILERS}>
                <MyReports />
              </RequireRole>
            }
          />
          <Route path="reports/:id" element={<ReportDetails />} />
          <Route
            path="track"
            element={
              <RequireRole roles={FILERS}>
                <TrackReport />
              </RequireRole>
            }
          />
          <Route path="awareness" element={<AwarenessHub />} />
          <Route path="notifications" element={<Notifications />} />
          <Route path="profile" element={<MyProfile />} />
          <Route
            path="assigned"
            element={
              <RequireRole roles={['staff']}>
                <StaffDashboard />
              </RequireRole>
            }
          />
          <Route
            path="admin/incidents"
            element={
              <RequireRole roles={['administrator']}>
                <AdminIncidents />
              </RequireRole>
            }
          />
          <Route
            path="admin/incidents/:id"
            element={
              <RequireRole roles={['administrator']}>
                <AdminIncidentDetails />
              </RequireRole>
            }
          />
          <Route
            path="admin/users"
            element={
              <RequireRole roles={['administrator']}>
                <AdminUsers />
              </RequireRole>
            }
          />
          <Route path="*" element={<NotFound />} />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}
