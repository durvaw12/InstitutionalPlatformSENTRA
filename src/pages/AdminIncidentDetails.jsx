import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import { 
  Shield, 
  ArrowLeft, 
  Clock, 
  AlertCircle, 
  CheckCircle, 
  MapPin, 
  Calendar,
  FileText,
  Download,
  User,
  Bell,
  Menu,
  X,
  LogOut,
  BarChart3,
  Settings
} from 'lucide-react';
import '../styles/designSystem.css';
import '../styles/adminDashboard.css';

function AdminIncidentDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [activeTab, setActiveTab] = useState('details');

  // Initialize incidents from localStorage or use mock data
  const getIncidents = () => {
    const stored = localStorage.getItem('adminIncidents');
    if (stored) {
      try {
        const incidentsArray = JSON.parse(stored);
        // Convert array to object for easier lookup by ID
        return incidentsArray.reduce((acc, incident) => {
          acc[incident.id] = incident;
          return acc;
        }, {});
      } catch (error) {
        console.error('Error parsing incidents from localStorage:', error);
        return {};
      }
    }
    
    // Mock incident data based on ID - first as array for consistency with AdminIncidents
    const mockIncidentsArray = [
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
    
    // Save to localStorage as array for consistency
    localStorage.setItem('adminIncidents', JSON.stringify(mockIncidentsArray));
    
    // Convert to object for easier lookup
    return mockIncidentsArray.reduce((acc, incident) => {
      acc[incident.id] = incident;
      return acc;
    }, {});
  };

  const [incidentData, setIncidentData] = useState(getIncidents()[id] || null);

  // Re-fetch incident data when ID changes
  useEffect(() => {
    const incidents = getIncidents();
    const incident = incidents[id];
    if (incident) {
      setIncidentData(incident);
    }
  }, [id]);

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
    }
  ];

  useEffect(() => {
    // Simulate loading
    setTimeout(() => {
      setLoading(false);
    }, 500);
  }, [id]);

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

  if (loading) {
    return (
      <div className="admin-dashboard-container">
        <div className="loading-state">
          <Shield size={48} />
          <p>Loading incident details...</p>
        </div>
      </div>
    );
  }

  if (!incidentData) {
    return (
      <div className="admin-dashboard-container">
        <header className="admin-header">
          <div className="header-left">
            <div className="logo">
              <Shield size={32} />
              <span>Sentra Admin</span>
            </div>
          </div>
        </header>
        <main className="admin-main">
          <div className="container">
            <div className="empty-state">
              <AlertCircle size={48} />
              <h3>Incident Not Found</h3>
              <p>The incident you're looking for doesn't exist or you don't have permission to view it.</p>
              <button className="btn btn-primary" onClick={() => navigate('/admin/incidents')}>
                Back to Incidents
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="admin-dashboard-container">
      {/* Header */}
      <header className="admin-header">
        <div className="header-left">
          <button 
            className="mobile-menu-btn"
            onClick={() => setShowMobileMenu(!showMobileMenu)}
          >
            {showMobileMenu ? <X /> : <Menu />}
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
          <Link to="/admin/incidents" className={`nav-item ${location.pathname.startsWith('/admin/incident') || location.pathname === '/admin/incidents' ? 'active' : ''}`}>
            <FileText size={18} />
            Incidents
          </Link>
          <Link to="/admin/users" className={`nav-item ${location.pathname === '/admin/users' ? 'active' : ''}`}>
            <User size={18} />
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
              <button className="back-btn" onClick={() => navigate('/admin/incidents')}>
                <ArrowLeft size={20} />
                Back to Incidents
              </button>
              <h1>Incident Details</h1>
              <p>View and manage incident {incidentData.id}</p>
            </div>
          </div>

          {/* Incident Details */}
          <div className="incident-details-container">
            {/* Basic Info Card */}
            <div className="detail-card">
              <div className="detail-card-header">
                <h2>Basic Information</h2>
                <div className="detail-badges">
                  {getPriorityBadge(incidentData.priority)}
                  {getStatusBadge(incidentData.status)}
                </div>
              </div>
              
              <div className="detail-grid">
                <div className="detail-item">
                  <label>Reference ID</label>
                  <p className="detail-value">{incidentData.id}</p>
                </div>
                <div className="detail-item">
                  <label>Category</label>
                  <p className="detail-value">{incidentData.category}</p>
                </div>
                <div className="detail-item">
                  <label>Date Reported</label>
                  <p className="detail-value">
                    <Calendar size={14} />
                    {new Date(incidentData.date).toLocaleDateString()}
                  </p>
                </div>
                <div className="detail-item">
                  <label>Submitted By</label>
                  <p className="detail-value">{incidentData.submittedBy}</p>
                </div>
                <div className="detail-item">
                  <label>Location</label>
                  <p className="detail-value">
                    <MapPin size={14} />
                    {incidentData.location}
                  </p>
                </div>
                <div className="detail-item">
                  <label>Assigned To</label>
                  <p className="detail-value">{incidentData.assignedTo}</p>
                </div>
              </div>
            </div>

            {/* Description Card */}
            <div className="detail-card">
              <div className="detail-card-header">
                <h2>Description</h2>
              </div>
              
              <div className="detail-content">
                <p>{incidentData.description}</p>
                {incidentData.additionalDetails && (
                  <div className="additional-details">
                    <h4>Additional Details</h4>
                    <p>{incidentData.additionalDetails}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Remarks Card */}
            <div className="detail-card">
              <div className="detail-card-header">
                <h2>Remarks & Updates</h2>
              </div>
              
              <div className="remarks-list">
                {incidentData.remarks.map(remark => (
                  <div key={remark.id} className="remark-item">
                    <div className="remark-header">
                      <span className="remark-author">{remark.author}</span>
                      <span className="remark-time">
                        {new Date(remark.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <p className="remark-message">{remark.message}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Attachments Card */}
            {incidentData.attachments.length > 0 && (
              <div className="detail-card">
                <div className="detail-card-header">
                  <h2>Attachments</h2>
                </div>
                
                <div className="attachments-list">
                  {incidentData.attachments.map((attachment, index) => (
                    <div key={index} className="attachment-item">
                      <FileText size={20} />
                      <div className="attachment-info">
                        <span className="attachment-name">{attachment.name}</span>
                        <span className="attachment-size">{attachment.size}</span>
                      </div>
                      <button className="btn btn-sm btn-ghost">
                        <Download size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Timeline Card */}
            <div className="detail-card">
              <div className="detail-card-header">
                <h2>Timeline</h2>
              </div>
              
              <div className="timeline">
                <div className="timeline-item">
                  <div className="timeline-dot"></div>
                  <div className="timeline-content">
                    <span className="timeline-time">
                      {new Date(incidentData.submittedDate).toLocaleString()}
                    </span>
                    <p>Incident reported</p>
                  </div>
                </div>
                <div className="timeline-item">
                  <div className="timeline-dot"></div>
                  <div className="timeline-content">
                    <span className="timeline-time">
                      {new Date(incidentData.lastUpdated).toLocaleString()}
                    </span>
                    <p>Last updated</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default AdminIncidentDetails;