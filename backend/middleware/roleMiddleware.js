const ApiError = require('../utils/ApiError');

/** Usage: router.get('/', protect, authorize('administrator'), handler). Must run after `protect`. */
const authorize =
  (...roles) =>
  (req, res, next) => {
    if (!req.user) return next(new ApiError(401, 'Your session has ended. Sign in again.'));
    if (!roles.includes(req.user.role)) {
      return next(new ApiError(403, `Your ${req.user.role} account cannot do this.`));
    }
    next();
  };

module.exports = { authorize };
