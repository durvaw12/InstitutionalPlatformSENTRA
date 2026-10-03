import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'; 
import LandingPage from './pages/LandingPage'; 
import LoginPage from './pages/LoginPage'; 
import StaffLogin from './pages/StaffLogin'; 
import Dashboard from './pages/Dashboard'; 
import StaffDashboard from './pages/StaffDashboard'; 
import ReportIncident from './pages/ReportIncident'; 
import ReportConfirmation from './pages/ReportConfirmation'; 
import TrackReport from './pages/TrackReport'; 
import ReportDetails from './pages/ReportDetails'; 
import AdminDashboard from './pages/AdminDashboard'; 
import AdminOverview from './pages/AdminOverview'; 
import AdminIncidents from './pages/AdminIncidents'; 
import AdminUsers from './pages/AdminUsers'; 
import AdminSettings from './pages/AdminSettings'; 
import AdminIncidentDetails from './pages/AdminIncidentDetails'; 
import AwarenessHub from './pages/AwarenessHub'; 
import SignupPage from "./pages/SignupPage"; 
import './styles/designSystem.css'; 
 
function App() { 
  return ( 
    <Router> 
      <Routes> 
        {/* Public Routes */} 
        <Route path="/" element={<LandingPage />} /> 
        <Route path="/signup" element={<SignupPage />} /> 
        <Route path="/login" element={<LoginPage />} /> 
        <Route path="/staff/login" element={<StaffLogin />} /> 
         
        {/* User Routes */} 
        <Route path="/dashboard" element={<Dashboard />} /> 
        <Route path="/report-incident" element={<ReportIncident />} /> 
        <Route path="/report-confirmation" element={<ReportConfirmation />} /> 
        <Route path="/track-report" element={<TrackReport />} /> 
        <Route path="/report/:id" element={<ReportDetails />} /> 
        <Route path="/awareness" element={<AwarenessHub />} /> 
         
        {/* Staff Routes */} 
        <Route path="/staff/dashboard" element={<StaffDashboard />} /> 
         
        {/* Admin Routes */} 
        <Route path="/admin/dashboard" element={<AdminOverview />} /> 
        <Route path="/admin/incidents" element={<AdminIncidents />} /> 
        <Route path="/admin/incident/:id" element={<AdminIncidentDetails />} /> 
        <Route path="/admin/users" element={<AdminUsers />} /> 
        <Route path="/admin/settings" element={<AdminSettings />} /> 
         
        {/* Catch all route */} 
        <Route path="*" element={<Navigate to="/" replace />} /> 
      </Routes> 
    </Router> 
  ); 
} 
 
export default App; 