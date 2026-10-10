/** Forwards rejected promises from async route handlers to Express' error middleware. */
module.exports = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
