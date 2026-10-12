const { collections } = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');
const { STATUSES, PRIORITIES } = require('../utils/constants');
const { loadUsersMap, serializeIncidents } = require('../utils/serializers');

const count = (cond) => ({ $sum: { $cond: [cond, 1, 0] } });

// GET /api/dashboard/admin   ?days=30 (timeline window, 1-365)
// All numbers come from aggregation pipelines over the incidents collection; there is no separate reports collection.
const adminDashboard = asyncHandler(async (req, res) => {
  const days = Math.min(Math.max(parseInt(req.query.days, 10) || 30, 1), 365);
  const since = new Date();
  since.setUTCHours(0, 0, 0, 0);
  since.setUTCDate(since.getUTCDate() - (days - 1));
  const dayKey = (field) => ({ $dateToString: { format: '%Y-%m-%d', date: field, timezone: 'UTC' } });

  const [facets] = await collections
    .incidents()
    .aggregate([
      {
        $facet: {
          totals: [
            {
              $group: {
                _id: null,
                total: { $sum: 1 },
                pending: count({ $eq: ['$status', 'Pending'] }),
                inReview: count({ $eq: ['$status', 'In Review'] }),
                resolved: count({ $eq: ['$status', 'Resolved'] }),
                anonymous: count({ $eq: ['$isAnonymous', true] }),
                openUnassigned: count({ $and: [{ $ne: ['$status', 'Resolved'] }, { $eq: ['$assignedTo', null] }] }),
                criticalOpen: count({ $and: [{ $ne: ['$status', 'Resolved'] }, { $eq: ['$priority', 'Critical'] }] }),
              },
            },
          ],
          byCategory: [{ $group: { _id: '$category', count: { $sum: 1 } } }, { $sort: { count: -1, _id: 1 } }],
          byStatus: [{ $group: { _id: '$status', count: { $sum: 1 } } }],
          byPriority: [{ $group: { _id: '$priority', count: { $sum: 1 } } }],
          createdByDay: [{ $match: { createdAt: { $gte: since } } }, { $group: { _id: dayKey('$createdAt'), count: { $sum: 1 } } }],
          resolvedByDay: [{ $match: { resolvedAt: { $gte: since } } }, { $group: { _id: dayKey('$resolvedAt'), count: { $sum: 1 } } }],
          // Named (non-anonymous) reports per reporter. Anonymous reports are never attributed to anyone.
          byReporter: [
            { $match: { isAnonymous: false, reporterId: { $ne: null } } },
            { $group: { _id: '$reporterId', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 100 },
          ],
        },
      },
    ])
    .toArray();

  const t = facets.totals[0] || { total: 0, pending: 0, inReview: 0, resolved: 0, anonymous: 0, openUnassigned: 0, criticalOpen: 0 };
  const fill = (rows, keys) => keys.map((k) => ({ key: k, count: rows.find((r) => r._id === k)?.count ?? 0 }));

  const created = new Map(facets.createdByDay.map((r) => [r._id, r.count]));
  const resolved = new Map(facets.resolvedByDay.map((r) => [r._id, r.count]));
  const timeline = [];
  for (let i = 0; i < days; i += 1) {
    const d = new Date(since);
    d.setUTCDate(since.getUTCDate() + i);
    const date = d.toISOString().slice(0, 10);
    timeline.push({ date, created: created.get(date) ?? 0, resolved: resolved.get(date) ?? 0 });
  }

  const usersMap = await loadUsersMap(facets.byReporter.map((r) => r._id));
  const reportsByReporter = facets.byReporter.map((r) => {
    const u = usersMap.get(String(r._id));
    return { userId: r._id, name: u?.name ?? 'Deleted user', role: u?.role ?? null, count: r.count };
  });

  const recentDocs = await collections.incidents().find({}, { projection: { timeline: 0 } }).sort({ updatedAt: -1 }).limit(6).toArray();

  res.json({
    success: true,
    stats: {
      totalReports: t.total,
      pending: t.pending,
      inReview: t.inReview,
      resolved: t.resolved,
      anonymous: t.anonymous,
      openUnassigned: t.openUnassigned,
      criticalOpen: t.criticalOpen,
    },
    reportsByCategory: facets.byCategory.map((r) => ({ category: r._id, count: r.count })),
    reportsByStatus: fill(facets.byStatus, STATUSES).map((r) => ({ status: r.key, count: r.count })),
    reportsByPriority: fill(facets.byPriority, PRIORITIES).map((r) => ({ priority: r.key, count: r.count })),
    timeline: { days, points: timeline },
    reportsByReporter,
    recent: await serializeIncidents(recentDocs, req.user, { withTimeline: false }),
  });
});

module.exports = { adminDashboard };
