import { useState, useEffect } from "react";

import {
  Shield,
  Bell,
  User,
  Search,
  Plus,
  Clock,
  CheckCircle,
  AlertCircle,
  Menu,
  X,
  LogOut
} from "lucide-react";

import { useNavigate } from "react-router-dom";

import "../styles/designSystem.css";
import "../styles/dashboard.css";

function Dashboard() {
  const navigate = useNavigate();

  const [showNotifications, setShowNotifications] =
    useState(false);

  const [showMobileMenu, setShowMobileMenu] =
    useState(false);

  const [loading, setLoading] = useState(false);

  const currentUserData =
    localStorage.getItem("sentraCurrentUser");

  const currentUser = currentUserData
    ? JSON.parse(currentUserData)
    : null;

  const userRole = currentUser?.role || 'student';

  const user = {
    name:
      currentUser?.fullName ||
      currentUser?.name ||
      "Student",

    role:
      currentUser?.role || "Student",

    email:
      currentUser?.email || "",

    avatar: null
  };

  const stats = {
    activeReports: 0,
    pendingReports: 0,
    inReview: 0,
    resolved: 0
  };

  const recentReports = [];

  const notifications = [];

  /* =========================================================
     INITIALIZE MOCK DATA FOR STUDENT DASHBOARD
  ========================================================= */

  useEffect(() => {
    // Initialize mock data if no incidents exist
    const storedIncidents = localStorage.getItem('sentraIncidents');
    if (!storedIncidents) {
      const mockIncidents = [
        {
          id: 'SNT-2026-001001',
          referenceId: 'SNT-2026-001001',
          category: 'Safety Hazard',
          dateTime: '2026-08-15T14:30',
          location: 'Main Library, 2nd Floor',
          description: 'Broken glass near the entrance creating a tripping hazard.',
          additionalDetails: 'Several students have reported near misses.',
          isAnonymous: false,
          contactName: 'John Doe',
          contactEmail: 'john.doe@university.edu',
          contactPhone: '555-1234',
          status: 'Assigned',
          priority: 'High',
          assignedDepartment: 'Campus Security',
          assignedBy: 'Administrator',
          createdAt: '2026-08-15T14:30:00.000Z',
          updatedAt: '2026-08-15T16:00:00.000Z',
          timeline: [
            { status: 'Submitted', date: '2026-08-15T14:30:00.000Z', description: 'Report submitted successfully' },
            { status: 'Pending', date: '2026-08-15T14:35:00.000Z', description: 'Report received and queued for review' },
            { status: 'Assigned', date: '2026-08-15T16:00:00.000Z', description: 'Assigned to Campus Security' }
          ]
        },
        {
          id: 'SNT-2026-001002',
          referenceId: 'SNT-2026-001002',
          category: 'Facility Issue',
          dateTime: '2026-08-14T09:15',
          location: 'Student Center, Cafeteria',
          description: 'Water leak from ceiling causing flooding in food preparation area.',
          additionalDetails: 'Immediate attention required as it affects food safety.',
          isAnonymous: true,
          contactName: null,
          contactEmail: null,
          contactPhone: null,
          status: 'In Progress',
          priority: 'Critical',
          assignedDepartment: 'Facilities Team',
          assignedBy: 'Administrator',
          createdAt: '2026-08-14T09:15:00.000Z',
          updatedAt: '2026-08-14T10:30:00.000Z',
          timeline: [
            { status: 'Submitted', date: '2026-08-14T09:15:00.000Z', description: 'Anonymous report submitted successfully' },
            { status: 'Pending', date: '2026-08-14T09:20:00.000Z', description: 'Report received and queued for review' },
            { status: 'Assigned', date: '2026-08-14T09:45:00.000Z', description: 'Assigned to Facilities Team' },
            { status: 'In Progress', date: '2026-08-14T10:30:00.000Z', description: 'Facilities team is actively working on the issue' }
          ]
        },
        {
          id: 'SNT-2026-001003',
          referenceId: 'SNT-2026-001003',
          category: 'Harassment',
          dateTime: '2026-08-13T18:45',
          location: 'Dormitory Building B, Common Room',
          description: 'Verbal harassment incident reported between students.',
          additionalDetails: 'Witnesses available. Need immediate investigation.',
          isAnonymous: false,
          contactName: 'Jane Smith',
          contactEmail: 'jane.smith@university.edu',
          contactPhone: '555-5678',
          status: 'Pending',
          priority: 'High',
          assignedDepartment: 'Student Affairs',
          assignedBy: 'Administrator',
          createdAt: '2026-08-13T18:45:00.000Z',
          updatedAt: '2026-08-13T19:00:00.000Z',
          timeline: [
            { status: 'Submitted', date: '2026-08-13T18:45:00.000Z', description: 'Report submitted successfully' },
            { status: 'Pending', date: '2026-08-13T19:00:00.000Z', description: 'Report received and queued for review' }
          ]
        },
        {
          id: 'SNT-2026-001004',
          referenceId: 'SNT-2026-001004',
          category: 'Security Concern',
          dateTime: '2026-08-12T22:00',
          location: 'Parking Lot A, Section 3',
          description: 'Suspicious vehicle parked in restricted area for extended period.',
          additionalDetails: 'Vehicle has been there since yesterday evening.',
          isAnonymous: true,
          contactName: null,
          contactEmail: null,
          contactPhone: null,
          status: 'Resolution Submitted',
          priority: 'Medium',
          assignedDepartment: 'Campus Security',
          assignedBy: 'Administrator',
          staffResponse: 'Security team investigated the vehicle. It belongs to a faculty member who had car trouble and left it overnight. Vehicle has been moved to appropriate parking area.',
          resolutionSubmittedBy: 'Security Officer John',
          resolutionSubmittedAt: '2026-08-13T08:00:00.000Z',
          resolutionPendingAdmin: true,
          createdAt: '2026-08-12T22:00:00.000Z',
          updatedAt: '2026-08-13T08:00:00.000Z',
          timeline: [
            { status: 'Submitted', date: '2026-08-12T22:00:00.000Z', description: 'Anonymous report submitted successfully' },
            { status: 'Pending', date: '2026-08-12T22:05:00.000Z', description: 'Report received and queued for review' },
            { status: 'Assigned', date: '2026-08-12T23:00:00.000Z', description: 'Assigned to Campus Security' },
            { status: 'In Progress', date: '2026-08-13T07:00:00.000Z', description: 'Security team investigating the vehicle' },
            { status: 'Resolution Submitted', date: '2026-08-13T08:00:00.000Z', description: 'Resolution submitted to Admin for review' }
          ]
        },
        {
          id: 'SNT-2026-001005',
          referenceId: 'SNT-2026-001005',
          category: 'Medical Emergency',
          dateTime: '2026-08-10T11:30',
          location: 'Gymnasium, Basketball Court',
          description: 'Student injured during basketball game requiring medical attention.',
          additionalDetails: 'Student was treated by campus medical staff and is recovering.',
          isAnonymous: false,
          contactName: 'Mike Johnson',
          contactEmail: 'mike.johnson@university.edu',
          contactPhone: '555-9012',
          status: 'Resolved',
          priority: 'Critical',
          assignedDepartment: 'Health Services',
          assignedBy: 'Administrator',
          staffResponse: 'Student received immediate medical attention. Minor injury treated and student was released. Follow-up appointment scheduled.',
          resolutionSubmittedBy: 'Dr. Sarah Williams',
          resolutionSubmittedAt: '2026-08-10T14:00:00.000Z',
          adminResponse: 'Case reviewed and marked as resolved. Student follow-up confirmed.',
          createdAt: '2026-08-10T11:30:00.000Z',
          updatedAt: '2026-08-10T16:00:00.000Z',
          timeline: [
            { status: 'Submitted', date: '2026-08-10T11:30:00.000Z', description: 'Report submitted successfully' },
            { status: 'Pending', date: '2026-08-10T11:35:00.000Z', description: 'Report received and queued for review' },
            { status: 'Assigned', date: '2026-08-10T11:45:00.000Z', description: 'Assigned to Health Services' },
            { status: 'In Progress', date: '2026-08-10T12:00:00.000Z', description: 'Medical team providing treatment' },
            { status: 'Resolution Submitted', date: '2026-08-10T14:00:00.000Z', description: 'Resolution submitted to Admin for review' },
            { status: 'Resolved', date: '2026-08-10T16:00:00.000Z', description: 'Admin reviewed and marked as resolved' }
          ]
        }
      ];
      
      localStorage.setItem('sentraIncidents', JSON.stringify(mockIncidents));
      
      // Initialize admin signals
      const mockSignals = [
        {
          id: 'RES-2026-001001',
          incidentId: 'SNT-2026-001004',
          referenceId: 'SNT-2026-001004',
          department: 'Campus Security',
          staffName: 'Security Officer John',
          message: 'Resolution submitted for SNT-2026-001004',
          response: 'Security team investigated the vehicle. It belongs to a faculty member who had car trouble and left it overnight. Vehicle has been moved to appropriate parking area.',
          status: 'Pending Admin Review',
          createdAt: '2026-08-13T08:00:00.000Z',
          read: false
        }
      ];
      
      localStorage.setItem('sentraAdminResolutionSignals', JSON.stringify(mockSignals));
    }
  }, []);

  const getStatusBadge = (status) => {
    const statusConfig = {
      Pending: {
        className: "badge-warning",
        icon: Clock
      },

      "In Review": {
        className: "badge-info",
        icon: AlertCircle
      },

      Resolved: {
        className: "badge-success",
        icon: CheckCircle
      }
    };

    const config =
      statusConfig[status] ||
      statusConfig.Pending;

    const Icon = config.icon;

    return (
      <span
        className={`badge ${config.className}`}
      >
        <Icon size={12} />
        {status}
      </span>
    );
  };

  const handleReportIncident = () => {
    navigate("/report-incident");
  };

  const handleTrackReport = () => {
    navigate("/track-report");
  };

  const handleViewReport = (reportId) => {
    navigate(`/report/${reportId}`);
  };



  const handleLogout = () => {
    localStorage.removeItem("sentraCurrentUser");
    navigate("/login");
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-container">

      <header className="dashboard-header">

        <div className="header-left">

          <button
            className="mobile-menu-btn"
            onClick={() =>
              setShowMobileMenu(!showMobileMenu)
            }
          >
            {showMobileMenu ? (
              <X size={24} />
            ) : (
              <Menu size={24} />
            )}
          </button>

          <div className="logo">
            <Shield size={32} />
            <span>Sentra</span>
          </div>

        </div>

        <nav
          className={`header-nav ${
            showMobileMenu ? "show" : ""
          }`}
        >

          <button
            onClick={() => {
              if (userRole === 'staff') {
                navigate('/staff/dashboard');
              } else if (userRole === 'administrator') {
                navigate('/admin/dashboard');
              } else {
                navigate('/dashboard');
              }
            }}
            className="nav-link active"
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontFamily: 'inherit',
              fontSize: 'inherit'
            }}
          >
            Dashboard
          </button>

          <button
            onClick={handleReportIncident}
            className="nav-link"
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontFamily: 'inherit',
              fontSize: 'inherit'
            }}
          >
            Report Incident
          </button>

          <button
            onClick={handleTrackReport}
            className="nav-link"
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontFamily: 'inherit',
              fontSize: 'inherit'
            }}
          >
            Track Report
          </button>

        </nav>

        <div className="header-right">

          <div className="notification-wrapper">

            <button
              className="notification-btn"
              onClick={() =>
                setShowNotifications(
                  !showNotifications
                )
              }
            >
              <Bell size={20} />
            </button>

            {showNotifications && (

              <div className="notification-dropdown">

                <div className="notification-header">
                  <h4>Notifications</h4>
                </div>

                <div className="notification-list">

                  {notifications.length === 0 ? (

                    <div className="notification-item">
                      <p>No notifications yet</p>
                    </div>

                  ) : (

                    notifications.map(
                      (notification) => (

                        <div
                          key={notification.id}
                          className={`notification-item ${
                            !notification.read
                              ? "unread"
                              : ""
                          }`}
                        >

                          <p>
                            {notification.message}
                          </p>

                          <span className="notification-time">
                            {notification.time}
                          </span>

                        </div>

                      )
                    )

                  )}

                </div>

              </div>

            )}

          </div>

          <div className="user-menu">

            <button className="user-btn">

              {user.avatar ? (

                <img
                  src={user.avatar}
                  alt={user.name}
                  className="user-avatar"
                />

              ) : (

                <div className="user-avatar-placeholder">
                  <User size={20} />
                </div>

              )}

              <div className="user-info">

                <span className="user-name">
                  {user.name}
                </span>

                <span className="user-role">
                  {user.role}
                </span>

              </div>

            </button>

          </div>

          <button
            className="logout-btn"
            onClick={handleLogout}
          >
            <LogOut size={20} />
          </button>

        </div>

      </header>

      <main className="dashboard-main">

        <div className="container">

          <section className="welcome-section">

            <div className="welcome-content">

              <h1>
                Welcome back, {user.name}
              </h1>

              <p>
                A safer campus starts with speaking up.
                Report incidents confidentially and track
                their progress.
              </p>

            </div>

            <div className="welcome-actions">

              <button
                className="btn btn-primary btn-lg"
                onClick={handleReportIncident}
              >
                <Plus size={20} />
                Report an Incident
              </button>

              <button
                className="btn btn-secondary btn-lg"
                onClick={handleTrackReport}
              >
                <Search size={20} />
                Track a Report
              </button>

            </div>

          </section>

          <section className="stats-section">

            <div className="stats-grid">

              <div className="stat-card stat-active">

                <div className="stat-icon">
                  <AlertCircle size={24} />
                </div>

                <div className="stat-content">
                  <h3>
                    {stats.activeReports}
                  </h3>

                  <p>Active Reports</p>
                </div>

              </div>

              <div className="stat-card stat-pending">

                <div className="stat-icon">
                  <Clock size={24} />
                </div>

                <div className="stat-content">
                  <h3>
                    {stats.pendingReports}
                  </h3>

                  <p>Pending</p>
                </div>

              </div>

              <div className="stat-card stat-review">

                <div className="stat-icon">
                  <Search size={24} />
                </div>

                <div className="stat-content">
                  <h3>
                    {stats.inReview}
                  </h3>

                  <p>In Review</p>
                </div>

              </div>

              <div className="stat-card stat-resolved">

                <div className="stat-icon">
                  <CheckCircle size={24} />
                </div>

                <div className="stat-content">
                  <h3>
                    {stats.resolved}
                  </h3>

                  <p>Resolved</p>
                </div>

              </div>

            </div>

          </section>

          <section className="recent-reports-section">

            <div className="section-header">

              <h2>Recent Reports</h2>

            </div>

            <div className="reports-table-container">

              <table className="table reports-table">

                <thead>

                  <tr>
                    <th>Reference ID</th>
                    <th>Category</th>
                    <th>Date Submitted</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>

                </thead>

                <tbody>

                  {recentReports.map(
                    (report) => (

                      <tr key={report.id}>

                        <td className="report-id">

                          {report.id}

                          {report.anonymous && (

                            <span className="anonymous-badge">
                              <Shield size={12} />
                              Anonymous
                            </span>

                          )}

                        </td>

                        <td>
                          {report.category}
                        </td>

                        <td>
                          {new Date(
                            report.date
                          ).toLocaleDateString()}
                        </td>

                        <td>
                          {getStatusBadge(
                            report.status
                          )}
                        </td>

                        <td>

                          <button
                            className="btn btn-ghost btn-sm"
                            onClick={() =>
                              handleViewReport(
                                report.id
                              )
                            }
                          >
                            View Details
                          </button>

                        </td>

                      </tr>

                    )
                  )}

                </tbody>

              </table>

            </div>

            {recentReports.length === 0 && (

              <div className="empty-state">

                <div className="empty-state-icon">
                  <Shield size={48} />
                </div>

                <h3 className="empty-state-title">
                  No reports yet
                </h3>

                <p className="empty-state-description">
                  You haven't submitted any incidents.
                  Report an incident to get started.
                </p>

                <button
                  className="btn btn-primary"
                  onClick={handleReportIncident}
                >
                  Report Your First Incident
                </button>

              </div>

            )}

          </section>

        </div>

      </main>

    </div>
  );
}

export default Dashboard;