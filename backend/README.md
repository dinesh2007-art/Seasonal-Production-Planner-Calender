# Local Backend Setup

This project now uses a local Node.js backend instead of Supabase.

## Setup Instructions

### 1. Install Backend Dependencies

```bash
cd backend
npm install
```

### 2. Start the Backend Server

In one terminal:

```bash
cd backend
npm start
```

The server will run on `http://localhost:3001` and create a `db.json` file to store data locally.

### 3. Start the Frontend Dev Server

In another terminal:

```bash
npm run dev
```

The app will open at `http://localhost:5173`

## Architecture

- **Frontend**: Vite + React (localhost:5173)
- **Backend**: Express.js (localhost:3001)
- **Database**: JSON file (`backend/db.json`)

## Development

### Backend Development Mode

For auto-reload on backend changes:

```bash
cd backend
npm run dev
```

### API Endpoints

All endpoints return `{ data: [...], error: null }`

- `GET /api/production_plans`
- `POST /api/production_plans`
- `PUT /api/production_plans/:id`
- `DELETE /api/production_plans/:id`
- `GET /api/orders`
- `POST /api/orders`
- `PUT /api/orders/:id`
- `DELETE /api/orders/:id`
- `GET /api/inventory`
- `POST /api/inventory`
- `PUT /api/inventory/:id`
- `DELETE /api/inventory/:id`
- `GET /api/action_history`
- `POST /api/action_history`
