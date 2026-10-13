const cloudinary = require('../config/cloudinary');
const ApiError = require('./ApiError');

const FOLDER = 'sentra_incidents';

/** Streams an in-memory buffer to Cloudinary (no temp files on disk). Resolves with Cloudinary's upload result. */
function uploadBuffer(buffer, { folder = FOLDER } = {}) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: 'auto', unique_filename: true, use_filename: false },
      (err, result) => (err ? reject(err) : resolve(result)),
    );
    stream.end(buffer);
  });
}

/** Uploads multer memory files; returns their secure URLs. If any upload fails, the ones that succeeded are removed. */
async function uploadFiles(files = []) {
  if (!files.length) return [];
  const results = await Promise.allSettled(files.map((f) => uploadBuffer(f.buffer)));
  const urls = results.filter((r) => r.status === 'fulfilled').map((r) => r.value.secure_url);
  const failed = results.find((r) => r.status === 'rejected');
  if (failed) {
    console.error('Cloudinary upload failed:', failed.reason?.message || failed.reason);
    await destroyByUrls(urls);
    throw new ApiError(502, 'The attachment could not be uploaded. Please try again.', { field: 'file' });
  }
  return urls;
}

function parseCloudinaryUrl(url) {
  const m = /\/(image|raw|video)\/upload\/(?:v\d+\/)?(.+)$/.exec(String(url));
  if (!m) return null;
  let publicId = decodeURIComponent(m[2].split('?')[0]);
  if (m[1] !== 'raw') publicId = publicId.replace(/\.[^/.]+$/, ''); // raw assets keep their extension in the public ID
  return { resourceType: m[1], publicId };
}

/** Best-effort removal. Only touches assets inside the sentra_incidents folder. Never throws. */
async function destroyByUrls(urls = []) {
  await Promise.allSettled(
    urls.map(async (url) => {
      const parsed = parseCloudinaryUrl(url);
      if (!parsed || !parsed.publicId.startsWith(`${FOLDER}/`)) return;
      await cloudinary.uploader.destroy(parsed.publicId, { resource_type: parsed.resourceType, invalidate: true });
    }),
  );
}

module.exports = { uploadBuffer, uploadFiles, destroyByUrls, parseCloudinaryUrl, FOLDER };
