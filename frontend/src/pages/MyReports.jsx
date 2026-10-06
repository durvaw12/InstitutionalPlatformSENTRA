import IncidentsList from '../components/IncidentsList';
import '../styles/dashboard.css';

/** Student/staff view: the reports the signed-in person has filed. */
export default function MyReports() {
  return <IncidentsList scope="mine" />;
}
