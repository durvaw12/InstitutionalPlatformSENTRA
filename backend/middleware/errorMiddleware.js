const multer = require('multer');
const ApiError = require('../utils/ApiError');

const notFound = (req, res, next) => next(new ApiError(404, `Route not found: ${req.method} ${req.originalUrl}`));

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  let status = 500;
  let message = 'Something went wrong. Try again.';
  let field;
  let errors;

  if (err instanceof ApiError) {
    ({ status, message, field, errors } = err);
  } else if (err instanceof multer.MulterError) {
    status = err.code === 'LIMIT_FILE_SIZE' ? 413 : 400;
    field = 'file';
    message =
      err.code === 'LIMIT_FILE_SIZE'
        ? `The file is too large (limit ${Number(process.env.MAX_FILE_SIZE_MB) || 5} MB).`
        : err.code === 'LIMIT_UNEXPECTED_FILE' || err.code === 'LIMIT_FILE_COUNT'
          ? 'Too many files, or a file was sent in the wrong field.'
          : 'The upload could not be processed.';
  } else if (err.code === 11000) {
    status = 409;
    const key = Object.keys(err.keyPattern || {})[0];
    field = key === 'email' ? 'email' : undefined;
    message = key === 'email' ? 'An account with this email already exists.' : 'That record already exists.';
  } else if (err.type === 'entity.parse.failed') {
    status = 400;
    message = 'The request body is not valid JSON.';
  } else if (err.type === 'entity.too.large') {
    status = 413;
    message = 'The request body is too large.';
  }

  if (status >= 500) console.error(err);

  res.status(status).json({
    success: false,
    message,
    ...(field ? { field } : {}),
    ...(errors ? { errors } : {}),
    ...(status >= 500 && process.env.NODE_ENV !== 'production' ? { debug: err.message } : {}),
  });
};

module.exports = { notFound, errorHandler };
