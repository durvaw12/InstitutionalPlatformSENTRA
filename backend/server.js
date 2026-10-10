require('dotenv').config();

const required = ['MONGODB_URI', 'JWT_SECRET'];
const missing = required.filter((k) => !process.env[k]);
if (missing.length) {
  console.error(`Missing required environment variables: ${missing.join(', ')}. Copy .env.example to .env and fill them in.`);
  process.exit(1);
}
if (process.env.JWT_SECRET.length < 32) {
  console.warn('JWT_SECRET is shorter than 32 characters. Use a long random value in production.');
}
if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
  console.warn('Cloudinary credentials are not set. Reports can be filed without attachments, but uploads will fail.');
}

const app = require('./app');
const { connectDB, closeDB } = require('./config/db');
const { seedAdmin } = require('./scripts/seedAdmin');
const { seedResources } = require('./scripts/seedResources');

const PORT = Number(process.env.PORT) || 5000;

async function start() {
  await connectDB();

  if (process.env.SEED_ADMIN_ON_START !== 'false') {
    try {
      await seedAdmin();
    } catch (err) {
      console.error('[seedAdmin] Failed:', err.message);
    }
  }
  try {
    await seedResources();
  } catch (err) {
    console.error('[seedResources] Failed:', err.message);
  }

  const server = app.listen(PORT, () => console.log(`Sentra API listening on port ${PORT} (${process.env.NODE_ENV || 'development'})`));

  const shutdown = (signal) => {
    console.log(`${signal} received, shutting down...`);
    server.close(async () => {
      await closeDB();
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10000).unref();
  };
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

process.on('unhandledRejection', (reason) => console.error('Unhandled rejection:', reason));

start().catch((err) => {
  console.error('Failed to start the server:', err.message);
  process.exit(1);
});
