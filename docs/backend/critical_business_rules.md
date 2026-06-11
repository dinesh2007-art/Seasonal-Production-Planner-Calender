# Critical Backend Business Rules

## Rule 1: Procurement Must Happen Before Production

Ingredient procurement start date must be earlier than the production start date. A production plan cannot be approved if ingredients will arrive after production begins.

## Rule 2: Capacity Must Cover Expected Demand

Expected order volume must be compared with production capacity per day and number of planned batches. If capacity utilisation is above 100%, the plan is high risk.

## Rule 3: Required Fields Must Be Complete

The backend must reject incomplete plans. Required fields are admin, plan name, production item, batches, upcoming festival, expected order volume, ingredient procurement start date, production start date, and production capacity per day.
