# Proposed System Description

## Screen 1: Seasonal Production Planning Entry Form

Purpose: Capture a new festival production plan before procurement and production begin.  
Actors: Admin or staff member.  
Inputs: Admin, plan name, production item, batches, upcoming festival, expected order volume, procurement start date, production start date, production capacity per day, status.  
Outputs: Saved planning record with validation messages for missing or invalid values.

## Screen 2: Seasonal Production Planning Dashboard

Purpose: Show all production plans in one place for quick tracking.  
Actors: Admin, staff, reviewer.  
Inputs: API data, status filter, search keyword.  
Outputs: Table of records with admin, plan, production item, batches, status, and actions.

## Screen 3: Detail and History View

Purpose: Show a complete record with related order, inventory, and action history.  
Actors: Admin and staff.  
Inputs: Selected planning record ID.  
Outputs: Full planning information, linked data, and future print/export action.

## Screen 4: Admin Configuration Panel

Purpose: Allow admin to configure business thresholds used by the capacity and utilisation engine.  
Actors: Admin.  
Inputs: Capacity threshold, risk limits, allowed statuses, alert settings.  
Outputs: Saved configuration used by validation and reporting.

## Screen 5: Reports and Analytics Dashboard

Purpose: Summarise planning performance and capacity risk.  
Actors: Admin and management.  
Inputs: Date range, status, festival, production item.  
Outputs: Summary counts, status distribution, capacity utilisation, and exportable report data.

## Current Manual Process vs Digital System

| Current Process at Sharadha Stores | Seasonal Production Planning Calendar |
| --- | --- |
| Plans may be discussed through WhatsApp or calls. | Plans are entered into a structured form. |
| Order volume and production capacity are compared manually. | Capacity utilisation is calculated consistently. |
| Procurement dates may be tracked separately. | Procurement and production dates stay in one record. |
| Status updates are scattered across messages. | Status is visible in the dashboard. |
| Reports require manual compilation. | Reports can be generated from stored data. |
