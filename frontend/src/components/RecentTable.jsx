import { Link } from 'react-router-dom';
import { PriorityBadge, StatusBadge, fmt } from './ui';
import '../styles/adminDashboard.css';

/** Compact table of the most recently updated reports. */
export default function RecentTable({ rows, admin = false }) {
  return (
    <div className="table-wrap">
      <table className="stack">
        <thead>
          <tr>
            <th>Reference</th>
            <th>Category</th>
            <th>Status</th>
            <th>Priority</th>
            <th>Updated</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id}>
              <td data-label="Reference">
                <Link to={admin ? `/app/admin/incidents/${r.id}` : `/app/reports/${r.id}`}>{r.id}</Link>
              </td>
              <td data-label="Category">{r.category}</td>
              <td data-label="Status">
                <StatusBadge status={r.status} />
              </td>
              <td data-label="Priority">
                <PriorityBadge priority={r.priority} />
              </td>
              <td data-label="Updated">{fmt(r.updatedAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
