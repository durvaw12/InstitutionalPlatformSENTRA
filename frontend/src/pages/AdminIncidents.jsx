import IncidentsList from '../components/IncidentsList';
import '../styles/adminDashboard.css';

/** Administrator view: every incident, with filters. Open one to assign it to staff. */
export default function AdminIncidents() {
  return <IncidentsList scope="all" />;
}
