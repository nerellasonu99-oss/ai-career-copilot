const path = require('path');
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const { seedDemoUser } = require('./utils/seedDemo');

dotenv.config({ path: path.join(__dirname, '.env') });

if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = 'neural-architects-hackathon-jwt';
}

const app = express();
const frontendRoot = path.join(__dirname, '..');

app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json());

const stackPayload = () => {
  const db = connectDB.getDbStatus();
  return {
    ok: true,
    product: 'AI Career Copilot',
    team: 'NEURAL ARCHITECTS (SD006)',
    version: '1.0.0',
    stack: {
      runtime: 'Node.js',
      api: 'Express REST',
      database: db.engine,
      dbMode: db.mode,
      auth: 'JWT (7-day) + bcrypt password hashing',
      persistence: ['selected role', 'skill ratings', 'extra skills', 'learning roadmap'],
      coach: process.env.GEMINI_API_KEY && !/your_free_gemini_api_key_here/i.test(process.env.GEMINI_API_KEY)
        ? 'Google Gemini'
        : 'Local fallback (set GEMINI_API_KEY)'
    },
    routes: [
      'GET /api/health',
      'POST /api/auth/signup',
      'POST /api/auth/login',
      'GET /api/auth/me',
      'GET /api/profile',
      'PUT /api/profile/save',
      'GET /api/roles',
      'GET /api/chat/status',
      'POST /api/chat'
    ]
  };
};

app.get('/api/health', (req, res) => {
  res.json(stackPayload());
});

app.use('/api/auth', require('./routes/auth'));
app.use('/api/profile', require('./routes/profile'));
app.use('/api/roles', require('./routes/roles'));
app.use('/api/chat', require('./routes/chat'));

app.use((req, res, next) => {
  const blocked = req.path.startsWith('/backend') || req.path.includes('.env') || req.path.includes('node_modules');
  if (blocked) {
    return res.status(404).json({ message: 'Not found' });
  }
  next();
});

app.get('/', (req, res) => {
  res.sendFile(path.join(frontendRoot, 'index.html'));
});

app.use(express.static(frontendRoot, { index: false }));

const PORT = Number(process.env.PORT) || 5000;

const startServer = (port = PORT, attemptsLeft = 10) => new Promise((resolve, reject) => {
  const server = app.listen(port, () => {
    console.log(`AI Career Copilot running at http://localhost:${port}`);
    console.log('Open that URL for the full-stack demo (UI + API + Career Coach).');
    resolve(server);
  });

  server.on('error', (error) => {
    if (error.code === 'EADDRINUSE' && attemptsLeft > 0) {
      console.warn(`Port ${port} is busy. Trying ${port + 1}...`);
      setTimeout(() => {
        startServer(port + 1, attemptsLeft - 1).then(resolve).catch(reject);
      }, 200);
      return;
    }
    reject(error);
  });
});

connectDB()
  .then(async () => {
    try {
      await seedDemoUser();
    } catch (error) {
      console.warn('Demo user seed skipped:', error.message);
    }

    await startServer();
  })
  .catch((error) => {
    console.warn('Database unavailable; starting app in degraded demo mode.', error.message);
    startServer();
  });
