# FirstCry Intellitots — Lesson Plan Builder & Preschool Operations Dashboard

A full-stack preschool operations platform for creating lesson plans, generating structured content, and receiving AI-powered educational recommendations.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18, Vite 6, React Router 7, Axios, Context API |
| Backend | Node.js, Express.js, JWT Authentication |
| Database | Firebase Firestore |
| Deployment | Vercel (frontend), Render (backend) |

## Features

- **Authentication** — Register, login, logout with JWT (token stored in localStorage)
- **Lesson Plan CRUD** — Create, read, update, delete lesson plans in Firestore
- **Lesson Generation** — Rule-based structured lesson content (weekly plan, activities, materials, goals, flow)
- **AI Recommendations** — Age-appropriate suggestions with accept/reject/apply workflow
- **Dashboard** — API health, lesson plan counts, operational overview
- **Protected Routes** — All app pages require authentication

## Architecture

```
Frontend (React) → Axios API Layer → Express Routes → Controllers → Services → Repositories → Firestore
```

## Prerequisites

- Node.js 18+
- npm 9+
- Firebase project with Firestore enabled
- Firebase Admin service account credentials

## Quick Start

### 1. Clone and install

```bash
# Backend
cd backend
npm install
cp .env.example .env
# Edit .env with your Firebase credentials and JWT_SECRET

# Frontend
cd ../frontend
npm install
cp .env.example .env
```

### 2. Configure environment

**Backend (`backend/.env`):**

```env
NODE_ENV=development
PORT=5000
CORS_ORIGIN=http://localhost:5173

FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@...
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com

JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=7d
```

**Frontend (`frontend/.env`):**

```env
VITE_API_BASE_URL=http://localhost:5000/api
```

### 3. Run development servers

```bash
# Terminal 1 — Backend (port 5000)
cd backend
npm run dev

# Terminal 2 — Frontend (port 5173)
cd frontend
npm run dev
```

Open [http://localhost:5173](http://localhost:5173), register an account, and start managing lesson plans.

## Scripts

| Location | Command | Description |
|----------|---------|-------------|
| Backend | `npm run dev` | Start with file watcher |
| Backend | `npm start` | Production start |
| Frontend | `npm run dev` | Vite dev server |
| Frontend | `npm run build` | Production build |
| Frontend | `npm run preview` | Preview production build |

## API Endpoints

### Public

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |
| POST | `/api/auth/register` | Register user |
| POST | `/api/auth/login` | Login |

### Protected (Bearer token required)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/auth/me` | Current user profile |
| POST | `/api/auth/logout` | Logout |
| CRUD | `/api/lesson-plans` | Lesson plan management |
| POST | `/api/lesson-plans/generate` | Generate lesson content |
| POST | `/api/recommendations/generate` | Generate recommendations |
| GET | `/api/recommendations/:lessonId` | Get recommendations by lesson |
| PUT | `/api/recommendations/apply` | Accept/reject/edit recommendation |
| GET | `/api/dashboard/stats` | Dashboard statistics |
| GET | `/api/dashboard/recent-plans` | Recent lesson plans |
| GET | `/api/history` | Activity history |
| GET | `/api/enquiries` | Enquiries |
| GET | `/api/alerts` | Alerts |

## Project Structure

```
Lesson-Plan-Builder/
├── backend/src/
│   ├── config/          # Environment & Firebase
│   ├── controllers/     # Request handlers
│   ├── services/        # Business logic
│   ├── repositories/    # Firestore data access
│   ├── routes/          # Express routes
│   ├── middlewares/     # Auth, validation, errors
│   └── validations/     # Input validation rules
└── frontend/src/
    ├── api/             # Axios API modules
    ├── components/      # Reusable UI components
    ├── context/         # Auth & app state
    ├── layouts/         # App & auth layouts
    ├── pages/           # Route pages
    └── utils/           # Helpers & validation
```

## Deployment

### Frontend (Vercel)

- Root directory: `frontend`
- Build command: `npm run build`
- Output directory: `dist`
- Environment: `VITE_API_BASE_URL=https://your-api.onrender.com/api`

### Backend (Render)

- Root directory: `backend`
- Build command: `npm install`
- Start command: `npm start`
- Set all backend environment variables in the Render dashboard
- Update `CORS_ORIGIN` to your Vercel frontend URL

## Security Notes

- Never commit `.env` files or Firebase private keys
- Use a strong `JWT_SECRET` in production
- All feature API routes require authentication
- Tokens are stored in `localStorage` under `intellitots_token`

## License

ISC
