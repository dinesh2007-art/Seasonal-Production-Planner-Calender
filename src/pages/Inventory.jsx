import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import Spinner from '../components/Spinner';
import ConfirmDialog from '../components/ConfirmDialog';

const UNITS = ['kg', 'g', 'litres', 'ml', 'pieces', 'packets', 'bottles', 'cans'];

const INITIAL = {
  ingredient_name: '',
  unit: 'kg',
  quantity_available: '',
  reorder_level: '',
  supplier_name: '',
  last_restocked: '',
};

function validate(f) {
  const e = {};
  if (!f.ingredient_name.trim()) e.ingredient_name = 'Ingredient name is required.';
  if (f.quantity_available === '' || Number(f.quantity_available) < 0) e.quantity_available = 'Quantity must be 0 or more.';
  if (f.reorder_level === '' || Number(f.reorder_level) < 0) e.reorder_level = 'Reorder level must be 0 or more.';
  return e;
}

export default function Inventory({ onToast }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(INITIAL);
  const [editId, setEditId] = useState(null);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [confirm, setConfirm] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from('inventory').select('*').order('ingredient_name');
    setItems(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const set = (k, v) => {
    setForm(p => ({ ...p, [k]: v }));
    setErrors(p => ({ ...p, [k]: undefined }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    const errs = validate(form);
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setSaving(true);
    const payload = { ...form, quantity_available: Number(form.quantity_available), reorder_level: Number(form.reorder_level), last_restocked: form.last_restocked || null };
    const { error } = editId
      ? await supabase.from('inventory').update(payload).eq('id', editId)
      : await supabase.from('inventory').insert(payload);
    setSaving(false);
    if (error) { setErrors({ _global: error.message }); return; }
    onToast(editId ? 'Inventory updated.' : 'Ingredient added.', 'success');
    setForm(INITIAL); setEditId(null); setShowForm(false); load();
  };

  const handleEdit = item => {
    setForm({ ingredient_name: item.ingredient_name, unit: item.unit, quantity_available: String(item.quantity_available), reorder_level: String(item.reorder_level), supplier_name: item.supplier_name || '', last_restocked: item.last_restocked || '' });
    setEditId(item.id); setShowForm(true); window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async id => {
    const { error } = await supabase.from('inventory').delete().eq('id', id);
    setConfirm(null);
    if (!error) { onToast('Ingredient deleted.', 'success'); load(); }
    else onToast(error.message, 'error');
  };

  const lowStock = items.filter(i => Number(i.quantity_available) <= Number(i.reorder_level));

  return (
    <div className="animate-fade-in">
      {confirm && <ConfirmDialog message={confirm.msg} onConfirm={confirm.fn} onCancel={() => setConfirm(null)} />}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 22, marginBottom: 4 }}>Ingredient Inventory</h1>
          {lowStock.length > 0 && (
            <div style={{ background: 'var(--warning-50)', border: '1px solid var(--warning-500)', borderRadius: 8, padding: '6px 14px', fontSize: 13, color: 'var(--warning-700)', fontWeight: 500 }}>
              {lowStock.length} ingredient{lowStock.length > 1 ? 's' : ''} at or below reorder level — restock required.
            </div>
          )}
        </div>
        <button onClick={() => { setShowForm(p => !p); setEditId(null); setForm(INITIAL); setErrors({}); }} style={{ padding: '10px 20px', borderRadius: 8, border: 'none', background: 'var(--primary-600)', color: '#fff', cursor: 'pointer', fontSize: 14, fontWeight: 600 }}>
          {showForm ? 'Cancel' : '+ Add Ingredient'}
        </button>
      </div>

      {showForm && (
        <div style={{ background: '#fff', borderRadius: 12, padding: 24, boxShadow: 'var(--shadow)', marginBottom: 20, animation: 'fadeIn 0.2s ease-out' }}>
          <h2 style={{ fontSize: 16, marginBottom: 20 }}>{editId ? 'Edit Ingredient' : 'Add Ingredient'}</h2>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 16 }}>
              {[
                { label: 'Ingredient Name', key: 'ingredient_name', placeholder: 'e.g. Urad Dal' },
                { label: 'Supplier', key: 'supplier_name', placeholder: 'e.g. Krishna Traders', opt: true },
              ].map(({ label, key, placeholder, opt }) => (
                <div key={key} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--neutral-700)' }}>{label} {!opt && <span style={{ color: 'var(--error-500)' }}>*</span>}</label>
                  <input value={form[key]} onChange={e => set(key, e.target.value)} placeholder={placeholder}
                    style={{ padding: '9px 12px', borderRadius: 8, fontSize: 14, border: `1px solid ${errors[key] ? 'var(--error-500)' : 'var(--neutral-200)'}`, outline: 'none', color: 'var(--neutral-800)' }} />
                  {errors[key] && <span style={{ fontSize: 12, color: 'var(--error-500)' }}>{errors[key]}</span>}
                </div>
              ))}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--neutral-700)' }}>Unit <span style={{ color: 'var(--error-500)' }}>*</span></label>
                <select value={form.unit} onChange={e => set('unit', e.target.value)} style={{ padding: '9px 12px', borderRadius: 8, fontSize: 14, border: '1px solid var(--neutral-200)', outline: 'none', color: 'var(--neutral-800)', background: '#fff' }}>
                  {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
              {[
                { label: 'Quantity Available', key: 'quantity_available', placeholder: '50' },
                { label: 'Reorder Level', key: 'reorder_level', placeholder: '10' },
              ].map(({ label, key, placeholder }) => (
                <div key={key} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--neutral-700)' }}>{label} <span style={{ color: 'var(--error-500)' }}>*</span></label>
                  <input type="number" min="0" step="0.01" value={form[key]} onChange={e => set(key, e.target.value)} placeholder={placeholder}
                    style={{ padding: '9px 12px', borderRadius: 8, fontSize: 14, border: `1px solid ${errors[key] ? 'var(--error-500)' : 'var(--neutral-200)'}`, outline: 'none', color: 'var(--neutral-800)' }} />
                  {errors[key] && <span style={{ fontSize: 12, color: 'var(--error-500)' }}>{errors[key]}</span>}
                </div>
              ))}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--neutral-700)' }}>Last Restocked</label>
                <input type="date" value={form.last_restocked} onChange={e => set('last_restocked', e.target.value)}
                  style={{ padding: '9px 12px', borderRadius: 8, fontSize: 14, border: '1px solid var(--neutral-200)', outline: 'none', color: 'var(--neutral-800)' }} />
              </div>
            </div>
            {errors._global && <div style={{ color: 'var(--error-600)', fontSize: 13, marginBottom: 12 }}>{errors._global}</div>}
            <button type="submit" disabled={saving} style={{ padding: '10px 24px', borderRadius: 8, border: 'none', background: saving ? 'var(--neutral-300)' : 'var(--primary-600)', color: '#fff', cursor: saving ? 'not-allowed' : 'pointer', fontSize: 14, fontWeight: 600 }}>
              {saving ? 'Saving...' : editId ? 'Update' : 'Add Ingredient'}
            </button>
          </form>
        </div>
      )}

      <div style={{ background: '#fff', borderRadius: 12, boxShadow: 'var(--shadow)', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <thead>
              <tr style={{ background: 'var(--neutral-50)', borderBottom: '1px solid var(--neutral-200)' }}>
                {['Ingredient', 'Unit', 'Available', 'Reorder Level', 'Status', 'Supplier', 'Last Restocked', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: 'var(--neutral-600)', fontSize: 13, whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} style={{ padding: 48, textAlign: 'center' }}><Spinner /></td></tr>
              ) : items.length === 0 ? (
                <tr><td colSpan={8} style={{ padding: 48, textAlign: 'center', color: 'var(--neutral-400)' }}>No ingredients tracked yet.</td></tr>
              ) : items.map(item => {
                const isLow = Number(item.quantity_available) <= Number(item.reorder_level);
                return (
                  <tr key={item.id} style={{ borderBottom: '1px solid var(--neutral-100)' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--neutral-50)'}
                    onMouseLeave={e => e.currentTarget.style.background = '#fff'}>
                    <td style={{ padding: '12px 16px', fontWeight: 500 }}>
                      {isLow && <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: 'var(--warning-500)', marginRight: 6 }} />}
                      {item.ingredient_name}
                    </td>
                    <td style={{ padding: '12px 16px', color: 'var(--neutral-600)' }}>{item.unit}</td>
                    <td style={{ padding: '12px 16px', fontWeight: 500, color: isLow ? 'var(--error-600)' : 'var(--neutral-900)' }}>
                      {item.quantity_available}
                    </td>
                    <td style={{ padding: '12px 16px', color: 'var(--neutral-600)' }}>{item.reorder_level}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ display: 'inline-block', padding: '2px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600, background: isLow ? 'var(--warning-50)' : 'var(--success-50)', color: isLow ? 'var(--warning-700)' : 'var(--success-700)' }}>
                        {isLow ? 'Low Stock' : 'In Stock'}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', color: 'var(--neutral-600)', fontSize: 13 }}>{item.supplier_name || '—'}</td>
                    <td style={{ padding: '12px 16px', color: 'var(--neutral-600)', fontSize: 13 }}>{item.last_restocked || '—'}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={() => handleEdit(item)} style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid var(--primary-200)', background: 'var(--primary-50)', color: 'var(--primary-600)', cursor: 'pointer', fontSize: 12, fontWeight: 500 }}>Edit</button>
                        <button onClick={() => setConfirm({ msg: `Delete "${item.ingredient_name}"?`, fn: () => handleDelete(item.id) })} style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid var(--error-200)', background: 'var(--error-50)', color: 'var(--error-600)', cursor: 'pointer', fontSize: 12, fontWeight: 500 }}>Del</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
