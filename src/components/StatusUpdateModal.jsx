import { useState } from 'react';
import { X, Edit, Clock, AlertCircle, CheckCircle } from 'lucide-react';

function StatusUpdateModal({ incident, isOpen, onClose, onUpdateStatus }) {
  const [selectedStatus, setSelectedStatus] = useState('');
  const [notes, setNotes] = useState('');

  const statusOptions = [
    { value: 'Pending', label: 'Pending', icon: Clock, color: 'warning' },
    { value: 'In Review', label: 'In Review', icon: AlertCircle, color: 'info' },
    { value: 'Resolved', label: 'Resolved', icon: CheckCircle, color: 'success' }
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!selectedStatus) {
      alert('Please select a status');
      return;
    }

    onUpdateStatus({
      incidentId: incident.id,
      newStatus: selectedStatus,
      notes: notes
    });

    // Reset form
    setSelectedStatus('');
    setNotes('');
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>
            <Edit size={20} />
            Update Incident Status
          </h2>
          <button className="modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          <div className="incident-info">
            <p><strong>Incident:</strong> {incident.id}</p>
            <p><strong>Category:</strong> {incident.category}</p>
            <p><strong>Current Status:</strong> {incident.status}</p>
          </div>

          <form onSubmit={handleSubmit} className="status-form">
            <div className="form-group">
              <label className="label label-required">
                <Edit size={16} />
                New Status
              </label>
              <div className="status-options">
                {statusOptions.map(option => {
                  const Icon = option.icon;
                  return (
                    <label key={option.value} className="status-option">
                      <input
                        type="radio"
                        name="status"
                        value={option.value}
                        checked={selectedStatus === option.value}
                        onChange={(e) => setSelectedStatus(e.target.value)}
                      />
                      <div className={`status-option-content ${selectedStatus === option.value ? 'selected' : ''}`}>
                        <Icon size={16} />
                        <span>{option.label}</span>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="form-group">
              <label className="label">
                Notes (Optional)
              </label>
              <textarea
                className="input"
                rows="4"
                placeholder="Add any notes about this status change..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            <div className="modal-actions">
              <button type="button" className="btn btn-secondary" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                Update Status
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default StatusUpdateModal;