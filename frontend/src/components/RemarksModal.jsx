import { useState } from 'react';
import { X, MessageSquare, Send } from 'lucide-react';

function RemarksModal({ incident, isOpen, onClose, onAddRemark }) {
  const [remark, setRemark] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!remark.trim()) {
      alert('Please enter a remark');
      return;
    }

    onAddRemark({
      incidentId: incident.id,
      message: remark,
      author: 'Admin User',
      timestamp: new Date().toISOString()
    });

    // Reset form
    setRemark('');
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>
            <MessageSquare size={20} />
            Add Remark
          </h2>
          <button className="modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          <div className="incident-info">
            <p><strong>Incident:</strong> {incident.id}</p>
            <p><strong>Category:</strong> {incident.category}</p>
            <p><strong>Status:</strong> {incident.status}</p>
          </div>

          <form onSubmit={handleSubmit} className="remarks-form">
            <div className="form-group">
              <label className="label label-required">
                <MessageSquare size={16} />
                Your Remark
              </label>
              <textarea
                className="input"
                rows="6"
                placeholder="Enter your remark about this incident..."
                value={remark}
                onChange={(e) => setRemark(e.target.value)}
                required
              />
              <p className="form-help">
                This remark will be visible to other administrators and staff members.
              </p>
            </div>

            <div className="modal-actions">
              <button type="button" className="btn btn-secondary" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                <Send size={16} />
                Add Remark
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default RemarksModal;