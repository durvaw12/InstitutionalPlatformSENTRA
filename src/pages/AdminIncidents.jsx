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
  AlertCircle,
  CheckCircle,
  Clock,
  FileText,
  Users,
  Settings,
  Search,
  ArrowLeft,
  Eye,
  MoreVertical,
  UserCheck,
  Edit,
  MessageSquare,
  Check
} from 'lucide-react';
import '../styles/designSystem.css';
import '../styles/adminDashboard.css';
import AssignmentModal from '../components/AssignmentModal';
import StatusUpdateModal from '../components/StatusUpdateModal';
import RemarksModal from '../components/RemarksModal';

function AdminIncidents() {
  const navigate = useNavigate();
  const location = useLocation();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [activeDropdown, setActiveDropdown] = useState(null);
  
  // Modal states
  const [assignmentModal, setAssignmentModal] = useState({ isOpen: false, incident: null });
  const [statusModal, setStatusModal] = useState({ isOpen: false, incident: null });
  const [remarksModal, setRemarksModal] = useState({ isOpen: false, incident: null });

  // Initialize incidents from localStorage or use mock data
  const getIncidents = () => {
    const stored = localStorage.getItem('adminIncidents');
    if (stored) {
      return JSON.parse(stored);
    }
    
    // Mock data
    const mockIncidents = [
    {
      id: 'SNT-2026-004281',
      category: 'Safety Hazard',
      date: '2026-08-15',
      priority: 'High',
      status: 'In Review',
      assignedTo: 'Campus Security',
      submittedBy: 'student@campus.edu',
      location: 'Main Building, Floor 3',
      description: 'Broken glass in hallway near staircase'
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
      description: 'Verbal harassment reported in study area'
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
      description: 'Bicycle theft from parking area'
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
      description: 'Water leak in bathroom'
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
      description: 'Student fainted during workout'
    },
    {
      id: 'SNT-2026-004276',
      category: 'Safety Hazard',
      date: '2026-08-10',
      priority: 'High',
      status: 'Pending',
      assignedTo: 'Unassigned',
      submittedBy: 'staff@campus.edu',
      location: 'Science Building, Lab 3',
      description: 'Chemical spill in laboratory'
    },
    {
      id: 'SNT-2026-004275',
      category: 'Harassment',
      date: '2026-08-09',
      priority: 'High',
      status: 'In Review',
      assignedTo: 'Campus Security',
      submittedBy: 'student@campus.edu',
      location: 'Student Center, Cafe',
      description: 'Inappropriate behavior reported'
    },
    {
      id: 'SNT-2026-004274',
      category: 'Theft',
      date: '2026-08-08',
      priority: 'Medium',
      status: 'Resolved',
      assignedTo: 'Campus Police',
      submittedBy: 'Anonymous',
      location: 'Library, Main Hall',
      description: 'Laptop theft from study area'
    }
  ];
    
    // Save to localStorage for persistence
    localStorage.setItem('adminIncidents', JSON.stringify(mockIncidents));
    return mockIncidents;
  };

  const incidents = getIncidents();

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

  const handleDropdownToggle = (incidentId, e) => {
    e.stopPropagation();
    setActiveDropdown(activeDropdown === incidentId ? null : incidentId);
  };

  const handleDropdownAction = (action, incidentId) => {
    setActiveDropdown(null);
    
    const incident = incidents.find(inc => inc.id === incidentId);
    if (!incident) return;

    switch(action) {
      case 'view':
        navigate(`/admin/incident/${incidentId}`);
        break;
      case 'assign':
        setAssignmentModal({ isOpen: true, incident: incident });
        break;
      case 'update':
        setStatusModal({ isOpen: true, incident: incident });
        break;
      case 'remarks':
        setRemarksModal({ isOpen: true, incident: incident });
        break;
      case 'resolve':
        handleMarkAsResolved(incidentId);
        break;
      default:
        break;
    }
  };

  const handleAssignStaff = (assignmentData) => {
    // Update incidents array with new assignment
    const updatedIncidents = incidents.map(inc => {
      if (inc.id === assignmentData.incidentId) {
        return {
          ...inc,
          assignedTo: `${assignmentData.staffName} (${assignmentData.departmentName})`
        };
      }
      return inc;
    });

    // Save to localStorage
    localStorage.setItem('adminIncidents', JSON.stringify(updatedIncidents));
    
    // Update state (in a real app, this would be handled by a state management system)
    // For now, we'll reload the page to reflect changes
    window.location.reload();
    
    setAssignmentModal({ isOpen: false, incident: null });
  };

  const handleUpdateStatus = (statusData) => {
    // Update incidents array with new status
    const updatedIncidents = incidents.map(inc => {
      if (inc.id === statusData.incidentId) {
        const updatedIncident = {
          ...inc,
          status: statusData.newStatus
        };
        
        // Add remark if notes provided
        if (statusData.notes) {
          updatedIncident.remarks = [
            ...(inc.remarks || []),
            {
              id: Date.now(),
              author: 'Admin User',
              message: `Status changed to ${statusData.newStatus}. ${statusData.notes}`,
              timestamp: new Date().toISOString()
            }
          ];
        }
        
        return updatedIncident;
      }
      return inc;
    });

    // Save to localStorage
    localStorage.setItem('adminIncidents', JSON.stringify(updatedIncidents));
    
    // Reload to reflect changes
    window.location.reload();
    
    setStatusModal({ isOpen: false, incident: null });
  };

  const handleAddRemark = (remarkData) => {
    // Update incidents array with new remark
    const updatedIncidents = incidents.map(inc => {
      if (inc.id === remarkData.incidentId) {
        return {
          ...inc,
          remarks: [
            ...(inc.remarks || []),
            {
              id: Date.now(),
              author: remarkData.author,
              message: remarkData.message,
              timestamp: remarkData.timestamp
            }
          ]
        };
      }
      return inc;
    });

    // Save to localStorage
    localStorage.setItem('adminIncidents', JSON.stringify(updatedIncidents));
    
    // Reload to reflect changes
    window.location.reload();
    
    setRemarksModal({ isOpen: false, incident: null });
  };

  const handleMarkAsResolved = (incidentId) => {
    if (!confirm('Are you sure you want to mark this incident as resolved?')) {
      return;
    }

    // Update incidents array with resolved status
    const updatedIncidents = incidents.map(inc => {
      if (inc.id === incidentId) {
        const updatedIncident = {
          ...inc,
          status: 'Resolved'
        };
        
        // Add automatic remark
        updatedIncident.remarks = [
          ...(inc.remarks || []),
          {
            id: Date.now(),
            author: 'Admin User',
            message: 'Incident marked as resolved by administrator',
            timestamp: new Date().toISOString()
          }
        ];
        
        return updatedIncident;
      }
      return inc;
    });

    // Save to localStorage
    localStorage.setItem('adminIncidents', JSON.stringify(updatedIncidents));
    
    // Reload to reflect changes
    window.location.reload();
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setActiveDropdown(null);
    };

    if (activeDropdown !== null) {
      document.addEventListener('click', handleClickOutside);
      return () => {
        document.removeEventListener('click', handleClickOutside);
      };
    }
  }, [activeDropdown]);

  const filteredIncidents = incidents.filter(incident => {
    const matchesSearch = incident.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         incident.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         incident.location.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || incident.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || incident.priority === priorityFilter;
    const matchesCategory = categoryFilter === 'all' || incident.category === categoryFilter;
    
    return matchesSearch && matchesStatus && matchesPriority && matchesCategory;
  });

  const stats = {
    total: incidents.length,
    pending: incidents.filter(i => i.status === 'Pending').length,
    inReview: incidents.filter(i => i.status === 'In Review').length,
    resolved: incidents.filter(i => i.status === 'Resolved').length,
    critical: incidents.filter(i => i.priority === 'Critical').length
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
            <div className="header-left-content">
              <button className="back-btn" onClick={() => navigate('/admin/dashboard')}>
                <ArrowLeft size={20} />
                Back to Dashboard
              </button>
              <h1>Incidents Management</h1>
              <p>View and manage all reported incidents</p>
            </div>
          </div>

          {/* Stats Overview */}
          <section className="stats-section">
            <div className="stats-grid">
              <div className="stat-card stat-total">
                <div className="stat-icon">
                  <FileText size={24} />
                </div>
                <div className="stat-content">
                  <h3>{stats.total}</h3>
                  <p>Total Incidents</p>
                </div>
              </div>

              <div className="stat-card stat-pending">
                <div className="stat-icon">
                  <Clock size={24} />
                </div>
                <div className="stat-content">
                  <h3>{stats.pending}</h3>
                  <p>Pending</p>
                </div>
              </div>

              <div className="stat-card stat-review">
                <div className="stat-icon">
                  <AlertCircle size={24} />
                </div>
                <div className="stat-content">
                  <h3>{stats.inReview}</h3>
                  <p>In Review</p>
                </div>
              </div>

              <div className="stat-card stat-resolved">
                <div className="stat-icon">
                  <CheckCircle size={24} />
                </div>
                <div className="stat-content">
                  <h3>{stats.resolved}</h3>
                  <p>Resolved</p>
                </div>
              </div>

              <div className="stat-card stat-pending">
                <div className="stat-icon">
                  <AlertCircle size={24} />
                </div>
                <div className="stat-content">
                  <h3>{stats.critical}</h3>
                  <p>Critical Priority</p>
                </div>
              </div>
            </div>
          </section>

          {/* Filters and Search */}
          <section className="filters-section">
            <div className="filters-header">
              <div className="search-wrapper">
                <Search size={18} />
                <input 
                  type="text" 
                  className="input" 
                  placeholder="Search incidents by ID, category, or location..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              
              <div className="filter-controls">
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
          </section>

          {/* Incidents Table */}
          <section className="incidents-section">
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
                    <th>Location</th>
                    <th>Submitted By</th>
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
                      <td>{incident.location}</td>
                      <td>{incident.submittedBy}</td>
                      <td>
                        <div className="action-buttons">
                          <div className="dropdown-wrapper">
                            <button 
                              className="btn btn-ghost btn-sm"
                              onClick={(e) => handleDropdownToggle(incident.id, e)}
                              title="More Options"
                            >
                              <MoreVertical size={16} />
                            </button>
                            
                            {activeDropdown === incident.id && (
                              <div className="action-dropdown">
                                <button 
                                  className="dropdown-item"
                                  onClick={() => handleDropdownAction('view', incident.id)}
                                >
                                  <Eye size={14} />
                                  View Details
                                </button>
                                <button 
                                  className="dropdown-item"
                                  onClick={() => handleDropdownAction('assign', incident.id)}
                                >
                                  <UserCheck size={14} />
                                  Assign Staff/Department
                                </button>
                                <button 
                                  className="dropdown-item"
                                  onClick={() => handleDropdownAction('update', incident.id)}
                                >
                                  <Edit size={14} />
                                  Update Status
                                </button>
                                <button 
                                  className="dropdown-item"
                                  onClick={() => handleDropdownAction('remarks', incident.id)}
                                >
                                  <MessageSquare size={14} />
                                  Add Remarks
                                </button>
                                <button 
                                  className="dropdown-item"
                                  onClick={() => handleDropdownAction('resolve', incident.id)}
                                >
                                  <Check size={14} />
                                  Mark as Resolved
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {filteredIncidents.length === 0 && (
                <div className="empty-state">
                  <AlertCircle size={48} />
                  <h3>No incidents found</h3>
                  <p>Try adjusting your search or filter criteria</p>
                </div>
              )}
            </div>
          </section>
        </div>
      </main>

      {/* Modals */}
      <AssignmentModal
        incident={assignmentModal.incident}
        isOpen={assignmentModal.isOpen}
        onClose={() => setAssignmentModal({ isOpen: false, incident: null })}
        onAssign={handleAssignStaff}
      />

      <StatusUpdateModal
        incident={statusModal.incident}
        isOpen={statusModal.isOpen}
        onClose={() => setStatusModal({ isOpen: false, incident: null })}
        onUpdateStatus={handleUpdateStatus}
      />

      <RemarksModal
        incident={remarksModal.incident}
        isOpen={remarksModal.isOpen}
        onClose={() => setRemarksModal({ isOpen: false, incident: null })}
        onAddRemark={handleAddRemark}
      />
    </div>
  );
}

export default AdminIncidents;