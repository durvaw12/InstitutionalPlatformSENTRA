import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { CheckCircle, Copy, Home, FileText, Search } from 'lucide-react';
import '../styles/designSystem.css';
import '../styles/reportConfirmation.css';

function ReportConfirmation() {
  const navigate = useNavigate();
  const location = useLocation();
  const [copied, setCopied] = useState(false);
  const [userRole, setUserRole] = useState('');

  const { referenceId, isAnonymous, incidentData } = location.state || {
    referenceId: 'SNT-2026-004281',
    isAnonymous: false,
    incidentData: {}
  };

  useEffect(() => {
    const currentUser = localStorage.getItem('sentraCurrentUser');
    if (currentUser) {
      const user = JSON.parse(currentUser);
      setUserRole(user.role || '');
    }
  }, []);

  const handleCopyReference = () => {
    navigator.clipboard.writeText(referenceId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleTrackReport = () => {
    navigate('/track-report', { state: { referenceId } });
  };

  const handleSubmitAnother = () => {
    navigate('/report-incident');
  };

  const handleGoToDashboard = () => {
    if (userRole === 'staff') {
      navigate('/staff/dashboard');
    } else if (userRole === 'administrator') {
      navigate('/admin/dashboard');
    } else {
      navigate('/dashboard');
    }
  };

  return (
    <div className="confirmation-container">
      <div className="container">
        <div className="confirmation-card">
          {/* Success Icon */}
          <div className="success-icon">
            <CheckCircle size={64} />
          </div>

          {/* Success Message */}
          <div className="success-content">
            <h1>Report Submitted Successfully</h1>
            <p>
              {isAnonymous 
                ? 'Your anonymous report has been submitted securely. Administrators will not see your identity.'
                : 'Your report has been submitted successfully. Thank you for helping keep our campus safe.'
              }
            </p>
          </div>

          {/* Reference ID Card */}
          <div className="reference-card">
            <div className="reference-header">
              <h3>Your Reference ID</h3>
              <p>Save this ID to track your report status</p>
            </div>
            
            <div className="reference-id-display">
              <span className="reference-id">{referenceId}</span>
              <button 
                className="copy-btn"
                onClick={handleCopyReference}
                title={copied ? 'Copied!' : 'Copy to clipboard'}
              >
                {copied ? <CheckCircle size={18} /> : <Copy size={18} />}
              </button>
            </div>

            <div className="reference-details">
              <div className="detail-item">
                <span className="detail-label">Status:</span>
                <span className="detail-value status-pending">Pending</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Submitted:</span>
                <span className="detail-value">
                  {new Date().toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Submission Type:</span>
                <span className="detail-value">
                  {isAnonymous ? 'Anonymous' : 'Identified'}
                </span>
              </div>
            </div>
          </div>

          {/* Important Notice */}
          <div className="important-notice">
            <div className="notice-icon">
              <FileText size={24} />
            </div>
            <div className="notice-content">
              <h4>Important</h4>
              <p>
                Please save your reference ID. You will need it to check the status of your report 
                and receive updates. Without this ID, we cannot provide information about your specific report.
              </p>
            </div>
          </div>

          {/* Next Steps */}
          <div className="next-steps">
            <h3>What happens next?</h3>
            <div className="steps-list">
              <div className="step-item">
                <div className="step-number">1</div>
                <div className="step-content">
                  <h4>Review</h4>
                  <p>Your report will be reviewed by trained staff within 1-2 business days.</p>
                </div>
              </div>
              <div className="step-item">
                <div className="step-number">2</div>
                <div className="step-content">
                  <h4>Investigation</h4>
                  <p>If appropriate, an investigation will be initiated based on the information provided.</p>
                </div>
              </div>
              <div className="step-item">
                <div className="step-number">3</div>
                <div className="step-content">
                  <h4>Updates</h4>
                  <p>Use your reference ID to track progress and receive status updates.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="action-buttons">
            <button className="btn btn-primary btn-lg" onClick={handleTrackReport}>
              <Search size={20} />
              Track This Report
            </button>
            <button className="btn btn-secondary btn-lg" onClick={handleSubmitAnother}>
              <FileText size={20} />
              Submit Another Report
            </button>
            <button className="btn btn-ghost btn-lg" onClick={handleGoToDashboard}>
              <Home size={20} />
              Go to Dashboard
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ReportConfirmation;