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
      persistence: ['selected role', 'skill ratings', 'extra skills', 'learning roadmap']
    },
    routes: [
      'GET /api/health',
      'POST /api/auth/signup',
      'POST /api/auth/login',
      'GET /api/auth/me',
      'GET /api/profile',
      'PUT /api/profile/save',
      'GET /api/roles'
    ]
  };
};

app.get('/api/health', (req, res) => {
  res.json(stackPayload());
});

app.use('/api/auth', require('./routes/auth'));
app.use('/api/profile', require('./routes/profile'));
app.use('/api/roles', require('./routes/roles'));

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

const PORT = process.env.PORT || 5000;

connectDB().then(async () => {
  try {
    await seedDemoUser();
  } catch (error) {
    console.warn('Demo user seed skipped:', error.message);
  }

  app.listen(PORT, () => {
    console.log(`AI Career Copilot running at http://localhost:${PORT}`);
    console.log('Open that URL for the full-stack demo (UI + API).');
  });
});
