import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Search, Shield, Clock, AlertCircle, CheckCircle, FileText, ArrowLeft } from 'lucide-react';
import '../styles/designSystem.css';
import '../styles/trackReport.css';

function TrackReport() {
  const navigate = useNavigate();
  const location = useLocation();
  const [referenceId, setReferenceId] = useState(location.state?.referenceId || '');
  const [searchResult, setSearchResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [userRole, setUserRole] = useState('');

  useEffect(() => {
    const currentUser = localStorage.getItem('sentraCurrentUser');
    if (currentUser) {
      const user = JSON.parse(currentUser);
      setUserRole(user.role || '');
    }
  }, []);

  const handleBackToDashboard = () => {
    if (userRole === 'staff') {
      navigate('/staff/dashboard');
    } else if (userRole === 'administrator') {
      navigate('/admin/dashboard');
    } else {
      navigate('/dashboard');
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!referenceId.trim()) {
      setError('Please enter a reference ID');
      return;
    }

    setLoading(true);
    setError('');
    setSearchResult(null);

    // Read from localStorage
    try {
      const storedIncidents = JSON.parse(localStorage.getItem('sentraIncidents')) || [];
      
      // Find incident by reference ID
      const incident = storedIncidents.find(inc => 
        inc.referenceId === referenceId || inc.id === referenceId
      );
      
      if (incident) {
        // Format the incident data for display
        const result = {
          id: incident.referenceId || incident.id,
          category: incident.category,
          location: incident.location,
          date: incident.createdAt || incident.dateTime,
          status: incident.status,
          anonymous: incident.isAnonymous,
          assignedTo: incident.assignedDepartment || incident.assignedTo || null,
          lastUpdated: incident.updatedAt || incident.createdAt,
          timeline: incident.timeline || [
            { status: 'Submitted', date: incident.createdAt, description: 'Report submitted successfully' },
            { status: incident.status, date: incident.updatedAt, description: `Current status: ${incident.status}` }
          ]
        };
        setSearchResult(result);
      } else {
        setError('No report found with this reference ID. Please check and try again.');
      }
    } catch (error) {
      console.error('Failed to search for report:', error);
      setError('An error occurred while searching. Please try again.');
    } finally {
      setLoading(false);
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

  return (
    <div className="track-report-container">
      <div className="container">
        {/* Header */}
        <div className="page-header">
          <button className="back-btn" onClick={handleBackToDashboard}>
            <ArrowLeft size={20} />
            Back to Dashboard
          </button>
          <div className="header-content">
            <Search size={36} />
            <div>
              <h1>Track Your Report</h1>
              <p>Enter your reference ID to check the status of your incident report</p>
            </div>
          </div>
        </div>

        {/* Search Form */}
        <div className="search-section">
          <form className="search-form" onSubmit={handleSearch}>
            <div className="search-input-wrapper">
              <div className="search-icon">
                <Search size={20} />
              </div>
              <input
                type="text"
                className="input search-input"
                placeholder="Enter your reference ID (e.g., SNT-2026-004281)"
                value={referenceId}
                onChange={(e) => setReferenceId(e.target.value.toUpperCase())}
              />
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Searching...' : 'Track Report'}
              </button>
            </div>
            {error && (
              <div className="error-message">
                <AlertCircle size={16} />
                {error}
              </div>
            )}
          </form>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Searching for your report...</p>
          </div>
        )}

        {/* Search Results */}
        {searchResult && !loading && (
          <div className="search-results">
            {/* Report Summary Card */}
            <div className="report-summary-card">
              <div className="summary-header">
                <div className="reference-badge">
                  <Shield size={16} />
                  {searchResult.id}
                </div>
                <div className={`status-badge ${getStatusColor(searchResult.status)}`}>
                  {getStatusIcon(searchResult.status)}
                  {searchResult.status}
                </div>
              </div>

              <div className="summary-details">
                <div className="detail-row">
                  <span className="detail-label">Category:</span>
                  <span className="detail-value">{searchResult.category}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Location:</span>
                  <span className="detail-value">{searchResult.location}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Submitted:</span>
                  <span className="detail-value">
                    {new Date(searchResult.date).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Last Updated:</span>
                  <span className="detail-value">
                    {new Date(searchResult.lastUpdated).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </span>
                </div>
                {searchResult.assignedTo && (
                  <div className="detail-row">
                    <span className="detail-label">Assigned To:</span>
                    <span className="detail-value">{searchResult.assignedTo}</span>
                  </div>
                )}
                <div className="detail-row">
                  <span className="detail-label">Submission Type:</span>
                  <span className="detail-value">
                    {searchResult.anonymous ? (
                      <span className="anonymous-badge">
                        <Shield size={12} />
                        Anonymous
                      </span>
                    ) : (
                      'Identified'
                    )}
                  </span>
                </div>
              </div>

              <div className="summary-actions">
                <button 
                  className="btn btn-secondary"
                  onClick={() => navigate(`/report/${searchResult.id}`)}
                >
                  <FileText size={16} />
                  View Full Details
                </button>
              </div>
            </div>

            {/* Timeline */}
            <div className="timeline-section">
              <h2>Report Timeline</h2>
              <div className="timeline">
                {searchResult.timeline.map((item, index) => (
                  <div key={index} className="timeline-item">
                    <div className="timeline-marker">
                      {getStatusIcon(item.status)}
                    </div>
                    <div className="timeline-content">
                      <div className="timeline-header">
                        <h3>{item.status}</h3>
                        <span className="timeline-date">
                          {new Date(item.date).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </span>
                      </div>
                      <p>{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!searchResult && !loading && !error && (
          <div className="empty-state">
            <div className="empty-state-icon">
              <Search size={48} />
            </div>
            <h3 className="empty-state-title">Track Your Report</h3>
            <p className="empty-state-description">
              Enter the reference ID you received when you submitted your report to see its current status.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default TrackReport;