# Technical Abstract

The Seasonal Production Planning Calendar backend provides API routes for managing production plans, retrieving dashboard data, and calculating capacity utilisation. The system is designed for Sharadha Stores, where admins must plan festival production batches by connecting expected order volumes with ingredient procurement timelines and available production capacity.

The planned backend uses a Node.js API server with a database such as MySQL or PostgreSQL. The main database tables are `seasonal_production_planning`, `orders`, and `inventory`. The `seasonal_production_planning` table stores the admin, plan name, production item, batches, upcoming festival, expected order volume, procurement dates, production dates, daily capacity, calculated utilisation, and status.

The core processing logic validates required fields, checks date order, calculates required production days, calculates capacity utilisation percentage, and identifies risk levels. API responses use JSON so the frontend dashboard, detail view, reports, and future analytics screens can consume the same structured data.
