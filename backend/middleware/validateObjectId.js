const ApiError = require('../utils/ApiError');
const { isObjectIdString, REFERENCE_RE } = require('../utils/validators');

/** For router.param('id', validateObjectId): rejects malformed ids with 400 before any database call. */
const validateObjectId = (req, res, next, value) => {
  if (!isObjectIdString(value)) return next(new ApiError(400, 'Invalid id.'));
  next();
};

/** For router.param('referenceId', validateReferenceId): INC-YYYY-NNNN */
const validateReferenceId = (req, res, next, value) => {
  if (!REFERENCE_RE.test(value)) return next(new ApiError(400, 'Enter the ID in this format: INC-2026-0001.', { field: 'referenceId' }));
  next();
};

module.exports = { validateObjectId, validateReferenceId };
