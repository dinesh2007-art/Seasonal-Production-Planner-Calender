// In-memory database for Vercel (data resets on redeploy/restart)
// For production, integrate with a real database like MongoDB or Supabase
let db = {
  production_plans: [],
  orders: [],
  inventory: [],
  requirements: [],
  action_history: [],
  admin_credentials: {
    username: "admin",
    password: "password"
  }
};

export function getDb() {
  return db;
}

export function saveDb(data) {
  db = { ...db, ...data };
}

export function resetDb() {
  db = {
    production_plans: [],
    orders: [],
    inventory: [],
    requirements: [],
    action_history: [],
    admin_credentials: {
      username: "admin",
      password: "password"
    }
  };
}
