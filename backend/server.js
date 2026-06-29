import express from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = 3001;
const DB_PATH = path.join(__dirname, 'db.json');

app.use(cors());
app.use(express.json());

// Initialize database
function initDb() {
  if (!fs.existsSync(DB_PATH)) {
    const initialDb = {
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
    fs.writeFileSync(DB_PATH, JSON.stringify(initialDb, null, 2));
  }
}

function loadDb() {
  const db = JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
  if (!db.admin_credentials) {
    db.admin_credentials = {
      username: "admin",
      password: "password"
    };
    saveDb(db);
  }
  if (!db.requirements) {
    db.requirements = [];
    saveDb(db);
  }
  return db;
}

function saveDb(data) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

initDb();

// Helper: create response format compatible with Supabase
const createResponse = (data, error = null) => ({ data, error });

// Production Plans
app.get('/api/production_plans', (req, res) => {
  const db = loadDb();
  res.json(createResponse(db.production_plans));
});

app.post('/api/production_plans', (req, res) => {
  const db = loadDb();
  const plan = { id: uuidv4(), ...req.body, created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
  db.production_plans.push(plan);
  saveDb(db);
  res.json(createResponse([plan]));
});

app.put('/api/production_plans/:id', (req, res) => {
  const db = loadDb();
  const idx = db.production_plans.findIndex(p => p.id === req.params.id);
  if (idx === -1) return res.json(createResponse([]));
  db.production_plans[idx] = { ...db.production_plans[idx], ...req.body, updated_at: new Date().toISOString() };
  saveDb(db);
  res.json(createResponse([db.production_plans[idx]]));
});

app.delete('/api/production_plans/:id', (req, res) => {
  const db = loadDb();
  db.production_plans = db.production_plans.filter(p => p.id !== req.params.id);
  saveDb(db);
  res.json(createResponse([]));
});

// Orders
app.get('/api/orders', (req, res) => {
  const db = loadDb();
  res.json(createResponse(db.orders));
});

app.post('/api/orders', (req, res) => {
  const db = loadDb();
  const order = { id: uuidv4(), ...req.body, created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
  db.orders.push(order);
  saveDb(db);
  res.json(createResponse([order]));
});

app.put('/api/orders/:id', (req, res) => {
  const db = loadDb();
  const idx = db.orders.findIndex(o => o.id === req.params.id);
  if (idx === -1) return res.json(createResponse([]));
  db.orders[idx] = { ...db.orders[idx], ...req.body, updated_at: new Date().toISOString() };
  saveDb(db);
  res.json(createResponse([db.orders[idx]]));
});

app.delete('/api/orders/:id', (req, res) => {
  const db = loadDb();
  db.orders = db.orders.filter(o => o.id !== req.params.id);
  saveDb(db);
  res.json(createResponse([]));
});

// Inventory
app.get('/api/inventory', (req, res) => {
  const db = loadDb();
  res.json(createResponse(db.inventory));
});

app.post('/api/inventory', (req, res) => {
  const db = loadDb();
  const item = { id: uuidv4(), ...req.body, created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
  db.inventory.push(item);
  saveDb(db);
  res.json(createResponse([item]));
});

app.put('/api/inventory/:id', (req, res) => {
  const db = loadDb();
  const idx = db.inventory.findIndex(i => i.id === req.params.id);
  if (idx === -1) return res.json(createResponse([]));
  db.inventory[idx] = { ...db.inventory[idx], ...req.body, updated_at: new Date().toISOString() };
  saveDb(db);
  res.json(createResponse([db.inventory[idx]]));
});

app.delete('/api/inventory/:id', (req, res) => {
  const db = loadDb();
  db.inventory = db.inventory.filter(i => i.id !== req.params.id);
  saveDb(db);
  res.json(createResponse([]));
});

// Action History
app.get('/api/action_history', (req, res) => {
  const db = loadDb();
  res.json(createResponse(db.action_history));
});

app.post('/api/action_history', (req, res) => {
  const db = loadDb();
  const action = { id: uuidv4(), ...req.body, performed_at: new Date().toISOString() };
  db.action_history.push(action);
  saveDb(db);
  res.json(createResponse([action]));
});

// Requirements endpoints
app.get('/api/requirements', (req, res) => {
  const db = loadDb();
  res.json(createResponse(db.requirements));
});

app.post('/api/requirements', (req, res) => {
  const db = loadDb();
  const item = { id: uuidv4(), ...req.body, created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
  db.requirements.push(item);
  saveDb(db);
  res.json(createResponse([item]));
});

app.put('/api/requirements/:id', (req, res) => {
  const db = loadDb();
  const idx = db.requirements.findIndex(r => r.id === req.params.id);
  if (idx === -1) return res.json(createResponse([]));
  db.requirements[idx] = { ...db.requirements[idx], ...req.body, updated_at: new Date().toISOString() };
  saveDb(db);
  res.json(createResponse([db.requirements[idx]]));
});

app.delete('/api/requirements/:id', (req, res) => {
  const db = loadDb();
  db.requirements = db.requirements.filter(r => r.id !== req.params.id);
  saveDb(db);
  res.json(createResponse([]));
});

// Admin Authentication Endpoints
app.post('/api/admin/login', (req, res) => {
  const db = loadDb();
  const { username, password } = req.body;
  if (db.admin_credentials.username === username && db.admin_credentials.password === password) {
    res.json(createResponse({ success: true, message: 'Login successful' }));
  } else {
    res.status(401).json(createResponse(null, 'Invalid username or password'));
  }
});

app.get('/api/admin/credentials', (req, res) => {
  const db = loadDb();
  res.json(createResponse({ username: db.admin_credentials.username }));
});

app.put('/api/admin/credentials', (req, res) => {
  const db = loadDb();
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json(createResponse(null, 'Username and password are required'));
  }
  db.admin_credentials = { username, password };
  saveDb(db);
  res.json(createResponse({ username, message: 'Credentials updated successfully' }));
});

app.listen(PORT, () => {
  console.log(`✅ Backend server running at http://localhost:${PORT}`);
  console.log(`📁 Database file: ${DB_PATH}`);
});
