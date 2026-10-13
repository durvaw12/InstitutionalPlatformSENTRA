const multer = require('multer');
const ApiError = require('../utils/ApiError');

const MAX_MB = Number(process.env.MAX_FILE_SIZE_MB) || 5;
const ALLOWED = new Set(['image/png', 'image/jpeg', 'application/pdf']);
const SIGNATURES = {
  'image/png': [0x89, 0x50, 0x4e, 0x47],
  'image/jpeg': [0xff, 0xd8, 0xff],
  'application/pdf': [0x25, 0x50, 0x44, 0x46],
};

// Files are held in memory only and streamed to Cloudinary by utils/cloudinaryUpload.js.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_MB * 1024 * 1024, files: 5 },
  fileFilter(req, file, cb) {
    if (!ALLOWED.has(file.mimetype)) return cb(new ApiError(400, 'Attach a PNG, JPG, or PDF file.', { field: 'file' }));
    cb(null, true);
  },
});

const hasValidSignature = (f) => SIGNATURES[f.mimetype].every((byte, i) => f.buffer[i] === byte);

/** Flattens req.files into req.uploadedFiles and checks magic bytes, since the MIME type is client-supplied. */
function collectFiles(req, res, next) {
  const files = req.files && !Array.isArray(req.files) ? Object.values(req.files).flat() : req.files || [];
  for (const f of files) {
    if (!hasValidSignature(f)) {
      return next(new ApiError(400, 'The attached file is not a valid PNG, JPG, or PDF.', { field: 'file' }));
    }
  }
  req.uploadedFiles = files;
  next();
}

/**
 * Accepts up to 5 files in the field "attachments" (or a single file in "attachment").
 * JSON requests pass through untouched with req.uploadedFiles = [].
 */
const uploadIncidentFiles = [
  upload.fields([
    { name: 'attachments', maxCount: 5 },
    { name: 'attachment', maxCount: 1 },
  ]),
  collectFiles,
];

module.exports = { uploadIncidentFiles, MAX_MB };
