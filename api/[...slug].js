import { v4 as uuidv4 } from 'uuid';
import { getDb, saveDb } from './db.js';

const createResponse = (data, error = null) => ({ data, error });

export default function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const { slug } = req.query;
  const path = slug ? '/' + slug.join('/') : '/';
  
  // Route requests
  if (path.startsWith('/admin/login') && req.method === 'POST') {
    return handleAdminLogin(req, res);
  }
  if (path.startsWith('/admin/credentials')) {
    if (req.method === 'GET') return handleGetCredentials(req, res);
    if (req.method === 'PUT') return handleUpdateCredentials(req, res);
  }
  
  // Table endpoints (production_plans, orders, inventory, requirements, action_history)
  const match = path.match(/^\/(\w+)(?:\/(.+))?$/);
  if (!match) {
    return res.status(404).json(createResponse(null, 'Not found'));
  }

  const [, table, id] = match;
  const validTables = ['production_plans', 'orders', 'inventory', 'requirements', 'action_history'];
  
  if (!validTables.includes(table)) {
    return res.status(404).json(createResponse(null, 'Table not found'));
  }

  const db = getDb();

  switch (req.method) {
    case 'GET':
      if (id) {
        const item = db[table].find(i => i.id === id);
        res.json(createResponse(item ? [item] : []));
      } else {
        res.json(createResponse(db[table]));
      }
      break;

    case 'POST':
      const newItem = { 
        id: uuidv4(), 
        ...req.body, 
        created_at: new Date().toISOString(), 
        updated_at: new Date().toISOString() 
      };
      db[table].push(newItem);
      saveDb(db);
      res.json(createResponse([newItem]));
      break;

    case 'PUT':
      if (!id) {
        return res.status(400).json(createResponse(null, 'ID is required for PUT'));
      }
      const idx = db[table].findIndex(i => i.id === id);
      if (idx === -1) {
        return res.json(createResponse([]));
      }
      db[table][idx] = { 
        ...db[table][idx], 
        ...req.body, 
        updated_at: new Date().toISOString() 
      };
      saveDb(db);
      res.json(createResponse([db[table][idx]]));
      break;

    case 'DELETE':
      if (!id) {
        return res.status(400).json(createResponse(null, 'ID is required for DELETE'));
      }
      db[table] = db[table].filter(i => i.id !== id);
      saveDb(db);
      res.json(createResponse([]));
      break;

    default:
      res.status(405).json(createResponse(null, 'Method not allowed'));
  }
}

function handleAdminLogin(req, res) {
  const db = getDb();
  const { username, password } = req.body;
  
  if (db.admin_credentials.username === username && db.admin_credentials.password === password) {
    res.json(createResponse({ success: true, message: 'Login successful' }));
  } else {
    res.status(401).json(createResponse(null, 'Invalid username or password'));
  }
}

function handleGetCredentials(req, res) {
  const db = getDb();
  res.json(createResponse({ username: db.admin_credentials.username }));
}

function handleUpdateCredentials(req, res) {
  const db = getDb();
  const { username, password } = req.body;
  
  if (!username || !password) {
    return res.status(400).json(createResponse(null, 'Username and password are required'));
  }
  
  db.admin_credentials = { username, password };
  saveDb(db);
  res.json(createResponse({ username, message: 'Credentials updated successfully' }));
}
