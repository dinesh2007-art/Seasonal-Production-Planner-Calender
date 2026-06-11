# SeasonalProductionPlanningCalendar

Company: Sharadha Stores

## Project Overview

Seasonal Production Planning Calendar helps Sharadha Stores plan production batches for upcoming festivals by mapping expected order volumes to ingredient procurement timelines and production capacity. The goal is to prevent stockouts during peak demand and replace scattered manual planning with a structured digital workflow.

## Team Roles

- Student 1: Frontend
- Student 2: Backend
- Student 3: Testing & Deployment

## Tech Stack

- Frontend: HTML, CSS, JavaScript or React
- Backend: Node.js API server, Express-ready route design
- Database: MySQL or PostgreSQL planned for later weeks
- Charts: Chart.js or Recharts planned for analytics

## Backend Status Up To Day 5

- Day 1: Backend problem understanding and data entities documented.
- Day 2: Backend problem statement, technical abstract, and critical business rules documented.
- Day 3: Backend objectives documented and local server scaffold created.
- Day 4: `GET /health` route created and verified.
- Day 5: Use case diagram, full API specification, and capacity/utilisation pseudocode documented.
- Day 7: Review 1 feedback compilation added.
- Day 8: Literature survey and existing system analysis added.
- Day 9: Proposed system description, ER diagram, validation rules, and migration script added.
- Day 10: Seasonal Production Planning Entry Form built, POST/GET APIs added, and test tracker expanded.

Presentation/PPT work is intentionally excluded from this completion pass.

## Run Backend

```bash
cd backend
npm start
```

Health check:

```bash
curl http://localhost:3000/health
```

Expected response:

```json
{"status":"ok","project":"seasonal-production-planning-c"}
```

## Run Tests

```bash
cd backend
npm test
```

## Run Frontend

Open this file in a browser:

```text
frontend/index.html
```

Start the backend first so the form can save and list live planning records.

## Main API Routes

- `GET /health`
- `POST /api/seasonal_production_planning`
- `GET /api/seasonal_production_planning`
- `GET /api/seasonal_production_planning/:id`
- `GET /api/capacity-utilisation/sample`
