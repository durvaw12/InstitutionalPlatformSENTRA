/** Operational error that the error middleware turns into a JSON response. */
class ApiError extends Error {
  /**
   * @param {number} status HTTP status code
   * @param {string} message Message safe to show to the user
   * @param {{field?: string, errors?: object}} [extra] `field` lets the frontend attach the message to an input
   */
  constructor(status, message, extra = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.field = extra.field;
    this.errors = extra.errors;
  }
}

module.exports = ApiError;
