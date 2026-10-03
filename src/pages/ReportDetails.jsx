import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
  UserX
} from 'lucide-react';
import '../styles/designSystem.css';
import '../styles/reportDetails.css';

function ReportDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState('');

  useEffect(() => {
    const currentUser = localStorage.getItem('sentraCurrentUser');
    if (currentUser) {
      const user = JSON.parse(currentUser);
      setUserRole(user.role || '');
    }
  }, []);

  // Initialize with empty data, will be populated from localStorage
  const [reportData, setReportData] = useState({
    id: id || '',
    referenceId: '',
    category: '',
    dateTime: '',
    location: '',
    description: '',
    additionalDetails: '',
    status: '',
    anonymous: false,
    submittedDate: '',
    lastUpdated: '',
    assignedTo: '',
    priority: '',
    staffResponse: '',
    submittedBy: null,
    attachments: [],
    timeline: []
  });

  useEffect(() => {
    // Load actual incident data from localStorage
    try {
      const storedIncidents = localStorage.getItem('sentraIncidents');
      if (storedIncidents) {
        const incidents = JSON.parse(storedIncidents);
        const incident = incidents.find(inc => 
          inc.id === id || inc.referenceId === id
        );
        
        if (incident) {
          setReportData({
            id: incident.id || incident.referenceId,
            referenceId: incident.referenceId || incident.id,
            category: incident.category,
            dateTime: incident.dateTime,
            location: incident.location,
            description: incident.description,
            additionalDetails: incident.additionalDetails,
            status: incident.status,
            anonymous: incident.isAnonymous,
            submittedDate: incident.createdAt,
            lastUpdated: incident.updatedAt,
            assignedTo: incident.assignedDepartment,
            priority: incident.priority,
            staffResponse: incident.staffResponse,
            submittedBy: incident.isAnonymous ? null : {
              name: incident.contactName,
              email: incident.contactEmail,
              phone: incident.contactPhone
            },
            attachments: [], // Empty for now, could be added later
            timeline: incident.timeline || []
          });
        }
      }
    } catch (error) {
      console.error('Failed to load incident details:', error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  const handleBackToDashboard = () => {
    if (userRole === 'staff') {
      navigate('/staff/dashboard');
    } else if (userRole === 'administrator') {
      navigate('/admin/dashboard');
    } else {
      navigate('/dashboard');
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Submitted':
        return <CheckCircle size={20} />;
      case 'Pending':
        return <Clock size={20} />;
      case 'Assigned':
        return <Clock size={20} />;
      case 'In Progress':
        return <AlertCircle size={20} />;
      case 'Resolution Submitted':
        return <AlertCircle size={20} />;
      case 'Resolved':
        return <CheckCircle size={20} />;
      default:
        return <Clock size={20} />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Submitted':
        return 'status-submitted';
      case 'Pending':
        return 'status-pending';
      case 'Assigned':
        return 'status-pending';
      case 'In Progress':
        return 'status-review';
      case 'Resolution Submitted':
        return 'status-review';
      case 'Resolved':
        return 'status-resolved';
      default:
        return 'status-pending';
    }
  };

  const handleDownloadAttachment = (fileName) => {
    console.log('Downloading:', fileName);
    // In real app, this would trigger a download
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <p>Loading report details...</p>
      </div>
    );
  }

  if (!reportData.id) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <p>Report not found</p>
      </div>
    );
  }

  return (
    <div className="report-details-container">
      <div className="container">
        {/* Header */}
        <div className="page-header">
          <button className="back-btn" onClick={handleBackToDashboard}>
            <ArrowLeft size={20} />
            Back to Dashboard
          </button>
          <div className="header-content">
            <Shield size={36} />
            <div>
              <h1>Report Details</h1>
              <p>View complete information about this incident report</p>
            </div>
          </div>
        </div>

        {/* Status Banner */}
        <div className="status-banner">
          <div className="status-info">
            <div className={`status-badge ${getStatusColor(reportData.status)}`}>
              {getStatusIcon(reportData.status)}
              {reportData.status}
            </div>
            <div className="reference-id">
              <Shield size={16} />
              {reportData.referenceId || reportData.id}
            </div>
          </div>
          <div className="last-updated">
            <Clock size={16} />
            Last updated: {reportData.lastUpdated ? new Date(reportData.lastUpdated).toLocaleDateString() : 'Not available'}
          </div>
        </div>

        <div className="details-grid">
          {/* Main Details */}
          <div className="main-details">
            {/* Incident Information */}
            <div className="detail-section">
              <h2>Incident Information</h2>
              
              <div className="info-grid">
                <div className="info-item">
                  <div className="info-label">
                    <FileText size={16} />
                    Category
                  </div>
                  <div className="info-value">{reportData.category || 'Not specified'}</div>
                </div>

                <div className="info-item">
                  <div className="info-label">
                    <Calendar size={16} />
                    Date & Time
                  </div>
                  <div className="info-value">
                    {reportData.dateTime ? new Date(reportData.dateTime).toLocaleString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    }) : 'Not specified'}
                  </div>
                </div>

                <div className="info-item full-width">
                  <div className="info-label">
                    <MapPin size={16} />
                    Location
                  </div>
                  <div className="info-value">{reportData.location || 'Not specified'}</div>
                </div>
              </div>

              <div className="description-section">
                <h3>Description</h3>
                <p>{reportData.description || 'No description provided'}</p>
              </div>

              {reportData.additionalDetails && (
                <div className="additional-details">
                  <h3>Additional Details</h3>
                  <p>{reportData.additionalDetails}</p>
                </div>
              )}
            </div>

            {/* Attachments */}
            {reportData.attachments && reportData.attachments.length > 0 && (
              <div className="detail-section">
                <h2>Attachments</h2>
                <div className="attachments-list">
                  {reportData.attachments.map((attachment, index) => (
                    <div key={index} className="attachment-item">
                      <div className="attachment-info">
                        <div className="attachment-icon">
                          <FileText size={20} />
                        </div>
                        <div className="attachment-details">
                          <span className="attachment-name">{attachment.name}</span>
                          <span className="attachment-size">{attachment.size}</span>
                        </div>
                      </div>
                      <button 
                        className="download-btn"
                        onClick={() => handleDownloadAttachment(attachment.name)}
                      >
                        <Download size={16} />
                        Download
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Timeline */}
            <div className="detail-section">
              <h2>Status Timeline</h2>
              <div className="timeline">
                {reportData.timeline && reportData.timeline.length > 0 ? (
                  reportData.timeline.map((item, index) => (
                    <div key={index} className="timeline-item">
                      <div className="timeline-marker">
                        {getStatusIcon(item.status)}
                      </div>
                      <div className="timeline-content">
                        <div className="timeline-header">
                          <h3>{item.status}</h3>
                          <span className="timeline-date">
                            {item.date ? new Date(item.date).toLocaleString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            }) : 'Not specified'}
                          </span>
                        </div>
                        <p>{item.description}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="empty-state-text">No timeline information available</p>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="sidebar">
            {/* Submission Info */}
            <div className="sidebar-section">
              <h3>Submission Information</h3>
              <div className="submission-info">
                <div className="info-row">
                  <span className="label">Submitted:</span>
                  <span className="value">
                    {reportData.submittedDate ? new Date(reportData.submittedDate).toLocaleDateString() : 'Not specified'}
                  </span>
                </div>
                <div className="info-row">
                  <span className="label">Reference ID:</span>
                  <span className="value">{reportData.referenceId || reportData.id}</span>
                </div>
                <div className="info-row">
                  <span className="label">Submission Type:</span>
                  <span className="value">
                    {reportData.anonymous ? (
                      <span className="anonymous-badge">
                        <UserX size={12} />
                        Anonymous
                      </span>
                    ) : (
                      <span className="identified-badge">
                        <User size={12} />
                        Identified
                      </span>
                    )}
                  </span>
                </div>
              </div>
            </div>

            {/* Reporter Information */}
            {!reportData.anonymous && reportData.submittedBy && (
              <div className="sidebar-section">
                <h3>Reporter Information</h3>
                <div className="reporter-info">
                  <div className="reporter-header">
                    <div className="reporter-avatar">
                      <User size={24} />
                    </div>
                    <div className="reporter-name">{reportData.submittedBy.name}</div>
                  </div>
                  <div className="reporter-details">
                    <div className="info-row">
                      <span className="label">Email:</span>
                      <span className="value">{reportData.submittedBy.email}</span>
                    </div>
                    {reportData.submittedBy.phone && (
                      <div className="info-row">
                        <span className="label">Phone:</span>
                        <span className="value">{reportData.submittedBy.phone}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Assigned To */}
            {reportData.assignedTo && (
              <div className="sidebar-section">
                <h3>Assigned To</h3>
                <div className="assigned-info">
                  <div className="assigned-avatar">
                    <Shield size={24} />
                  </div>
                  <div className="assigned-name">{reportData.assignedTo}</div>
                </div>
              </div>
            )}

            {/* Priority */}
            {reportData.priority && (
              <div className="sidebar-section">
                <h3>Priority</h3>
                <div className="priority-display">
                  <span className="info-value">{reportData.priority}</span>
                </div>
              </div>
            )}

            {/* Staff Response */}
            {reportData.staffResponse && (
              <div className="sidebar-section">
                <h3>Staff Response</h3>
                <div className="staff-response">
                  <p>{reportData.staffResponse}</p>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="sidebar-section">
              <h3>Actions</h3>
              <div className="action-buttons">
                <button className="btn btn-secondary btn-full">
                  <FileText size={16} />
                  Print Report
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ReportDetails;