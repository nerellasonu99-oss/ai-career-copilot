const mongoose = require('mongoose');

let dbMode = 'disconnected';
let dbHost = '';

const connectOptions = {
  serverSelectionTimeoutMS: 15000,
  family: 4
};

const encodeMongoUri = (uri) => {
  if (!uri) return uri;

  const schemeEnd = uri.indexOf('://');
  const at = uri.lastIndexOf('@');
  if (schemeEnd === -1 || at === -1 || at < schemeEnd) return uri;

  const scheme = uri.slice(0, schemeEnd + 3);
  const credentials = uri.slice(schemeEnd + 3, at);
  const rest = uri.slice(at + 1);
  const colon = credentials.indexOf(':');
  if (colon === -1) return uri;

  const decodeSafely = (value) => {
    try {
      return decodeURIComponent(value);
    } catch {
      return value;
    }
  };

  const user = encodeURIComponent(decodeSafely(credentials.slice(0, colon)));
  const password = encodeURIComponent(decodeSafely(credentials.slice(colon + 1)));
  return `${scheme}${user}:${password}@${rest}`;
};

const hasPlaceholderCredentials = (uri) => !uri || /<[^>]+>/.test(uri);

const connectMemory = async () => {
  const { MongoMemoryServer } = require('mongodb-memory-server');
  const mongod = await MongoMemoryServer.create();
  const conn = await mongoose.connect(mongod.getUri('ai-career-copilot'), connectOptions);
  dbMode = 'memory';
  dbHost = conn.connection.host;
  console.log(`MongoDB in-memory connected: ${conn.connection.host}`);
  return conn;
};

const connectDB = async () => {
  const mongoUri = process.env.MONGO_URI;
  const useMemoryDb = process.env.USE_MEMORY_DB === 'true';

  if (useMemoryDb || hasPlaceholderCredentials(mongoUri)) {
    if (hasPlaceholderCredentials(mongoUri) && !useMemoryDb) {
      console.warn('MONGO_URI still contains <placeholders>. Using in-memory MongoDB for local development.');
    }
    return connectMemory();
  }

  try {
    const conn = await mongoose.connect(encodeMongoUri(mongoUri), connectOptions);
    dbMode = 'atlas';
    dbHost = conn.connection.host;
    console.log(`MongoDB connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error('MongoDB Atlas connection failed:', error.message);
    console.warn(
      'Falling back to in-memory MongoDB. For Atlas: Network Access → add this machine\'s IP (or 0.0.0.0/0 for a hackathon), and put the real database password in MONGO_URI without angle brackets. URL-encode special characters in the password.'
    );

    try {
      return await connectMemory();
    } catch (memoryError) {
      console.error('In-memory MongoDB also failed:', memoryError.message);
      process.exit(1);
    }
  }
};

const getDbStatus = () => ({
  mode: dbMode,
  host: dbHost,
  engine: dbMode === 'atlas' ? 'MongoDB Atlas' : dbMode === 'memory' ? 'MongoDB in-memory (hackathon fallback)' : 'Not connected'
});

module.exports = connectDB;
module.exports.getDbStatus = getDbStatus;
