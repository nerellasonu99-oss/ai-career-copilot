# AI Career Copilot Backend

## Demo for judges
From this folder run `npm run dev`, then open **http://localhost:5000**.

The UI is served by Express. The green **API live** chip and **Stack** button show Node.js, Express, MongoDB, and JWT. Demo login: `judges@neuralarchitects.dev` / `JudgeDemo1`.

## Stack
- Node.js
- Express.js REST API
- MongoDB (Atlas, with in-memory fallback)
- JWT auth + bcrypt password hashing

## Setup
1. Install Node.js from https://nodejs.org/
2. Open terminal in this folder
3. Run:
   ```bash
   npm install
   ```
4. Copy `.env.example` to `.env` and update values
5. For MongoDB Atlas:
   - Database Access: use the real username and password (no `<` `>` placeholders)
   - Network Access: add your current IP, or `0.0.0.0/0` for a short hackathon
   - URL-encode special characters in the password
6. If Atlas is blocked, the API falls back to an in-memory MongoDB so `npm run dev` still starts (data is not persisted)
7. Run:
   ```bash
   npm run dev
   ```
   Open http://localhost:5000 — do not open `index.html` as a file if you want the live API badge.

## Environment variables
```env
PORT=5000
MONGO_URI=mongodb+srv://USER:PASSWORD@cluster0.evd1wqf.mongodb.net/ai-career-copilot?retryWrites=true&w=majority
USE_MEMORY_DB=false
JWT_SECRET=your_super_secure_secret_here
CLIENT_URL=http://localhost:5000
```

## API routes
- GET /api/health
- POST /api/auth/signup
- POST /api/auth/login
- GET /api/auth/me
- GET /api/profile
- PUT /api/profile/save
- GET /api/roles

## Notes
The frontend talks to this API for auth and profile persistence. Gap analysis still runs in the browser so the demo stays fast.
