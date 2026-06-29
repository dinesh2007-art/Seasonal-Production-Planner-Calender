import { v4 as uuidv4 } from 'uuid';
import { getDb, saveDb } from './db.js';

const createResponse = (data, error = null) => ({ data, error });

// Helper to parse request body
async function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (e) {
        resolve({});
      }
    });
    req.on('error', reject);
  });
}

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    // Parse body for POST/PUT requests
    if (req.method === 'POST' || req.method === 'PUT') {
      req.body = req.body || await parseBody(req);
    }

    const { slug } = req.query;
    const segments = Array.isArray(slug) ? slug : (slug ? [slug] : []);
    
    // Build path from segments
    const [first, second] = segments;
    
    // Route admin endpoints first
    if (first === 'admin') {
      if (second === 'login' && req.method === 'POST') {
        return handleAdminLogin(req, res);
      }
      if (second === 'credentials') {
        if (req.method === 'GET') return handleGetCredentials(req, res);
        if (req.method === 'PUT') return handleUpdateCredentials(req, res);
      }
      return res.status(404).json(createResponse(null, 'Admin endpoint not found'));
    }
    
    // Route table endpoints
    const table = first;
    const id = second;
    const validTables = ['production_plans', 'orders', 'inventory', 'requirements', 'action_history'];
    
    if (!validTables.includes(table)) {
      return res.status(404).json(createResponse(null, 'Table not found'));
    }

    const db = getDb();

    switch (req.method) {
      case 'GET':
        if (id) {
          const item = db[table].find(i => i.id === id);
          return res.json(createResponse(item ? [item] : []));
        } else {
          return res.json(createResponse(db[table]));
        }

      case 'POST':
        const newItem = { 
          id: uuidv4(), 
          ...req.body, 
          created_at: new Date().toISOString(), 
          updated_at: new Date().toISOString() 
        };
        db[table].push(newItem);
        saveDb(db);
        return res.json(createResponse([newItem]));

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
        return res.json(createResponse([db[table][idx]]));

      case 'DELETE':
        if (!id) {
          return res.status(400).json(createResponse(null, 'ID is required for DELETE'));
        }
        db[table] = db[table].filter(i => i.id !== id);
        saveDb(db);
        return res.json(createResponse([]));

      default:
        return res.status(405).json(createResponse(null, 'Method not allowed'));
    }
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json(createResponse(null, error.message));
  }
}

function handleAdminLogin(req, res) {
  const db = getDb();
  const { username, password } = req.body || {};
  
  if (db.admin_credentials.username === username && db.admin_credentials.password === password) {
    return res.json(createResponse({ success: true, message: 'Login successful' }));
  } else {
    return res.status(401).json(createResponse(null, 'Invalid username or password'));
  }
}

function handleGetCredentials(req, res) {
  const db = getDb();
  return res.json(createResponse({ username: db.admin_credentials.username }));
}

function handleUpdateCredentials(req, res) {
  const db = getDb();
  const { username, password } = req.body || {};
  
  if (!username || !password) {
    return res.status(400).json(createResponse(null, 'Username and password are required'));
  }
  
  db.admin_credentials = { username, password };
  saveDb(db);
  return res.json(createResponse({ username, message: 'Credentials updated successfully' }));
}
