import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import StatusBadge from '../components/StatusBadge';
import Spinner from '../components/Spinner';
import ConfirmDialog from '../components/ConfirmDialog';

const INITIAL = {
  customer_name: '',
  product_name: '',
  quantity: '',
  order_date: new Date().toISOString().split('T')[0],
  status: 'pending',
  plan_id: '',
  notes: '',
};

function validate(f) {
  const e = {};
  if (!f.customer_name.trim()) e.customer_name = 'Customer name is required.';
  if (!f.product_name.trim()) e.product_name = 'Product name is required.';
  if (!f.quantity || Number(f.quantity) <= 0) e.quantity = 'Quantity must be a positive number.';
  if (!f.order_date) e.order_date = 'Order date is required.';
  return e;
}

export default function Orders({ onToast }) {
  const [orders, setOrders] = useState([]);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(INITIAL);
  const [editId, setEditId] = useState(null);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [confirm, setConfirm] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    let q = supabase.from('orders').select('*, production_plans(festival_name, product_name)').order('created_at', { ascending: false });
    if (statusFilter) q = q.eq('status', statusFilter);
    const { data } = await q;
    setOrders(data || []);
    setLoading(false);
  }, [statusFilter]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    supabase.from('production_plans').select('id, festival_name, product_name').eq('status', 'active').then(({ data }) => setPlans(data || []));
  }, []);

  const set = (k, v) => {
    setForm(p => ({ ...p, [k]: v }));
    setErrors(p => ({ ...p, [k]: undefined }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    const errs = validate(form);
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setSaving(true);
    const payload = { ...form, quantity: Number(form.quantity), plan_id: form.plan_id || null };
    const { error } = editId
      ? await supabase.from('orders').update(payload).eq('id', editId)
      : await supabase.from('orders').insert(payload);
    setSaving(false);
    if (error) { setErrors({ _global: error.message }); return; }
    onToast(editId ? 'Order updated.' : 'Order created.', 'success');
    setForm(INITIAL); setEditId(null); setShowForm(false); load();
  };

  const handleEdit = o => {
    setForm({ customer_name: o.customer_name, product_name: o.product_name, quantity: String(o.quantity), order_date: o.order_date, status: o.status, plan_id: o.plan_id || '', notes: o.notes || '' });
    setEditId(o.id); setShowForm(true); window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async id => {
    const { error } = await supabase.from('orders').delete().eq('id', id);
    setConfirm(null);
    if (!error) { onToast('Order deleted.', 'success'); load(); }
    else onToast(error.message, 'error');
  };

  const inp = (label, key, type = 'text', opts = {}) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--neutral-700)' }}>{label} {!opts.opt && <span style={{ color: 'var(--error-500)' }}>*</span>}</label>
      <input type={type} value={form[key]} onChange={e => set(key, e.target.value)} placeholder={opts.placeholder} min={opts.min}
        style={{ padding: '9px 12px', borderRadius: 8, fontSize: 14, border: `1px solid ${errors[key] ? 'var(--error-500)' : 'var(--neutral-200)'}`, outline: 'none', width: '100%', color: 'var(--neutral-800)' }} />
      {errors[key] && <span style={{ fontSize: 12, color: 'var(--error-500)' }}>{errors[key]}</span>}
    </div>
  );

  return (
    <div className="animate-fade-in">
      {confirm && <ConfirmDialog message={confirm.msg} onConfirm={confirm.fn} onCancel={() => setConfirm(null)} />}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <h1 style={{ fontSize: 22 }}>Orders</h1>
        <button onClick={() => { setShowForm(p => !p); setEditId(null); setForm(INITIAL); setErrors({}); }} style={{ padding: '10px 20px', borderRadius: 8, border: 'none', background: 'var(--primary-600)', color: '#fff', cursor: 'pointer', fontSize: 14, fontWeight: 600 }}>
          {showForm ? 'Cancel' : '+ New Order'}
        </button>
      </div>

      {showForm && (
        <div style={{ background: '#fff', borderRadius: 12, padding: 24, boxShadow: 'var(--shadow)', marginBottom: 20, animation: 'fadeIn 0.2s ease-out' }}>
          <h2 style={{ fontSize: 16, marginBottom: 20 }}>{editId ? 'Edit Order' : 'New Order'}</h2>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 16 }}>
              {inp('Customer Name', 'customer_name', 'text', { placeholder: 'e.g. Priya Rajan' })}
              {inp('Product Name', 'product_name', 'text', { placeholder: 'e.g. Podi Mix' })}
              {inp('Quantity', 'quantity', 'number', { placeholder: 'e.g. 5', min: '1' })}
              {inp('Order Date', 'order_date', 'date')}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--neutral-700)' }}>Link to Plan <span style={{ color: 'var(--neutral-400)', fontWeight: 400 }}>(optional)</span></label>
                <select value={form.plan_id} onChange={e => set('plan_id', e.target.value)} style={{ padding: '9px 12px', borderRadius: 8, fontSize: 14, border: '1px solid var(--neutral-200)', outline: 'none', width: '100%', color: 'var(--neutral-800)', background: '#fff' }}>
                  <option value="">No plan linked</option>
                  {plans.map(p => <option key={p.id} value={p.id}>{p.festival_name} — {p.product_name}</option>)}
                </select>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--neutral-700)' }}>Status <span style={{ color: 'var(--error-500)' }}>*</span></label>
                <select value={form.status} onChange={e => set('status', e.target.value)} style={{ padding: '9px 12px', borderRadius: 8, fontSize: 14, border: '1px solid var(--neutral-200)', outline: 'none', width: '100%', color: 'var(--neutral-800)', background: '#fff' }}>
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>
            {errors._global && <div style={{ color: 'var(--error-600)', fontSize: 13, marginBottom: 12 }}>{errors._global}</div>}
            <button type="submit" disabled={saving} style={{ padding: '10px 24px', borderRadius: 8, border: 'none', background: saving ? 'var(--neutral-300)' : 'var(--primary-600)', color: '#fff', cursor: saving ? 'not-allowed' : 'pointer', fontSize: 14, fontWeight: 600 }}>
              {saving ? 'Saving...' : editId ? 'Update Order' : 'Create Order'}
            </button>
          </form>
        </div>
      )}

      {/* Filter */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        {['', 'pending', 'confirmed', 'delivered', 'cancelled'].map(s => (
          <button key={s || 'all'} onClick={() => setStatusFilter(s)} style={{ padding: '6px 14px', borderRadius: 20, border: '1px solid', borderColor: statusFilter === s ? 'var(--primary-600)' : 'var(--neutral-200)', background: statusFilter === s ? 'var(--primary-50)' : '#fff', color: statusFilter === s ? 'var(--primary-700)' : 'var(--neutral-600)', cursor: 'pointer', fontSize: 13, fontWeight: statusFilter === s ? 600 : 400 }}>
            {s ? s.charAt(0).toUpperCase() + s.slice(1) : 'All'}
          </button>
        ))}
      </div>

      <div style={{ background: '#fff', borderRadius: 12, boxShadow: 'var(--shadow)', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <thead>
              <tr style={{ background: 'var(--neutral-50)', borderBottom: '1px solid var(--neutral-200)' }}>
                {['Customer', 'Product', 'Qty', 'Date', 'Plan', 'Status', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: 'var(--neutral-600)', fontSize: 13 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} style={{ padding: 48, textAlign: 'center' }}><Spinner /></td></tr>
              ) : orders.length === 0 ? (
                <tr><td colSpan={7} style={{ padding: 48, textAlign: 'center', color: 'var(--neutral-400)' }}>No orders yet.</td></tr>
              ) : orders.map(o => (
                <tr key={o.id} style={{ borderBottom: '1px solid var(--neutral-100)' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--neutral-50)'}
                  onMouseLeave={e => e.currentTarget.style.background = '#fff'}>
                  <td style={{ padding: '12px 16px', fontWeight: 500 }}>{o.customer_name}</td>
                  <td style={{ padding: '12px 16px', color: 'var(--neutral-600)' }}>{o.product_name}</td>
                  <td style={{ padding: '12px 16px' }}>{o.quantity}</td>
                  <td style={{ padding: '12px 16px', color: 'var(--neutral-600)', fontSize: 13 }}>{o.order_date}</td>
                  <td style={{ padding: '12px 16px', fontSize: 13, color: 'var(--neutral-500)' }}>
                    {o.production_plans ? `${o.production_plans.festival_name}` : '—'}
                  </td>
                  <td style={{ padding: '12px 16px' }}><StatusBadge status={o.status} /></td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={() => handleEdit(o)} style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid var(--primary-200)', background: 'var(--primary-50)', color: 'var(--primary-600)', cursor: 'pointer', fontSize: 12, fontWeight: 500 }}>Edit</button>
                      <button onClick={() => setConfirm({ msg: `Delete order for "${o.customer_name}"?`, fn: () => handleDelete(o.id) })} style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid var(--error-200)', background: 'var(--error-50)', color: 'var(--error-600)', cursor: 'pointer', fontSize: 12, fontWeight: 500 }}>Del</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
