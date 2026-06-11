# Seasonal Production Planning API Specification

Base URL: `http://localhost:3000`

## GET /health

Checks whether the backend server is running.

Response:

```json
{
  "status": "ok",
  "project": "seasonal-production-planning-c"
}
```

## POST /api/seasonal_production_planning

Creates a production planning record.

Request fields:

```json
{
  "admin": "Sharadha Admin",
  "planName": "Diwali sweets production",
  "productionItem": "Mysore Pak",
  "batches": 12,
  "upcomingFestival": "Diwali",
  "expectedOrderVolume": 600,
  "ingredientProcurementStartDate": "2026-10-20",
  "ingredientProcurementEndDate": "2026-10-25",
  "productionStartDate": "2026-10-27",
  "productionEndDate": "2026-10-30",
  "productionCapacityPerDay": 150,
  "status": "planned"
}
```

Success response:

```json
{
  "success": true,
  "message": "Seasonal production plan created",
  "data": {
    "id": 1
  }
}
```

## GET /api/seasonal_production_planning

Returns all production planning records for the dashboard.

Query options planned:

- `status`
- `festival`
- `admin`
- `search`
- `page`
- `limit`

Response:

```json
{
  "success": true,
  "data": []
}
```

## GET /api/seasonal_production_planning/:id

Returns one production planning record for Detail & History View.

Response:

```json
{
  "success": true,
  "data": {
    "id": 1,
    "admin": "Sharadha Admin",
    "planName": "Diwali sweets production"
  }
}
```

## PUT /api/seasonal_production_planning/:id

Updates a complete production planning record using the same validation rules as `POST`.

Response:

```json
{
  "success": true,
  "message": "Seasonal production plan updated"
}
```

## POST /api/capacity-utilisation/calculate

Calculates capacity and utilisation for a production plan before approval.

Request fields:

```json
{
  "expectedOrderVolume": 600,
  "batches": 12,
  "productionCapacityPerDay": 150,
  "productionStartDate": "2026-10-27",
  "productionEndDate": "2026-10-30"
}
```

Response:

```json
{
  "success": true,
  "data": {
    "daysRequired": 4,
    "batchUtilisation": 33,
    "riskLevel": "low",
    "recommendation": "Current capacity can support the expected order volume."
  }
}
```

## GET /api/capacity-utilisation/:planId

Returns saved capacity and utilisation output for an existing plan.

Response:

```json
{
  "success": true,
  "data": {
    "planId": 1,
    "daysRequired": 4,
    "batchUtilisation": 33,
    "riskLevel": "low"
  }
}
```
