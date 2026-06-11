# Day 1 Backend Understanding

## Business Problem

Sharadha Stores manually plans production batches for festival demand. The backend must store and process expected order volumes, ingredient procurement timelines, and production capacity so that admins can decide how many batches are required before peak demand begins.

If this planning remains manual, records may stay scattered across spreadsheets, paper notes, and messages. That creates a risk of missing procurement deadlines, overloading production capacity, and running out of stock during festivals.

## Core Data Entities

1. `seasonal_production_planning`
   - Stores each festival production plan, expected demand, batch count, production schedule, capacity, and status.

2. `orders`
   - Stores customer order information that contributes to expected order volume and demand forecasting.

3. `inventory`
   - Stores ingredients, available stock, reorder levels, procurement dates, and supplier details.

## Five Backend Business Rules

1. Expected order volume must be greater than zero before a production plan is saved.
2. Production capacity per day must be greater than zero so utilisation can be calculated.
3. Ingredient procurement must start before production begins.
4. Planned batches must be enough to cover expected order volume within available production days.
5. Any plan with capacity utilisation above 100% must be flagged as high risk before approval.
