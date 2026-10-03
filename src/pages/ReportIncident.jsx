import { useState, useEffect } from 'react';
import { 
  Shield, 
  Upload, 
  X, 
  AlertCircle, 
  CheckCircle,
  ArrowLeft,
  Eye,
  EyeOff
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import '../styles/designSystem.css';
import '../styles/reportIncident.css';

function ReportIncident() {
  const navigate = useNavigate();
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [errors, setErrors] = useState({});
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [uploadProgress, setUploadProgress] = useState({});
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
  const [formData, setFormData] = useState({
    category: '',
    dateTime: '',
    location: '',
    description: ''
  });

  const categories = [
    'Safety Hazard',
    'Harassment',
    'Theft',
    'Facility Issue',
    'Medical Emergency',
    'Security Concern',
    'Academic Misconduct',
    'Other'
  ];

  const validateForm = () => {
    const newErrors = {};

    if (!formData.category) {
      newErrors.category = 'Please select an incident category';
    }

    if (!formData.dateTime) {
      newErrors.dateTime = 'Please provide the date and time of the incident';
    }

    if (!formData.location) {
      newErrors.location = 'Please provide the location of the incident';
    }

    if (!formData.description) {
      newErrors.description = 'Please provide a description of the incident';
    } else if (formData.description.length < 20) {
      newErrors.description = 'Description must be at least 20 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    
    files.forEach(file => {
      const fileId = Math.random().toString(36).substr(2, 9);
      setUploadedFiles(prev => [...prev, { id: fileId, file, name: file.name }]);
      
      // Simulate upload progress
      let progress = 0;
      const interval = setInterval(() => {
        progress += Math.random() * 30;
        if (progress >= 100) {
          progress = 100;
          clearInterval(interval);
        }
        setUploadProgress(prev => ({ ...prev, [fileId]: progress }));
      }, 200);
    });
  };

  const handleRemoveFile = (fileId) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== fileId));
    setUploadProgress(prev => {
      const newProgress = { ...prev };
      delete newProgress[fileId];
      return newProgress;
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      setShowConfirmModal(true);
    }
  };

  const handleConfirmSubmit = () => {
    // Generate reference ID
    const referenceId = `SNT-2026-${String(Math.floor(Math.random() * 900000) + 100000)}`;
    
    // Auto-assign department based on category
    const categoryDepartmentMap = {
      'Safety Hazard': 'Campus Security',
      'Harassment': 'Student Affairs',
      'Theft': 'Campus Security',
      'Facility Issue': 'IT Department',
      'Medical Emergency': 'Health Services',
      'Security Concern': 'Campus Security',
      'Academic Misconduct': 'Academic Affairs',
      'Other': 'Student Affairs'
    };

    const assignedDepartment = categoryDepartmentMap[formData.category] || 'Student Affairs';

    // Create incident object with proper data structure
    const incident = {
      id: referenceId,
      referenceId: referenceId,
      category: formData.category,
      dateTime: formData.dateTime,
      location: formData.location,
      description: formData.description,
      isAnonymous: isAnonymous,
      status: 'Assigned', // Auto-assign for demo purposes
      priority: 'Medium', // Default priority
      assignedDepartment: assignedDepartment,
      assignedBy: 'System',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      timeline: [
        {
          status: 'Submitted',
          date: new Date().toISOString(),
          description: 'Report submitted successfully'
        },
        {
          status: 'Pending',
          date: new Date().toISOString(),
          description: 'Report received and queued for review'
        },
        {
          status: 'Assigned',
          date: new Date().toISOString(),
          description: `Auto-assigned to ${assignedDepartment}`
        }
      ]
    };
    
    // Save to localStorage
    try {
      const existingIncidents = JSON.parse(localStorage.getItem('sentraIncidents')) || [];
      existingIncidents.push(incident);
      localStorage.setItem('sentraIncidents', JSON.stringify(existingIncidents));
      
      // Initialize admin signals if not exists
      const existingSignals = JSON.parse(localStorage.getItem('sentraAdminResolutionSignals')) || [];
      localStorage.setItem('sentraAdminResolutionSignals', JSON.stringify(existingSignals));
      
      // Navigate to confirmation page
      navigate('/report-confirmation', { 
        state: { 
          referenceId, 
          isAnonymous,
          incidentData: formData 
        } 
      });
    } catch (error) {
      console.error('Failed to save incident:', error);
      alert('Failed to submit report. Please try again.');
    }
  };

  const handleCancel = () => {
    if (confirm('Are you sure you want to cancel? Your progress will be lost.')) {
      handleBackToDashboard();
    }
  };

  return (
    <div className="report-incident-container">
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
              <h1>Report an Incident</h1>
              <p>Submit an incident report securely and confidentially</p>
            </div>
          </div>
        </div>

        {/* Privacy Notice */}
        <div className="privacy-notice">
          <div className="privacy-icon">
            <Shield size={24} />
          </div>
          <div className="privacy-content">
            <h3>Your information is handled securely and confidentially</h3>
            <p>All reports are reviewed by trained staff. You may choose to submit anonymously if you prefer.</p>
          </div>
        </div>

        {/* Form */}
        <form className="incident-form" onSubmit={handleSubmit}>
          {/* Anonymous Toggle */}
          <div className="form-section">
            <div className="anonymous-toggle">
              <label className="toggle-label">
                <input
                  type="checkbox"
                  checked={isAnonymous}
                  onChange={(e) => setIsAnonymous(e.target.checked)}
                />
                <div className="toggle-switch">
                  <div className="toggle-slider"></div>
                </div>
                <span>Submit this report anonymously</span>
              </label>
              {isAnonymous && (
                <div className="anonymous-info">
                  <Shield size={16} />
                  <span>Your identity will not be shared with administrators</span>
                </div>
              )}
            </div>
          </div>

          {/* Incident Details */}
          <div className="form-section">
            <h2>Incident Details</h2>
            
            <div className="form-group">
              <label className="label label-required" htmlFor="category">
                Incident Category
              </label>
              <select
                id="category"
                name="category"
                className={`select ${errors.category ? 'input-error' : ''}`}
                value={formData.category}
                onChange={handleChange}
              >
                <option value="">Select a category</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
              {errors.category && (
                <div className="error-message">
                  <AlertCircle size={16} />
                  {errors.category}
                </div>
              )}
            </div>

            <div className="form-group">
              <label className="label label-required" htmlFor="dateTime">
                Date and Time of Incident
              </label>
              <input
                type="datetime-local"
                id="dateTime"
                name="dateTime"
                className={`input ${errors.dateTime ? 'input-error' : ''}`}
                value={formData.dateTime}
                onChange={handleChange}
              />
              {errors.dateTime && (
                <div className="error-message">
                  <AlertCircle size={16} />
                  {errors.dateTime}
                </div>
              )}
            </div>

            <div className="form-group">
              <label className="label label-required" htmlFor="location">
                Location
              </label>
              <input
                type="text"
                id="location"
                name="location"
                className={`input ${errors.location ? 'input-error' : ''}`}
                placeholder="e.g., Main Library, 2nd Floor, Room 204"
                value={formData.location}
                onChange={handleChange}
              />
              {errors.location && (
                <div className="error-message">
                  <AlertCircle size={16} />
                  {errors.location}
                </div>
              )}
            </div>

            <div className="form-group">
              <label className="label label-required" htmlFor="description">
                Incident Description
              </label>
              <textarea
                id="description"
                name="description"
                className={`textarea ${errors.description ? 'input-error' : ''}`}
                placeholder="Please provide a detailed description of what happened..."
                value={formData.description}
                onChange={handleChange}
                rows={6}
              />
              {errors.description && (
                <div className="error-message">
                  <AlertCircle size={16} />
                  {errors.description}
                </div>
              )}
              <div className="char-count">
                {formData.description.length} characters
              </div>
            </div>
          </div>

          {/* File Upload */}
          <div className="form-section">
            <h2>Attachments (Optional)</h2>
            <div className="file-upload-area">
              <input
                type="file"
                id="fileUpload"
                multiple
                onChange={handleFileUpload}
                accept="image/*,.pdf,.doc,.docx"
                style={{ display: 'none' }}
              />
              <label htmlFor="fileUpload" className="file-upload-label">
                <Upload size={32} />
                <div>
                  <p>Click to upload or drag and drop</p>
                  <span>SVG, PNG, JPG or PDF (max. 10MB each)</span>
                </div>
              </label>
            </div>

            {uploadedFiles.length > 0 && (
              <div className="uploaded-files">
                {uploadedFiles.map(({ id, name }) => (
                  <div key={id} className="file-item">
                    <div className="file-info">
                      <Shield size={16} />
                      <span>{name}</span>
                    </div>
                    <div className="file-actions">
                      {uploadProgress[id] < 100 ? (
                        <div className="upload-progress">
                          <div 
                            className="progress-bar"
                            style={{ width: `${uploadProgress[id]}%` }}
                          />
                          <span>{Math.round(uploadProgress[id])}%</span>
                        </div>
                      ) : (
                        <>
                          <CheckCircle size={16} className="upload-success" />
                          <button 
                            type="button"
                            className="remove-file-btn"
                            onClick={() => handleRemoveFile(id)}
                          >
                            <X size={16} />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Form Actions */}
          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={handleCancel}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Submit Report
            </button>
          </div>
        </form>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>Confirm Submission</h2>
              <button 
                className="modal-close"
                onClick={() => setShowConfirmModal(false)}
              >
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <div className="confirm-content">
                <Shield size={48} />
                <h3>Ready to submit your report?</h3>
                <p>
                  {isAnonymous 
                    ? 'Your report will be submitted anonymously. Administrators will not see your identity.'
                    : 'Your contact information will be included with this report.'
                  }
                </p>
                <div className="report-summary">
                  <div className="summary-item">
                    <span className="label">Category:</span>
                    <span>{formData.category}</span>
                  </div>
                  <div className="summary-item">
                    <span className="label">Location:</span>
                    <span>{formData.location}</span>
                  </div>
                  <div className="summary-item">
                    <span className="label">Anonymous:</span>
                    <span>{isAnonymous ? 'Yes' : 'No'}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button 
                className="btn btn-secondary"
                onClick={() => setShowConfirmModal(false)}
              >
                Go Back
              </button>
              <button 
                className="btn btn-primary"
                onClick={handleConfirmSubmit}
              >
                Confirm & Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ReportIncident;