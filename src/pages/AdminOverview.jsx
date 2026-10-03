import { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import {
  Shield,
  Bell,
  User,
  LogOut,
  Menu,
  X,
  BarChart3,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock,
  FileText,
  Users,
  Settings,
  Search,
  Filter,
  X as CloseIcon
} from 'lucide-react';
import '../styles/designSystem.css';
import '../styles/adminDashboard.css';
import '../styles/AdminOverview.css';

function AdminOverview() {
  const navigate = useNavigate();
  const location = useLocation();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Mock data
  const stats = {
    totalReports: 156,
    pending: 23,
    inReview: 45,
    resolved: 88,
    anonymous: 34
  };

  const recentIncidents = [
    {
      id: 'SNT-2026-004281',
      category: 'Safety Hazard',
      date: '2026-08-15',
      priority: 'High',
      status: 'In Review',
      assignedTo: 'Campus Security',
      submittedBy: 'student@campus.edu',
      location: 'Main Building, Floor 3',
      description: 'Broken glass in hallway near staircase',
      additionalDetails: 'Large shards of glass scattered across the hallway floor near the main staircase. Multiple students reported the hazard. Immediate cleanup required to prevent injuries.',
      submittedDate: '2026-08-15T09:30:00',
      lastUpdated: '2026-08-15T14:45:00',
      remarks: [
        {
          id: 1,
          author: 'Campus Security',
          message: 'Team dispatched to location. Estimated arrival time: 10 minutes.',
          timestamp: '2026-08-15T10:00:00'
        },
        {
          id: 2,
          author: 'Facilities Team',
          message: 'Cleanup crew has arrived. Area being secured.',
          timestamp: '2026-08-15T10:15:00'
        }
      ],
      attachments: [
        { name: 'photo_1.jpg', size: '2.3 MB' },
        { name: 'photo_2.jpg', size: '1.8 MB' }
      ]
    },
    {
      id: 'SNT-2026-004280',
      category: 'Harassment',
      date: '2026-08-14',
      priority: 'Critical',
      status: 'Pending',
      assignedTo: 'Unassigned',
      submittedBy: 'Anonymous',
      location: 'Library, Study Room B',
      description: 'Verbal harassment reported in study area',
      additionalDetails: 'Student reported experiencing verbal harassment from another individual in the study room. Requesting immediate intervention and investigation.',
      submittedDate: '2026-08-14T16:45:00',
      lastUpdated: '2026-08-14T16:45:00',
      remarks: [
        {
          id: 1,
          author: 'System',
          message: 'Report submitted via anonymous channel.',
          timestamp: '2026-08-14T16:45:00'
        }
      ],
      attachments: []
    },
    {
      id: 'SNT-2026-004279',
      category: 'Theft',
      date: '2026-08-13',
      priority: 'Medium',
      status: 'Resolved',
      assignedTo: 'Campus Police',
      submittedBy: 'staff@campus.edu',
      location: 'Parking Lot A',
      description: 'Bicycle theft from parking area',
      additionalDetails: 'Staff member reported their bicycle was stolen from the designated parking area. Security footage shows suspicious activity near the time of the incident.',
      submittedDate: '2026-08-13T08:15:00',
      lastUpdated: '2026-08-13T16:30:00',
      remarks: [
        {
          id: 1,
          author: 'Campus Police',
          message: 'Investigation initiated. Security footage being reviewed.',
          timestamp: '2026-08-13T09:00:00'
        },
        {
          id: 2,
          author: 'Campus Police',
          message: 'Case resolved. Bicycle recovered and returned to owner.',
          timestamp: '2026-08-13T16:30:00'
        }
      ],
      attachments: [
        { name: 'security_footage.mp4', size: '15.2 MB' }
      ]
    },
    {
      id: 'SNT-2026-004278',
      category: 'Facility Issue',
      date: '2026-08-12',
      priority: 'Low',
      status: 'In Review',
      assignedTo: 'Facilities Team',
      submittedBy: 'student@campus.edu',
      location: 'Dormitory B, Room 204',
      description: 'Water leak in bathroom',
      additionalDetails: 'Student reported a persistent water leak in the bathroom sink. Water damage is beginning to affect the wall and floor.',
      submittedDate: '2026-08-12T14:20:00',
      lastUpdated: '2026-08-12T18:00:00',
      remarks: [
        {
          id: 1,
          author: 'Facilities Team',
          message: 'Work order created. Maintenance team scheduled for tomorrow.',
          timestamp: '2026-08-12T15:00:00'
        }
      ],
      attachments: []
    },
    {
      id: 'SNT-2026-004277',
      category: 'Medical Emergency',
      date: '2026-08-11',
      priority: 'Critical',
      status: 'Resolved',
      assignedTo: 'Health Services',
      submittedBy: 'Anonymous',
      location: 'Sports Complex, Gym',
      description: 'Student fainted during workout',
      additionalDetails: 'Anonymous report of a student fainting during their workout routine. Student was attended to by gym staff and medical services.',
      submittedDate: '2026-08-11T10:30:00',
      lastUpdated: '2026-08-11T12:00:00',
      remarks: [
        {
          id: 1,
          author: 'Health Services',
          message: 'Student assessed and released. No serious injuries reported.',
          timestamp: '2026-08-11T12:00:00'
        }
      ],
      attachments: []
    }
  ];

  // Save incidents to localStorage for the details page to access
  useEffect(() => {
    localStorage.setItem('adminIncidents', JSON.stringify(recentIncidents));
  }, []);

  const notifications = [
    {
      id: 1,
      message: 'New critical report submitted: SNT-2026-004280',
      time: '10 minutes ago',
      read: false
    },
    {
      id: 2,
      message: 'Report SNT-2026-004279 has been resolved',
      time: '1 hour ago',
      read: false
    },
    {
      id: 3,
      message: 'Weekly report summary is ready for review',
      time: '3 hours ago',
      read: true
    }
  ];

  const getStatusBadge = (status) => {
    const statusConfig = {
      'Pending': { className: 'badge-warning', icon: Clock },
      'In Review': { className: 'badge-info', icon: AlertCircle },
      'Resolved': { className: 'badge-success', icon: CheckCircle }
    };

    const config = statusConfig[status] || statusConfig['Pending'];
    const Icon = config.icon;

    return (
      <span className={`badge ${config.className}`}>
        <Icon size={12} />
        {status}
      </span>
    );
  };

  const getPriorityBadge = (priority) => {
    const priorityConfig = {
      'Critical': { className: 'priority-critical' },
      'High': { className: 'priority-high' },
      'Medium': { className: 'priority-medium' },
      'Low': { className: 'priority-low' }
    };

    const config = priorityConfig[priority] || priorityConfig['Medium'];

    return (
      <span className={`priority-badge ${config.className}`}>
        {priority}
      </span>
    );
  };

  const handleLogout = () => {
    navigate('/login');
  };

  const handleViewIncident = (id) => {
    navigate(`/admin/incident/${id}`);
  };

  const filteredIncidents = recentIncidents.filter(incident => {
    const matchesSearch = incident.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         incident.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || incident.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || incident.priority === priorityFilter;
    const matchesCategory = categoryFilter === 'all' || incident.category === categoryFilter;

    return matchesSearch && matchesStatus && matchesPriority && matchesCategory;
  });

  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setPriorityFilter('all');
    setCategoryFilter('all');
  };

  return (
    <div className="admin-dashboard-container">
      {/* Header */}
      <header className="admin-header">
        <div className="header-left">
          <button
            className="mobile-menu-btn"
            onClick={() => setShowMobileMenu(!showMobileMenu)}
          >
            {showMobileMenu ? <X size={24} /> : <Menu size={24} />}
          </button>
          <div className="logo">
            <Shield size={32} />
            <span>Sentra Admin</span>
          </div>
        </div>

        <nav className={`admin-nav ${showMobileMenu ? 'show' : ''}`}>
          <Link to="/admin/dashboard" className={`nav-item ${location.pathname === '/admin/dashboard' ? 'active' : ''}`}>
            <BarChart3 size={18} />
            Overview
          </Link>
          <Link to="/admin/incidents" className={`nav-item ${location.pathname === '/admin/incidents' ? 'active' : ''}`}>
            <FileText size={18} />
            Incidents
          </Link>
          <Link to="/admin/users" className={`nav-item ${location.pathname === '/admin/users' ? 'active' : ''}`}>
            <Users size={18} />
            Users
          </Link>
          <Link to="/admin/settings" className={`nav-item ${location.pathname === '/admin/settings' ? 'active' : ''}`}>
            <Settings size={18} />
            Settings
          </Link>
        </nav>

        <div className="header-right">
          <div className="notification-wrapper">
            <button
              className="notification-btn"
              onClick={() => setShowNotifications(!showNotifications)}
            >
              <Bell size={20} />
              {notifications.some(n => !n.read) && (
                <span className="notification-badge">2</span>
              )}
            </button>

            {showNotifications && (
              <div className="notification-dropdown">
                <div className="notification-header">
                  <h4>Notifications</h4>
                  <button className="mark-read-btn">Mark all as read</button>
                </div>
                <div className="notification-list">
                  {notifications.map(notification => (
                    <div
                      key={notification.id}
                      className={`notification-item ${!notification.read ? 'unread' : ''}`}
                    >
                      <p>{notification.message}</p>
                      <span className="notification-time">{notification.time}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="user-menu">
            <button className="user-btn">
              <div className="user-avatar-placeholder">
                <User size={20} />
              </div>
              <div className="user-info">
                <span className="user-name">Admin User</span>
                <span className="user-role">Administrator</span>
              </div>
            </button>
          </div>

          <button className="logout-btn" onClick={handleLogout}>
            <LogOut size={20} />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="admin-main">
        <div className="container">
          {/* Page Header */}
          <div className="page-header">
            <h1>Dashboard Overview</h1>
            <p>Monitor and manage campus safety incidents</p>
          </div>

          {/* Stats Grid */}
          <section className="stats-section">
            <div className="stats-grid">
              <div className="stat-card stat-total">
                <div className="stat-icon">
                  <FileText size={24} />
                </div>
                <div className="stat-content">
                  <h3>{stats.totalReports}</h3>
                  <p>Total Reports</p>
                  <span className="stat-trend positive">
                    <TrendingUp size={14} />
                    +12% this month
                  </span>
                </div>
              </div>

              <div className="stat-card stat-pending">
                <div className="stat-icon">
                  <Clock size={24} />
                </div>
                <div className="stat-content">
                  <h3>{stats.pending}</h3>
                  <p>Pending</p>
                  <span className="stat-trend">Needs attention</span>
                </div>
              </div>

              <div className="stat-card stat-review">
                <div className="stat-icon">
                  <AlertCircle size={24} />
                </div>
                <div className="stat-content">
                  <h3>{stats.inReview}</h3>
                  <p>In Review</p>
                  <span className="stat-trend">Active investigation</span>
                </div>
              </div>

              <div className="stat-card stat-resolved">
                <div className="stat-icon">
                  <CheckCircle size={24} />
                </div>
                <div className="stat-content">
                  <h3>{stats.resolved}</h3>
                  <p>Resolved</p>
                  <span className="stat-trend positive">
                    <TrendingUp size={14} />
                    +8% this month
                  </span>
                </div>
              </div>

              <div className="stat-card stat-anonymous">
                <div className="stat-icon">
                  <Shield size={24} />
                </div>
                <div className="stat-content">
                  <h3>{stats.anonymous}</h3>
                  <p>Anonymous</p>
                  <span className="stat-trend">Confidential reports</span>
                </div>
              </div>
            </div>
          </section>

          {/* Charts Section */}
          <section className="charts-section">
            <div className="charts-grid">
              <div className="chart-card">
                <div className="chart-header">
                  <h3>Reports Over Time</h3>
                  <select className="select chart-filter">
                    <option>Last 7 days</option>
                    <option>Last 30 days</option>
                    <option>Last 90 days</option>
                  </select>
                </div>
                <div className="chart-placeholder">
                  <BarChart3 size={48} />
                  <p>Chart visualization would go here</p>
                </div>
              </div>

              <div className="chart-card">
                <div className="chart-header">
                  <h3>Reports by Category</h3>
                  <select className="select chart-filter">
                    <option>All time</option>
                    <option>This month</option>
                  </select>
                </div>
                <div className="chart-placeholder">
                  <BarChart3 size={48} />
                  <p>Category breakdown chart</p>
                </div>
              </div>

              <div className="chart-card">
                <div className="chart-header">
                  <h3>Reports by Status</h3>
                  <select className="select chart-filter">
                    <option>Current</option>
                    <option>Historical</option>
                  </select>
                </div>
                <div className="chart-placeholder">
                  <BarChart3 size={48} />
                  <p>Status distribution chart</p>
                </div>
              </div>
            </div>
          </section>

          {/* Recent Incidents Table */}
          <section className="incidents-section">
            <div className="section-header">
              <h2>Recent Incidents</h2>
              <div className="section-actions">
                <div className="search-wrapper">
                  <Search size={18} />
                  <input
                    type="text"
                    className="input"
                    placeholder="Search incidents..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <button
                  className="btn btn-secondary"
                  onClick={() => setShowFilterModal(true)}
                >
                  <Filter size={16} />
                  Filters
                </button>
                <button className="btn btn-primary" onClick={() => navigate('/admin/incidents')}>
                  View All
                </button>
              </div>
            </div>

            <div className="table-container">
              <table className="table incidents-table">
                <thead>
                  <tr>
                    <th>Reference ID</th>
                    <th>Category</th>
                    <th>Date</th>
                    <th>Priority</th>
                    <th>Status</th>
                    <th>Assigned To</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredIncidents.map(incident => (
                    <tr key={incident.id}>
                      <td className="report-id">{incident.id}</td>
                      <td>{incident.category}</td>
                      <td>{new Date(incident.date).toLocaleDateString()}</td>
                      <td>{getPriorityBadge(incident.priority)}</td>
                      <td>{getStatusBadge(incident.status)}</td>
                      <td>{incident.assignedTo}</td>
                      <td>
                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={() => handleViewIncident(incident.id)}
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </main>

      {/* Filter Modal */}
      {showFilterModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Filter Incidents</h2>
              <button
                className="modal-close-btn"
                onClick={() => setShowFilterModal(false)}
              >
                <CloseIcon size={20} />
              </button>
            </div>

            <div className="modal-body">
              <div className="form-group">
                <label className="label">Status</label>
                <select
                  className="select"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="all">All Status</option>
                  <option value="Pending">Pending</option>
                  <option value="In Review">In Review</option>
                  <option value="Resolved">Resolved</option>
                </select>
              </div>

              <div className="form-group">
                <label className="label">Priority</label>
                <select
                  className="select"
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                >
                  <option value="all">All Priority</option>
                  <option value="Critical">Critical</option>
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
              </div>

              <div className="form-group">
                <label className="label">Category</label>
                <select
                  className="select"
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                >
                  <option value="all">All Categories</option>
                  <option value="Safety Hazard">Safety Hazard</option>
                  <option value="Harassment">Harassment</option>
                  <option value="Theft">Theft</option>
                  <option value="Facility Issue">Facility Issue</option>
                  <option value="Medical Emergency">Medical Emergency</option>
                </select>
              </div>
            </div>

            <div className="modal-footer">
              <button
                className="btn btn-secondary"
                onClick={clearFilters}
              >
                Clear Filters
              </button>
              <button
                className="btn btn-primary"
                onClick={() => setShowFilterModal(false)}
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminOverview;