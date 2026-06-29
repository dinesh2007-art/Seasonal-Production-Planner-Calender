import { createClient } from '@supabase/supabase-js';

const API_BASE = import.meta.env.VITE_API_URL || '/api';
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Helper to safely parse JSON from a response and provide a meaningful error message
async function safeJson(response) {
  const text = await response.text();
  try {
    return text ? JSON.parse(text) : {};
  } catch (e) {
    throw new Error(
      `Failed to parse API response as JSON. Received text: "${text.slice(0, 150)}". ` +
      `Ensure that your backend server is running and returning valid JSON.`
    );
  }
}

// Custom query builder that works with our local API and supports chaining
function createApiQuery(table) {
  let filters = {};
  let orderByField = null;
  let orderAscending = true;
  let selectedFields = '*';
  let rangeStart = null;
  let rangeEnd = null;
  let countRequested = false;
  let operation = 'select'; // default operation
  let payload = null;

  const executeQuery = async () => {
    try {
      if (operation === 'select') {
        const res = await fetch(`${API_BASE}/${table}`);
        if (!res.ok) throw new Error(`API error: ${res.status}`);
        const json = await safeJson(res);
        let data = json.data || [];

        // Apply filters
        if (Object.keys(filters).length > 0) {
          data = data.filter(item => {
            return Object.entries(filters).every(([field, filter]) => {
              if (filter.type === 'eq') return item[field] === filter.value;
              if (filter.type === 'in') return filter.values.includes(item[field]);
              if (filter.type === 'ilike') {
                const val = String(item[field]).toLowerCase();
                const pattern = String(filter.value).toLowerCase();
                return val.includes(pattern);
              }
              if (filter.type === 'gte') return item[field] >= filter.value;
              if (filter.type === 'lte') return item[field] <= filter.value;
              return true;
            });
          });
        }

        // Apply ordering
        if (orderByField) {
          data.sort((a, b) => {
            const aVal = a[orderByField];
            const bVal = b[orderByField];
            if (typeof aVal === 'string') {
              return orderAscending ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
            }
            return orderAscending ? aVal - bVal : bVal - aVal;
          });
        }

        // Store count before applying range
        const totalCount = data.length;

        // Apply range for pagination
        if (rangeStart !== null && rangeEnd !== null) {
          data = data.slice(rangeStart, rangeEnd + 1);
        }

        return { data, count: totalCount, error: null };
      } else if (operation === 'insert') {
        const data = Array.isArray(payload) ? payload : [payload];
        const results = [];
        for (const item of data) {
          const res = await fetch(`${API_BASE}/${table}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(item),
          });
          if (!res.ok) throw new Error(`Insert failed: ${res.status}`);
          const json = await safeJson(res);
          results.push(...(json.data || []));
        }
        return { data: results, error: null };
      } else if (operation === 'update') {
        const filterId = filters.id?.value;
        if (filterId) {
          // Single update by ID
          const res = await fetch(`${API_BASE}/${table}/${filterId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });
          if (!res.ok) throw new Error(`Update failed: ${res.status}`);
          const json = await safeJson(res);
          return { data: json.data || [], error: null };
        } else {
          // Bulk update or non-id filters (like status)
          // We fetch all records first, filter in memory, and perform updates for matches
          const getRes = await fetch(`${API_BASE}/${table}`);
          if (!getRes.ok) throw new Error(`API fetch error before update: ${getRes.status}`);
          const getJson = await safeJson(getRes);
          let itemsToUpdate = getJson.data || [];

          if (Object.keys(filters).length > 0) {
            itemsToUpdate = itemsToUpdate.filter(item => {
              return Object.entries(filters).every(([field, filter]) => {
                if (filter.type === 'eq') return item[field] === filter.value;
                if (filter.type === 'in') return filter.values.includes(item[field]);
                return true;
              });
            });
          }

          const results = [];
          for (const item of itemsToUpdate) {
            const res = await fetch(`${API_BASE}/${table}/${item.id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload),
            });
            if (res.ok) {
              const json = await safeJson(res);
              results.push(...(json.data || []));
            }
          }
          return { data: results, error: null };
        }
      } else if (operation === 'delete') {
        const filterId = filters.id?.value;
        if (filterId) {
          // Single delete by ID
          const res = await fetch(`${API_BASE}/${table}/${filterId}`, {
            method: 'DELETE',
          });
          if (!res.ok) throw new Error(`Delete failed: ${res.status}`);
          const json = await safeJson(res);
          return { data: json.data || [], error: null };
        } else {
          // Bulk delete or filtering (like status)
          const getRes = await fetch(`${API_BASE}/${table}`);
          if (!getRes.ok) throw new Error(`API fetch error before delete: ${getRes.status}`);
          const getJson = await safeJson(getRes);
          let itemsToDelete = getJson.data || [];

          if (Object.keys(filters).length > 0) {
            itemsToDelete = itemsToDelete.filter(item => {
              return Object.entries(filters).every(([field, filter]) => {
                if (filter.type === 'eq') return item[field] === filter.value;
                if (filter.type === 'in') return filter.values.includes(item[field]);
                return true;
              });
            });
          }

          const results = [];
          for (const item of itemsToDelete) {
            const res = await fetch(`${API_BASE}/${table}/${item.id}`, {
              method: 'DELETE',
            });
            if (res.ok) {
              const json = await safeJson(res);
              results.push(...(json.data || []));
            }
          }
          return { data: results, error: null };
        }
      }
    } catch (err) {
      console.error('API Error during execution:', err);
      return { data: null, error: err.message };
    }
  };

  const query = {
    select: (fields = '*', options = {}) => {
      selectedFields = fields;
      if (options.count) countRequested = true;
      operation = 'select';
      return query;
    },
    order: (field, options = {}) => {
      orderByField = field;
      orderAscending = options.ascending !== false;
      return query;
    },
    range: (start, end) => {
      rangeStart = start;
      rangeEnd = end;
      return query;
    },
    in: (field, values) => {
      filters[field] = { type: 'in', values };
      return query;
    },
    eq: (field, value) => {
      filters[field] = { type: 'eq', value };
      return query;
    },
    gte: (field, value) => {
      filters[field] = { type: 'gte', value };
      return query;
    },
    lte: (field, value) => {
      filters[field] = { type: 'lte', value };
      return query;
    },
    ilike: (field, pattern) => {
      filters[field] = { type: 'ilike', value: pattern };
      return query;
    },
    insert: (p) => {
      operation = 'insert';
      payload = p;
      return query;
    },
    update: (p) => {
      operation = 'update';
      payload = p;
      return query;
    },
    delete: () => {
      operation = 'delete';
      return query;
    },
    then: (onFulfilled, onRejected) => {
      return executeQuery().then(onFulfilled, onRejected);
    },
    catch: (onRejected) => {
      return executeQuery().catch(onRejected);
    },
    finally: (onFinally) => {
      return executeQuery().finally(onFinally);
    },
  };

  return query;
}

// Exported client
export let supabase;

if (supabaseUrl && supabaseAnonKey) {
  console.log('⚡ Connecting directly to Supabase API at:', supabaseUrl);
  const client = createClient(supabaseUrl, supabaseAnonKey);

  // Extend with custom admin auth helpers matching the local API structure
  client.auth.login = async (username, password) => {
    try {
      const { data, error } = await client
        .from('admin_credentials')
        .select('*')
        .eq('username', username)
        .maybeSingle();

      if (error) throw error;
      if (data && data.password === password) {
        return { data: { success: true }, error: null };
      }
      return { data: null, error: 'Invalid username or password' };
    } catch (err) {
      return { data: null, error: err.message };
    }
  };

  client.auth.getCredentials = async () => {
    try {
      const { data, error } = await client
        .from('admin_credentials')
        .select('username')
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return { data, error: null };
    } catch (err) {
      return { data: null, error: err.message };
    }
  };

  client.auth.updateCredentials = async (username, password) => {
    try {
      const { data: existing } = await client
        .from('admin_credentials')
        .select('id')
        .limit(1)
        .maybeSingle();

      let res;
      if (existing) {
        res = await client
          .from('admin_credentials')
          .update({ username, password })
          .eq('id', existing.id)
          .select();
      } else {
        res = await client
          .from('admin_credentials')
          .insert([{ username, password }])
          .select();
      }

      if (res.error) throw res.error;
      return { data: { username, message: 'Credentials updated successfully' }, error: null };
    } catch (err) {
      return { data: null, error: err.message };
    }
  };

  supabase = client;
} else {
  console.log('✅ Using local mock backend API at:', API_BASE);
  supabase = {
    from: (table) => createApiQuery(table),
    auth: {
      login: async (username, password) => {
        try {
          const res = await fetch(`${API_BASE}/admin/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password }),
          });
          const json = await safeJson(res);
          if (!res.ok) throw new Error(json.error || 'Login failed');
          return { data: json.data, error: null };
        } catch (err) {
          return { data: null, error: err.message };
        }
      },
      getCredentials: async () => {
        try {
          const res = await fetch(`${API_BASE}/admin/credentials`);
          const json = await safeJson(res);
          if (!res.ok) throw new Error(json.error || 'Failed to fetch credentials');
          return { data: json.data, error: null };
        } catch (err) {
          return { data: null, error: err.message };
        }
      },
      updateCredentials: async (username, password) => {
        try {
          const res = await fetch(`${API_BASE}/admin/credentials`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password }),
          });
          const json = await safeJson(res);
          if (!res.ok) throw new Error(json.error || 'Failed to update credentials');
          return { data: json.data, error: null };
        } catch (err) {
          return { data: null, error: err.message };
        }
      }
    }
  };
}
