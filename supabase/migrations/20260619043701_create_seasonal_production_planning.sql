
CREATE TABLE IF NOT EXISTS production_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  festival_name TEXT NOT NULL,
  product_name TEXT NOT NULL,
  batch_size INTEGER NOT NULL CHECK (batch_size > 0),
  expected_orders INTEGER NOT NULL CHECK (expected_orders >= 0),
  production_capacity INTEGER NOT NULL CHECK (production_capacity > 0),
  procurement_deadline DATE NOT NULL,
  production_start_date DATE NOT NULL,
  production_end_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'planned' CHECK (status IN ('planned', 'active', 'completed', 'archived')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID REFERENCES production_plans(id) ON DELETE SET NULL,
  customer_name TEXT NOT NULL,
  product_name TEXT NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  order_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'delivered', 'cancelled')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ingredient_name TEXT NOT NULL,
  unit TEXT NOT NULL,
  quantity_available NUMERIC NOT NULL DEFAULT 0 CHECK (quantity_available >= 0),
  reorder_level NUMERIC NOT NULL DEFAULT 0,
  supplier_name TEXT,
  last_restocked DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS action_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID REFERENCES production_plans(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  old_status TEXT,
  new_status TEXT,
  performed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  notes TEXT
);

ALTER TABLE production_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE action_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_plans" ON production_plans FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "insert_plans" ON production_plans FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "update_plans" ON production_plans FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "delete_plans" ON production_plans FOR DELETE TO anon, authenticated USING (true);

CREATE POLICY "select_orders" ON orders FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "insert_orders" ON orders FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "update_orders" ON orders FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "delete_orders" ON orders FOR DELETE TO anon, authenticated USING (true);

CREATE POLICY "select_inventory" ON inventory FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "insert_inventory" ON inventory FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "update_inventory" ON inventory FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "delete_inventory" ON inventory FOR DELETE TO anon, authenticated USING (true);

CREATE POLICY "select_history" ON action_history FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "insert_history" ON action_history FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "update_history" ON action_history FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "delete_history" ON action_history FOR DELETE TO anon, authenticated USING (true);

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at_plans BEFORE UPDATE ON production_plans FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at_orders BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at_inventory BEFORE UPDATE ON inventory FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Requirements
CREATE TABLE IF NOT EXISTS requirements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_name TEXT NOT NULL,
  quantity_needed INTEGER NOT NULL,
  ingredients JSONB NOT NULL,
  auto_created TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Admin credentials
CREATE TABLE IF NOT EXISTS admin_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Insert default admin:password if not exists
INSERT INTO admin_credentials (username, password)
VALUES ('admin', 'password')
ON CONFLICT (username) DO NOTHING;

-- Enable RLS
ALTER TABLE requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_credentials ENABLE ROW LEVEL SECURITY;

-- Policies for Requirements
CREATE POLICY "select_requirements" ON requirements FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "insert_requirements" ON requirements FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "update_requirements" ON requirements FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "delete_requirements" ON requirements FOR DELETE TO anon, authenticated USING (true);

-- Policies for Admin Credentials
CREATE POLICY "select_admin_credentials" ON admin_credentials FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "insert_admin_credentials" ON admin_credentials FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "update_admin_credentials" ON admin_credentials FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "delete_admin_credentials" ON admin_credentials FOR DELETE TO anon, authenticated USING (true);

-- Triggers for updated_at
CREATE TRIGGER set_updated_at_requirements BEFORE UPDATE ON requirements FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at_admin_credentials BEFORE UPDATE ON admin_credentials FOR EACH ROW EXECUTE FUNCTION update_updated_at();
