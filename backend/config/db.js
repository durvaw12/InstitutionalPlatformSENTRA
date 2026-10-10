const { MongoClient } = require('mongodb');

let client = null;
let database = null;

function getDb() {
  if (!database) throw new Error('Database is not initialised. Call connectDB() first.');
  return database;
}

/** Thin accessors over the native driver: collections.users().findOne(...) */
const collections = {
  users: () => getDb().collection('users'),
  incidents: () => getDb().collection('incidents'),
  responses: () => getDb().collection('responses'),
  notifications: () => getDb().collection('notifications'),
  resources: () => getDb().collection('resources'),
  counters: () => getDb().collection('counters'),
};

async function createIndexes(db) {
  await Promise.all([
    db.collection('users').createIndexes([
      { key: { email: 1 }, name: 'uniq_email', unique: true },
      { key: { role: 1 }, name: 'role' },
      { key: { isActive: 1 }, name: 'isActive' },
    ]),
    db.collection('incidents').createIndexes([
      { key: { referenceId: 1 }, name: 'uniq_referenceId', unique: true },
      { key: { reporterId: 1, createdAt: -1 }, name: 'reporter_createdAt' },
      { key: { assignedTo: 1, updatedAt: -1 }, name: 'assignee_updatedAt' },
      { key: { status: 1 }, name: 'status' },
      { key: { priority: 1 }, name: 'priority' },
      { key: { category: 1 }, name: 'category' },
      { key: { assignedDepartment: 1 }, name: 'assignedDepartment' },
      { key: { createdAt: -1 }, name: 'createdAt_desc' },
      { key: { updatedAt: -1 }, name: 'updatedAt_desc' },
    ]),
    db.collection('responses').createIndexes([{ key: { incidentId: 1, createdAt: 1 }, name: 'incident_createdAt' }]),
    db.collection('notifications').createIndexes([
      { key: { userId: 1, createdAt: -1 }, name: 'user_createdAt' },
      { key: { userId: 1, isRead: 1 }, name: 'user_isRead' },
      { key: { incidentId: 1 }, name: 'incidentId' },
    ]),
    db.collection('resources').createIndexes([{ key: { kind: 1, createdAt: -1 }, name: 'kind_createdAt' }]),
  ]);
}

async function connectDB() {
  if (database) return database;
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI is not set.');
  client = new MongoClient(uri, { maxPoolSize: 10, serverSelectionTimeoutMS: 10000 });
  await client.connect();
  database = client.db(process.env.MONGODB_DB_NAME || undefined);
  await createIndexes(database);
  console.log(`MongoDB connected (database: ${database.databaseName})`);
  return database;
}

async function closeDB() {
  if (client) await client.close();
  client = null;
  database = null;
}

module.exports = { connectDB, closeDB, getDb, collections };
