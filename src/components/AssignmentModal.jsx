import { useState } from 'react';
import { X, UserCheck, Building2 } from 'lucide-react';

function AssignmentModal({ incident, isOpen, onClose, onAssign }) {
  const [selectedStaff, setSelectedStaff] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');

  const staffMembers = [
    { id: 1, name: 'John Smith', role: 'Security Officer' },
    { id: 2, name: 'Sarah Johnson', role: 'Security Officer' },
    { id: 3, name: 'Michael Brown', role: 'Campus Police' },
    { id: 4, name: 'Emily Davis', role: 'Facilities Manager' },
    { id: 5, name: 'Robert Wilson', role: 'Health Services' }
  ];

  const departments = [
    { id: 1, name: 'Campus Security' },
    { id: 2, name: 'Campus Police' },
    { id: 3, name: 'Facilities Team' },
    { id: 4, name: 'Health Services' },
    { id: 5, name: 'Counseling Services' }
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!selectedStaff || !selectedDepartment) {
      alert('Please select both staff member and department');
      return;
    }

    const staffName = staffMembers.find(s => s.id === parseInt(selectedStaff))?.name || '';
    const departmentName = departments.find(d => d.id === parseInt(selectedDepartment))?.name || '';

    onAssign({
      incidentId: incident.id,
      staffId: selectedStaff,
      staffName: staffName,
      departmentId: selectedDepartment,
      departmentName: departmentName
    });

    // Reset form
    setSelectedStaff('');
    setSelectedDepartment('');
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>
            <UserCheck size={20} />
            Assign Staff/Department
          </h2>
          <button className="modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          <div className="incident-info">
            <p><strong>Incident:</strong> {incident.id}</p>
            <p><strong>Category:</strong> {incident.category}</p>
            <p><strong>Current Assignment:</strong> {incident.assignedTo}</p>
          </div>

          <form onSubmit={handleSubmit} className="assignment-form">
            <div className="form-group">
              <label className="label label-required">
                <Building2 size={16} />
                Department
              </label>
              <select
                className="select"
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
                required
              >
                <option value="">Select Department</option>
                {departments.map(dept => (
                  <option key={dept.id} value={dept.id}>
                    {dept.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="label label-required">
                <UserCheck size={16} />
                Staff Member
              </label>
              <select
                className="select"
                value={selectedStaff}
                onChange={(e) => setSelectedStaff(e.target.value)}
                required
              >
                <option value="">Select Staff Member</option>
                {staffMembers.map(staff => (
                  <option key={staff.id} value={staff.id}>
                    {staff.name} - {staff.role}
                  </option>
                ))}
              </select>
            </div>

            <div className="modal-actions">
              <button type="button" className="btn btn-secondary" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                Assign
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default AssignmentModal;