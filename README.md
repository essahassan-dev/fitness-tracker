# MERN Fitness Tracker — Full-Stack MERN Fitness Tracker

A production-level fitness tracking web app built with React, Node.js, Express, and MongoDB.

## Features

- **Authentication** — JWT-based register/login with bcrypt password hashing
- **Dashboard** — Overview of workouts, calories, macros, and progress
- **Workout Tracking** — Log exercises with sets/reps/weight, filter & search
- **Nutrition Tracking** — Log meals by type (breakfast/lunch/dinner/snack) with macros
- **Progress Tracking** — Weight, body fat, and measurements with line charts
- **Analytics** — Workout frequency, category breakdown, strength progress, calorie/macro charts
- **Profile** — Edit personal info, fitness goals, and change password
- **Dark/Light Mode** — Toggle between themes
- **Responsive** — Mobile-first, works on all screen sizes

## Tech Stack

| Layer     | Technology                          |
|-----------|-------------------------------------|
| Frontend  | React 18, Vite, Tailwind CSS        |
| Charts    | Chart.js + react-chartjs-2          |
| Routing   | React Router v6                     |
| Backend   | Node.js + Express                   |
| Database  | MongoDB + Mongoose                  |
| Auth      | JWT + bcryptjs                      |
| Toasts    | react-hot-toast                     |

## Project Structure

```
MERN Fitness Tracker/
├── backend/
│   ├── config/         # DB connection
│   ├── controllers/    # Route handlers
│   ├── middleware/     # Auth, error handler, validation
│   ├── models/         # Mongoose schemas
│   ├── routes/         # Express routers
│   └── server.js
└── frontend/
    └── src/
        ├── components/ # Reusable UI components
        ├── context/    # Auth + Theme context
        ├── pages/      # Page components
        ├── services/   # Axios API calls
        └── utils/      # Helpers, chart config
```

## Setup

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)

### 1. Clone & Install

```bash
# Install all dependencies
npm run install:all
```

### 2. Configure Backend

```bash
cp backend/.env.example backend/.env
```

Edit `backend/.env`:
```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/fitness-tracker
JWT_SECRET=your_super_secret_key_here
JWT_EXPIRE=7d
NODE_ENV=development
```

### 3. Run Development Servers

Open two terminals:

**Terminal 1 — Backend:**
```bash
npm run dev:backend
# Server runs on http://localhost:5000
```

**Terminal 2 — Frontend:**
```bash
npm run dev:frontend
# App runs on http://localhost:5173
```

### 4. Open the App

Navigate to [http://localhost:5173](http://localhost:5173) and register a new account.

## API Endpoints

| Method | Endpoint                    | Description              |
|--------|-----------------------------|--------------------------|
| POST   | /api/auth/register          | Register user            |
| POST   | /api/auth/login             | Login user               |
| GET    | /api/auth/me                | Get current user         |
| PUT    | /api/auth/profile           | Update profile           |
| PUT    | /api/auth/password          | Change password          |
| GET    | /api/dashboard              | Dashboard summary        |
| GET    | /api/workouts               | List workouts            |
| POST   | /api/workouts               | Create workout           |
| PUT    | /api/workouts/:id           | Update workout           |
| DELETE | /api/workouts/:id           | Delete workout           |
| GET    | /api/workouts/analytics     | Workout analytics        |
| GET    | /api/nutrition              | List nutrition entries   |
| POST   | /api/nutrition              | Create nutrition entry   |
| GET    | /api/nutrition/daily        | Daily summary            |
| GET    | /api/nutrition/analytics    | Nutrition analytics      |
| GET    | /api/progress               | List progress entries    |
| POST   | /api/progress               | Create progress entry    |
| GET    | /api/progress/chart         | Progress chart data      |

## Production Build

```bash
# Build frontend
npm run build --prefix frontend

# Serve with a static file server or configure Express to serve the dist folder
```
