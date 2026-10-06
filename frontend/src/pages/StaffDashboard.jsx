import IncidentsList from '../components/IncidentsList';
import '../styles/dashboard.css';

/** Staff view: the cases assigned to the signed-in staff member. */
export default function StaffDashboard() {
  return <IncidentsList scope="assigned" />;
}
