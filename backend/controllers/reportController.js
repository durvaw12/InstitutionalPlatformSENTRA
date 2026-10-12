const { collections } = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { asString, escapeRegex } = require('../utils/validators');

const sum = (cond) => ({ $sum: { $cond: [cond, 1, 0] } });
const counters = () => ({
  total: { $sum: 1 },
  pending: sum({ $eq: ['$status', 'Pending'] }),
  inReview: sum({ $eq: ['$status', 'In Review'] }),
  resolved: sum({ $eq: ['$status', 'Resolved'] }),
  critical: sum({ $eq: ['$priority', 'Critical'] }),
});

// GET /api/reports/departments
// Incidents grouped by assignedDepartment. Incidents with no department yet are reported separately.
const departmentReport = asyncHandler(async (req, res) => {
  const [rows, unrouted] = await Promise.all([
    collections
      .incidents()
      .aggregate([
        { $match: { assignedDepartment: { $type: 'string', $ne: '' } } },
        { $group: { _id: '$assignedDepartment', ...counters() } },
        { $sort: { total: -1, _id: 1 } },
      ])
      .toArray(),
    collections.incidents().countDocuments({ $or: [{ assignedDepartment: null }, { assignedDepartment: { $exists: false } }] }),
  ]);

  res.json({
    success: true,
    departments: rows.map(({ _id, ...rest }) => ({ department: _id, ...rest })),
    withoutDepartment: unrouted,
  });
});

// GET /api/reports/departments/:department
const departmentDetail = asyncHandler(async (req, res) => {
  const name = asString(req.params.department);
  if (!name || name.length > 100) throw new ApiError(400, 'Enter a valid department name.');

  const [row] = await collections
    .incidents()
    .aggregate([
      { $match: { assignedDepartment: { $regex: `^${escapeRegex(name)}$`, $options: 'i' } } },
      { $group: { _id: null, department: { $first: '$assignedDepartment' }, ...counters() } },
    ])
    .toArray();

  res.json({
    success: true,
    report: row
      ? { department: row.department, total: row.total, pending: row.pending, inReview: row.inReview, resolved: row.resolved, critical: row.critical }
      : { department: name, total: 0, pending: 0, inReview: 0, resolved: 0, critical: 0 },
  });
});

module.exports = { departmentReport, departmentDetail };
