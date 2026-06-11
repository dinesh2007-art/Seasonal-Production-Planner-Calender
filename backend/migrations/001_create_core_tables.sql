CREATE TABLE seasonal_production_planning (
  id SERIAL PRIMARY KEY,
  admin VARCHAR(120) NOT NULL,
  plan_name VARCHAR(160) NOT NULL,
  production_item VARCHAR(160) NOT NULL,
  batches INTEGER NOT NULL CHECK (batches > 0),
  upcoming_festival VARCHAR(120) NOT NULL,
  expected_order_volume INTEGER NOT NULL CHECK (expected_order_volume > 0),
  ingredient_procurement_start_date DATE NOT NULL,
  production_start_date DATE NOT NULL,
  production_capacity_per_day INTEGER NOT NULL CHECK (production_capacity_per_day > 0),
  status VARCHAR(40) NOT NULL DEFAULT 'planned',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE orders (
  id SERIAL PRIMARY KEY,
  seasonal_production_planning_id INTEGER REFERENCES seasonal_production_planning(id),
  admin VARCHAR(120) NOT NULL,
  plan_name VARCHAR(160) NOT NULL,
  production_item VARCHAR(160) NOT NULL,
  order_volume INTEGER NOT NULL CHECK (order_volume > 0),
  status VARCHAR(40) NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE inventory (
  id SERIAL PRIMARY KEY,
  seasonal_production_planning_id INTEGER REFERENCES seasonal_production_planning(id),
  admin VARCHAR(120) NOT NULL,
  ingredient_name VARCHAR(160) NOT NULL,
  available_quantity INTEGER NOT NULL DEFAULT 0,
  required_quantity INTEGER NOT NULL DEFAULT 0,
  unit VARCHAR(40) NOT NULL,
  status VARCHAR(40) NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
