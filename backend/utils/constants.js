// Values mirror frontend/src/store/constants.js. Edit here if the SRS changes them.
const ROLES = ['student', 'staff', 'administrator'];
const PUBLIC_ROLES = ['student', 'staff']; // roles allowed through POST /api/auth/register
const STATUSES = ['Pending', 'In Review', 'Resolved'];
const PRIORITIES = ['Low', 'Medium', 'High', 'Critical'];
const CATEGORIES = [
  'Safety Hazard',
  'Harassment',
  'Theft',
  'Facility Issue',
  'Medical Emergency',
  'Security Concern',
  'Academic Misconduct',
  'Other',
];
const RESPONSE_TYPES = ['staff_response', 'admin_remark', 'resolution'];
const RESOURCE_KINDS = ['policy', 'helpline', 'tip'];

module.exports = { ROLES, PUBLIC_ROLES, STATUSES, PRIORITIES, CATEGORIES, RESPONSE_TYPES, RESOURCE_KINDS };
