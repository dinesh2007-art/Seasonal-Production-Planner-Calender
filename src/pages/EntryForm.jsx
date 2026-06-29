import { useState } from 'react';
import { supabase } from '../lib/supabase';
import Spinner from '../components/Spinner';

const FESTIVALS = ['Diwali', 'Pongal', 'Navratri', 'Dussehra', 'Onam', 'Ugadi', 'Holi', 'Ganesh Chaturthi', 'Karthigai Deepam', 'Other'];
const PRODUCTS = ['Podi Mix', 'Mango Pickle', 'Lemon Pickle', 'Appalam', 'Ghee', 'Murukku', 'Chakli', 'Rice Flour Snacks', 'Sesame Ladoo', 'Other'];

const INITIAL = {
  festival_name: '',
  product_name: '',
  batch_size: '',
  expected_orders: '',
  production_capacity: '',
  procurement_deadline: '',
  production_start_date: '',
  production_end_date: '',
  notes: '',
  status: 'planned',
};

function validate(f) {
  const e = {};
  if (!f.festival_name) e.festival_name = 'Festival name is required.';
  if (!f.product_name) e.product_name = 'Product name is required.';
  if (!f.batch_size || Number(f.batch_size) <= 0) e.batch_size = 'Batch size must be a positive number.';
  if (f.expected_orders === '' || Number(f.expected_orders) < 0) e.expected_orders = 'Expected orders must be 0 or more.';
  if (!f.production_capacity || Number(f.production_capacity) <= 0) e.production_capacity = 'Daily capacity must be a positive number.';
  if (!f.procurement_deadline) e.procurement_deadline = 'Procurement deadline is required.';
  if (!f.production_start_date) e.production_start_date = 'Production start date is required.';
  if (!f.production_end_date) e.production_end_date = 'Production end date is required.';
  if (f.production_start_date && f.production_end_date && f.production_end_date < f.production_start_date)
    e.production_end_date = 'End date must be after start date.';
  if (f.procurement_deadline && f.production_start_date && f.procurement_deadline > f.production_start_date)
    e.procurement_deadline = 'Procurement should be before production start.';
  return e;
}

export default function EntryForm({ editData, onSuccess, onCancel }) {
  const [form, setForm] = useState(editData ? {
    festival_name: editData.festival_name,
    product_name: editData.product_name,
    batch_size: String(editData.batch_size),
    expected_orders: String(editData.expected_orders),
    production_capacity: String(editData.production_capacity),
    procurement_deadline: editData.procurement_deadline,
    production_start_date: editData.production_start_date,
    production_end_date: editData.production_end_date,
    notes: editData.notes || '',
    status: editData.status,
  } : INITIAL);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const set = (k, v) => {
    setForm(p => ({ ...p, [k]: v }));
    setErrors(p => ({ ...p, [k]: undefined }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    const errs = validate(form);
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    setSaving(true);
    const payload = {
      ...form,
      batch_size: Number(form.batch_size),
      expected_orders: Number(form.expected_orders),
      production_capacity: Number(form.production_capacity),
    };

    let error;
    if (editData) {
      ({ error } = await supabase.from('production_plans').update(payload).eq('id', editData.id));
      if (!error) {
        await supabase.from('action_history').insert({
          plan_id: editData.id,
          action: 'Updated plan details',
          old_status: editData.status,
          new_status: payload.status,
        });
      }
    } else {
      ({ error } = await supabase.from('production_plans').insert(payload));
    }

    setSaving(false);
    if (error) { setErrors({ _global: error.message }); return; }
    onSuccess(editData ? 'Plan updated successfully.' : 'Production plan created successfully.');
  };

  const field = (label, key, type = 'text', opts = {}) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--neutral-700)' }}>{label} {opts.required !== false && <span style={{ color: 'var(--error-500)' }}>*</span>}</label>
      {opts.options ? (
        <select value={form[key]} onChange={e => set(key, e.target.value)} style={inputStyle(errors[key])}>
          <option value="">Select {label}</option>
          {opts.options.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      ) : (
        <input
          type={type}
          value={form[key]}
          onChange={e => set(key, e.target.value)}
          placeholder={opts.placeholder}
          min={opts.min}
          style={inputStyle(errors[key])}
        />
      )}
      {errors[key] && <span style={{ fontSize: 12, color: 'var(--error-500)' }}>{errors[key]}</span>}
    </div>
  );

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 22, marginBottom: 4 }}>{editData ? 'Edit Production Plan' : 'New Production Plan'}</h1>
          <p style={{ color: 'var(--neutral-500)', fontSize: 14 }}>Map festival demand to production capacity and ingredient timelines.</p>
        </div>
        {onCancel && (
          <button onClick={onCancel} style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid var(--neutral-200)', background: '#fff', cursor: 'pointer', fontSize: 14 }}>
            Cancel
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit}>
        <div style={{ background: '#fff', borderRadius: 12, padding: 24, boxShadow: 'var(--shadow)', marginBottom: 16 }}>
          <h2 style={{ fontSize: 15, marginBottom: 20, color: 'var(--neutral-700)', borderBottom: '1px solid var(--neutral-100)', paddingBottom: 12 }}>Festival & Product</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
            {field('Festival Name', 'festival_name', 'text', { options: FESTIVALS })}
            {field('Product Name', 'product_name', 'text', { options: PRODUCTS })}
          </div>
        </div>

        <div style={{ background: '#fff', borderRadius: 12, padding: 24, boxShadow: 'var(--shadow)', marginBottom: 16 }}>
          <h2 style={{ fontSize: 15, marginBottom: 20, color: 'var(--neutral-700)', borderBottom: '1px solid var(--neutral-100)', paddingBottom: 12 }}>Production Details</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
            {field('Batch Size (units/batch)', 'batch_size', 'number', { placeholder: 'e.g. 50', min: '1' })}
            {field('Expected Orders (units)', 'expected_orders', 'number', { placeholder: 'e.g. 200', min: '0' })}
            {field('Daily Production Capacity (units/day)', 'production_capacity', 'number', { placeholder: 'e.g. 100', min: '1' })}
          </div>
        </div>

        <div style={{ background: '#fff', borderRadius: 12, padding: 24, boxShadow: 'var(--shadow)', marginBottom: 16 }}>
          <h2 style={{ fontSize: 15, marginBottom: 20, color: 'var(--neutral-700)', borderBottom: '1px solid var(--neutral-100)', paddingBottom: 12 }}>Timeline</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
            {field('Procurement Deadline', 'procurement_deadline', 'date')}
            {field('Production Start Date', 'production_start_date', 'date')}
            {field('Production End Date', 'production_end_date', 'date')}
          </div>
        </div>

        <div style={{ background: '#fff', borderRadius: 12, padding: 24, boxShadow: 'var(--shadow)', marginBottom: 16 }}>
          <h2 style={{ fontSize: 15, marginBottom: 20, color: 'var(--neutral-700)', borderBottom: '1px solid var(--neutral-100)', paddingBottom: 12 }}>Status & Notes</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--neutral-700)' }}>Status <span style={{ color: 'var(--error-500)' }}>*</span></label>
              <select value={form.status} onChange={e => set('status', e.target.value)} style={inputStyle()}>
                <option value="planned">Planned</option>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
                <option value="archived">Archived</option>
              </select>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, gridColumn: '1 / -1' }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--neutral-700)' }}>Notes <span style={{ color: 'var(--neutral-400)', fontWeight: 400 }}>(optional)</span></label>
              <textarea value={form.notes} onChange={e => set('notes', e.target.value)}
                rows={3} placeholder="Any additional notes..."
                style={{ ...inputStyle(), resize: 'vertical', minHeight: 72 }} />
            </div>
          </div>
        </div>

        {errors._global && (
          <div style={{ background: 'var(--error-50)', border: '1px solid var(--error-500)', borderRadius: 8, padding: '12px 16px', marginBottom: 16, color: 'var(--error-600)', fontSize: 14 }}>
            {errors._global}
          </div>
        )}

        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
          {onCancel && (
            <button type="button" onClick={onCancel} style={{ padding: '10px 24px', borderRadius: 8, border: '1px solid var(--neutral-200)', background: '#fff', cursor: 'pointer', fontSize: 14, fontWeight: 500, color: 'var(--neutral-700)' }}>
              Cancel
            </button>
          )}
          <button type="submit" disabled={saving} style={{
            padding: '10px 28px', borderRadius: 8, border: 'none',
            background: saving ? 'var(--neutral-300)' : 'var(--primary-600)',
            color: '#fff', cursor: saving ? 'not-allowed' : 'pointer',
            fontSize: 14, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8,
          }}>
            {saving && <Spinner size={16} color="#fff" />}
            {saving ? 'Saving...' : editData ? 'Update Plan' : 'Create Plan'}
          </button>
        </div>
      </form>
    </div>
  );
}

function inputStyle(error) {
  return {
    padding: '9px 12px', borderRadius: 8, fontSize: 14,
    border: `1px solid ${error ? 'var(--error-500)' : 'var(--neutral-200)'}`,
    outline: 'none', width: '100%', background: '#fff',
    transition: 'border-color 0.15s',
    color: 'var(--neutral-800)',
  };
}
