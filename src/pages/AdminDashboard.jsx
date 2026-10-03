import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function AdminDashboard() {
  const navigate = useNavigate();

  useEffect(() => {
    // Keep the legacy admin entry point pointed at the dashboard overview.
    navigate('/admin/dashboard', { replace: true });
  }, [navigate]);

  return null;
}

export default AdminDashboard;
