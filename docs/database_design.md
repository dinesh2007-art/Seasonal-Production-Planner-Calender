# Database Design

## ER Diagram

```mermaid
erDiagram
  SEASONAL_PRODUCTION_PLANNING ||--o{ ORDERS : contains
  SEASONAL_PRODUCTION_PLANNING ||--o{ INVENTORY : requires

  SEASONAL_PRODUCTION_PLANNING {
    int id PK
    string admin
    string plan_name
    string production_item
    int batches
    string upcoming_festival
    int expected_order_volume
    date ingredient_procurement_start_date
    date production_start_date
    int production_capacity_per_day
    string status
    datetime created_at
    datetime updated_at
  }

  ORDERS {
    int id PK
    int seasonal_production_planning_id FK
    string admin
    string plan_name
    string production_item
    int order_volume
    string status
    datetime created_at
    datetime updated_at
  }

  INVENTORY {
    int id PK
    int seasonal_production_planning_id FK
    string admin
    string ingredient_name
    int available_quantity
    int required_quantity
    string unit
    string status
    datetime created_at
    datetime updated_at
  }
```

## Validation Rules

| Field | Rule |
| --- | --- |
| admin | Required text after sanitisation |
| plan_name | Required text |
| production_item | Required text |
| batches | Required number greater than zero |
| upcoming_festival | Required text |
| expected_order_volume | Required number greater than zero |
| ingredient_procurement_start_date | Required date |
| production_start_date | Required date and cannot be before procurement start |
| production_capacity_per_day | Required number greater than zero |
| status | Defaults to planned |

## Capacity and Utilisation Logic

1. Read expected order volume, planned batches, and production capacity per day.
2. Reject zero, missing, or negative values.
3. Calculate days required as `ceil(expected_order_volume / production_capacity_per_day)`.
4. Calculate batch utilisation as `expected_order_volume / (batches * production_capacity_per_day) * 100`.
5. Mark risk as high when utilisation is above 100 percent, medium when it is 85 to 100 percent, and low below 85 percent.

## Edge Cases

| Case | Expected Handling |
| --- | --- |
| Zero order volume | Validation error |
| Procurement date after production date | Validation error |
| Utilisation above 100 percent | High-risk recommendation |
| Empty database | Return empty list without crashing |
| Extra HTML in text fields | Strip unsafe HTML before saving |
