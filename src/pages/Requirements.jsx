import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import Spinner from '../components/Spinner';
import ConfirmDialog from '../components/ConfirmDialog';

const EMPTY_ROW = { ingredient_id: '', ingredient_name: '', amount_per_unit: '' };

export default function Requirements({ onToast }) {
  const [loading, setLoading] = useState(true);
  const [inventory, setInventory] = useState([]);
  const [savedRequirements, setSavedRequirements] = useState([]);
  const [productName, setProductName] = useState('');
  const [quantityNeeded, setQuantityNeeded] = useState(1);
  const [rows, setRows] = useState([ { ...EMPTY_ROW } ]);
  const [editingId, setEditingId] = useState(null);
  const [editingAutoCreated, setEditingAutoCreated] = useState([]);
  const [results, setResults] = useState(null);
  const [saving, setSaving] = useState(false);
  const [confirm, setConfirm] = useState(null);

  useEffect(() => { loadInventory(); loadRequirements(); }, []);

  const loadRequirements = async () => {
    const { data } = await supabase.from('requirements').select('*').order('updated_at', { ascending: false });
    setSavedRequirements(data || []);
  };

  const loadInventory = async () => {
    setLoading(true);
    const { data } = await supabase.from('inventory').select('*').order('ingredient_name');
    setInventory(data || []);
    setLoading(false);
  };

  const setRow = (idx, key, val) => {
    setRows(r => r.map((row, i) => i === idx ? { ...row, [key]: val } : row));
  };

  const getSuggestions = (text) => {
    if (!text || !text.trim()) return [];
    const lower = text.trim().toLowerCase();
    return inventory
      .map(i => i.ingredient_name)
      .filter(name => name && name.toLowerCase().includes(lower))
      .slice(0, 5);
  };

  // Ensure any ingredient names in rows exist in inventory. If missing, insert with quantity 0.
  const ensureInventoryEntries = async (rowsToCheck) => {
    if (!rowsToCheck || rowsToCheck.length === 0) return { inventory, inserted: [] };
    const names = rowsToCheck.map(r => (r.ingredient_name || '').trim()).filter(n => n);
    if (names.length === 0) return { inventory, inserted: [] };
    const existing = inventory.map(i => (i.ingredient_name || '').trim().toLowerCase());
    const missingNames = [...new Set(names)].filter(n => !existing.includes(n.toLowerCase()));
    if (missingNames.length === 0) return { inventory, inserted: [] };

    const toInsert = missingNames.map(n => ({ ingredient_name: n, unit: 'kg', quantity_available: 0, reorder_level: 0, supplier_name: '', last_restocked: null }));
    try {
      await supabase.from('inventory').insert(toInsert);
      const { data: updatedInventory } = await supabase.from('inventory').select('*').order('ingredient_name');
      setInventory(updatedInventory || []);
      return { inventory: updatedInventory || [], inserted: missingNames };
    } catch (err) {
      console.error('Failed to insert missing inventory items', err);
      onToast('Failed to add missing inventory items.', 'error');
      return { inventory, inserted: [] };
    }
  };

  const addRow = () => setRows(r => ([...r, { ...EMPTY_ROW }]));
  const removeRow = idx => setRows(r => r.filter((_, i) => i !== idx));

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Basic validation
    if (!productName.trim()) { onToast('Product name is required.', 'error'); return; }
    if (!quantityNeeded || Number(quantityNeeded) <= 0) { onToast('Quantity needed must be > 0', 'error'); return; }
    if (rows.length === 0) { onToast('Add at least one ingredient.', 'error'); return; }

    // Ensure inventory has entries for typed ingredient names (insert with qty 0 if missing)
    const { inventory: currentInventory, inserted } = await ensureInventoryEntries(rows);

    // Compute checks
    const invMap = (currentInventory || []).reduce((acc, it) => { acc[it.id] = it; return acc; }, {});
    const outOfStock = [];
    const lowStock = [];
    const shortages = [];

    for (const r of rows) {
      const id = r.ingredient_id;
      const name = r.ingredient_name || (inventory.find(i => i.id === id) || {}).ingredient_name || '';
      const perUnit = Number(r.amount_per_unit) || 0;
      const requiredTotal = perUnit * Number(quantityNeeded);
      const inv = id ? invMap[id] : inventory.find(i => (i.ingredient_name || '').toLowerCase() === name.toLowerCase());
      const available = inv ? Number(inv.quantity_available) : 0;
      const reorder = inv ? Number(inv.reorder_level) : 0;

      if (!inv || available <= 0) outOfStock.push({ name, requiredTotal, available });
      else {
        if (available < requiredTotal) shortages.push({ name, requiredTotal, available });
        if (available <= reorder) lowStock.push({ name, available, reorder });
      }
    }

    setResults({ outOfStock, lowStock, shortages });

    // Save or update the requirement record
    setSaving(true);
    try {
      const payload = {
        product_name: productName,
        quantity_needed: Number(quantityNeeded),
        ingredients: rows,
        auto_created: editingId ? [...new Set([...(editingAutoCreated || []), ...inserted])] : inserted,
      };

      if (editingId) {
        await supabase.from('requirements').update(payload).eq('id', editingId);
        onToast('Requirement updated successfully.', 'success');
      } else {
        await supabase.from('requirements').insert(payload);
        onToast('Requirement saved to requirements table.', 'success');
      }

      setEditingId(null);
      await loadRequirements();
    } catch (err) {
      onToast('Failed saving requirement.', 'error');
    }
    setSaving(false);
  };

  const handleApprove = async () => {
    if (!results) {
      onToast('Run inventory check first.', 'error');
      return;
    }

    const { outOfStock, shortages } = results;
    if ((outOfStock && outOfStock.length > 0) || (shortages && shortages.length > 0)) {
      setConfirm({ msg: 'Some items are out of stock or insufficient. Proceed and consume available quantities?', fn: performConsume });
      return;
    }
    // proceed directly
    performConsume();
  };

  const performConsume = async (reqPayload = null) => {
    setConfirm(null);
    setSaving(true);
    try {
      const sourceRows = reqPayload ? (reqPayload.ingredients || []) : rows;

      // Ensure inventory has entries for any free-text ingredient names before consuming
      const { inventory: currentInventory } = await ensureInventoryEntries(sourceRows);
      const invMap = (currentInventory || []).reduce((acc, it) => { acc[it.id] = it; return acc; }, {});
      const updates = [];
      for (const r of sourceRows) {
        const id = r.ingredient_id;
        const name = r.ingredient_name || (inventory.find(i => i.id === id) || {}).ingredient_name || '';
        const perUnit = Number(r.amount_per_unit) || 0;
        const qtyNeeded = reqPayload ? Number(reqPayload.quantity_needed) : Number(quantityNeeded);
        const requiredTotal = perUnit * qtyNeeded;
        const inv = id ? invMap[id] : inventory.find(i => (i.ingredient_name || '').toLowerCase() === name.toLowerCase());
        if (!inv) continue;
        const available = Number(inv.quantity_available) || 0;
        const newQty = Math.max(0, available - requiredTotal);
        updates.push({ id: inv.id, quantity_available: newQty });
      }

      // perform updates sequentially
      for (const u of updates) {
        await supabase.from('inventory').update({ quantity_available: Number(u.quantity_available) }).eq('id', u.id);
      }

      // log action
      await supabase.from('action_history').insert({ action: 'consume_requirements', product_name: productName, quantity: Number(quantityNeeded), items: JSON.stringify(rows) });

      onToast('Inventory updated after approval.', 'success');
      await loadInventory();
      // re-run check
      setResults(null);
    } catch (err) {
      onToast('Failed to update inventory.', 'error');
    }
    setSaving(false);
  };

  return (
    <div>
      <h1 style={{ fontSize: 22, marginBottom: 8 }}>Product Requirements</h1>
      <p style={{ color: 'var(--neutral-400)', marginBottom: 16 }}>Enter product details and ingredient requirements. The system will check current inventory and report out-of-stock or low-stock items.</p>

      <form onSubmit={handleSubmit} style={{ background: '#fff', borderRadius: 12, padding: 20, marginBottom: 20 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 160px', gap: 12, marginBottom: 12 }}>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--neutral-700)' }}>Product Name</label>
            <input value={productName} onChange={e => setProductName(e.target.value)} placeholder="e.g. Sesame Ladoo" style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid var(--neutral-200)', marginTop: 6 }} />
          </div>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--neutral-700)' }}>Quantity Needed</label>
            <input type="number" min="1" value={quantityNeeded} onChange={e => setQuantityNeeded(e.target.value)} style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid var(--neutral-200)', marginTop: 6 }} />
          </div>
        </div>

        <div style={{ marginBottom: 12 }}>
          <h3 style={{ fontSize: 14, marginBottom: 8 }}>Ingredients</h3>
          {loading ? <Spinner /> : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {rows.map((row, idx) => {
                const matched = inventory.find(i => (i.ingredient_name || '').toLowerCase() === (row.ingredient_name || '').trim().toLowerCase());
                const suggestions = getSuggestions(row.ingredient_name);
                return (
                  <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1fr 160px 80px', gap: 8, alignItems: 'flex-start', position: 'relative' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', position: 'relative' }}>
                      <input value={row.ingredient_name} onChange={e => { setRow(idx, 'ingredient_name', e.target.value); setRow(idx, 'ingredient_id', ''); }} placeholder="Ingredient name (e.g. Lal Mirchi)" style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid var(--neutral-200)' }} />
                      <div style={{ fontSize: 12, marginTop: 6, color: matched ? 'var(--success-700)' : 'var(--error-600)' }}>
                        {matched ? `Found: ${matched.ingredient_name} — available ${matched.quantity_available}` : (row.ingredient_name ? 'Not found in inventory' : '')}
                      </div>
                      {suggestions.length > 0 && row.ingredient_name.trim() && (
                        <div style={{ marginTop: 6, background: '#fff', border: '1px solid var(--neutral-200)', borderRadius: 8, boxShadow: '0 8px 16px rgba(0,0,0,0.08)', maxHeight: 160, overflowY: 'auto' }}>
                          {suggestions.map(name => (
                            <button key={name} type="button" onClick={() => { setRow(idx, 'ingredient_name', name); setRow(idx, 'ingredient_id', inventory.find(i => i.ingredient_name === name)?.id || ''); }} style={{ width: '100%', textAlign: 'left', padding: '8px 10px', border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 13, color: 'var(--neutral-800)' }}>
                              {name}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    <input value={row.amount_per_unit} onChange={e => setRow(idx, 'amount_per_unit', e.target.value)} placeholder="Amount/unit" style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid var(--neutral-200)' }} />
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button type="button" onClick={() => removeRow(idx)} style={{ padding: '8px', borderRadius: 8, border: '1px solid var(--error-200)', background: 'var(--error-50)', color: 'var(--error-600)', cursor: 'pointer' }}>Del</button>
                      {idx === rows.length - 1 && <button type="button" onClick={addRow} style={{ padding: '8px', borderRadius: 8, border: '1px solid var(--primary-200)', background: 'var(--primary-50)', color: 'var(--primary-600)', cursor: 'pointer' }}>Add</button>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: 12 }}>
          <button type="submit" disabled={saving} style={{ padding: '10px 18px', borderRadius: 8, border: 'none', background: 'var(--primary-600)', color: '#fff' }}>{saving ? 'Saving...' : 'Save & Check Inventory'}</button>
          <button type="button" onClick={() => { setProductName(''); setQuantityNeeded(1); setRows([{ ...EMPTY_ROW }]); setResults(null); setEditingId(null); setEditingAutoCreated([]); }} style={{ padding: '10px 18px', borderRadius: 8, border: '1px solid var(--neutral-200)', background: '#fff' }}>Reset</button>
          <button type="button" onClick={handleApprove} disabled={saving} style={{ padding: '10px 18px', borderRadius: 8, border: 'none', background: 'var(--error-600)', color: '#fff' }}>Approve & Consume</button>
        </div>
      </form>

      {confirm && <ConfirmDialog message={confirm.msg} onConfirm={confirm.fn} onCancel={() => setConfirm(null)} />}

      {results && (
        <div style={{ background: '#fff', borderRadius: 12, padding: 16 }}>
          <h3 style={{ marginBottom: 8 }}>Inventory Check Results</h3>
          {results.outOfStock.length > 0 && (
            <div style={{ marginBottom: 12 }}>
              <strong>Out of stock:</strong>
              <ul>{results.outOfStock.map((r,i) => <li key={i}>{r.name} — required {r.requiredTotal}, available {r.available}</li>)}</ul>
            </div>
          )}
          {results.shortages.length > 0 && (
            <div style={{ marginBottom: 12 }}>
              <strong>Shortages (not enough for requested quantity):</strong>
              <ul>{results.shortages.map((r,i) => <li key={i}>{r.name} — required {r.requiredTotal}, available {r.available}</li>)}</ul>
            </div>
          )}
          {results.lowStock.length > 0 && (
            <div style={{ marginBottom: 12 }}>
              <strong>Low stock (at or below reorder level):</strong>
              <ul>{results.lowStock.map((r,i) => <li key={i}>{r.name} — available {r.available}, reorder level {r.reorder}</li>)}</ul>
            </div>
          )}
          {results.outOfStock.length === 0 && results.shortages.length === 0 && results.lowStock.length === 0 && (
            <div style={{ color: 'var(--success-700)' }}>All ingredients available in sufficient quantity.</div>
          )}
        </div>
      )}

      <div style={{ marginTop: 20 }}>
        <h2 style={{ fontSize: 16, marginBottom: 8 }}>Saved Requirements</h2>
        <div style={{ background: '#fff', borderRadius: 12, padding: 12 }}>
          {savedRequirements.length === 0 ? (
            <div style={{ color: 'var(--neutral-400)', padding: 12 }}>No saved requirements.</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--neutral-200)' }}>
                    <th style={{ padding: 8 }}>Product</th>
                    <th style={{ padding: 8 }}>Quantity</th>
                    <th style={{ padding: 8 }}>Auto-created</th>
                    <th style={{ padding: 8 }}>Last Updated</th>
                    <th style={{ padding: 8 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {savedRequirements.map(r => (
                    <tr key={r.id} style={{ borderBottom: '1px solid var(--neutral-100)' }}>
                      <td style={{ padding: 8, fontWeight: 600 }}>{r.product_name}</td>
                      <td style={{ padding: 8 }}>{r.quantity_needed}</td>
                      <td style={{ padding: 8 }}>{r.auto_created && r.auto_created.length > 0 ? r.auto_created.join(', ') : '—'}</td>
                      <td style={{ padding: 8 }}>{new Date(r.updated_at || r.created_at).toLocaleString()}</td>
                      <td style={{ padding: 8 }}>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button onClick={() => { setProductName(r.product_name); setQuantityNeeded(r.quantity_needed); setRows(r.ingredients || [{ ...EMPTY_ROW }]); setResults(null); setEditingId(r.id); setEditingAutoCreated(r.auto_created || []); window.scrollTo({ top: 0, behavior: 'smooth' }); }} style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid var(--primary-200)', background: 'var(--primary-50)', color: 'var(--primary-600)' }}>Load</button>
                          <button onClick={async () => { const updates = await performConsume(r); setResults({ outOfStock: [], lowStock: [], shortages: [], updates }); }} style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid var(--success-200)', background: 'var(--success-50)', color: 'var(--success-600)' }}>Approve & Consume</button>
                          <button onClick={() => setConfirm({ msg: `Delete requirement for ${r.product_name}?`, fn: async () => { await supabase.from('requirements').delete().eq('id', r.id); setConfirm(null); loadRequirements(); onToast('Requirement deleted.', 'success'); } })} style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid var(--error-200)', background: 'var(--error-50)', color: 'var(--error-600)' }}>Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
