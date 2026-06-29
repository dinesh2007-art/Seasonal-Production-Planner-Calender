import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { calculateCapacityMetrics } from '../lib/capacityEngine';
import StatusBadge from '../components/StatusBadge';
import Spinner from '../components/Spinner';
import ConfirmDialog from '../components/ConfirmDialog';

const PAGE_SIZE = 10;

export default function Dashboard({ onEdit, onDetail, onNew, onToast }) {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [sortCol, setSortCol] = useState('created_at');
  const [sortAsc, setSortAsc] = useState(false);
  const [confirm, setConfirm] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    let q = supabase.from('production_plans').select('*', { count: 'exact' });
    if (status) q = q.eq('status', status);
    if (search) q = q.ilike('festival_name', `%${search}%`);
    q = q.order(sortCol, { ascending: sortAsc })
         .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
    const { data, count, error } = await q;
    setLoading(false);
    if (!error) { setPlans(data || []); setTotal(count || 0); }
  }, [status, search, page, sortCol, sortAsc]);

  useEffect(() => { load(); }, [load]);

  const handleSearch = e => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  const handleSort = col => {
    if (sortCol === col) setSortAsc(p => !p);
    else { setSortCol(col); setSortAsc(true); }
  };

  const handleStatusChange = async (id, newStatus, oldStatus) => {
    const { error } = await supabase.from('production_plans').update({ status: newStatus }).eq('id', id);
    if (!error) {
      await supabase.from('action_history').insert({ plan_id: id, action: `Status changed`, old_status: oldStatus, new_status: newStatus });
      onToast(`Status updated to ${newStatus}.`, 'success');
      load();
    }
  };

  const handleDelete = async id => {
    const { error } = await supabase.from('production_plans').delete().eq('id', id);
    setConfirm(null);
    if (!error) { onToast('Plan deleted.', 'success'); load(); }
    else onToast(error.message, 'error');
  };

  const totalPages = Math.ceil(total / PAGE_SIZE);

  const SortIcon = ({ col }) => (
    <span style={{ marginLeft: 4, opacity: sortCol === col ? 1 : 0.3, fontSize: 11 }}>
      {sortCol === col ? (sortAsc ? '▲' : '▼') : '▼'}
    </span>
  );

  return (
    <div className="animate-fade-in">
      {confirm && <ConfirmDialog message={confirm.msg} onConfirm={confirm.fn} onCancel={() => setConfirm(null)} />}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 22, marginBottom: 4 }}>Production Plans</h1>
          <p style={{ color: 'var(--neutral-500)', fontSize: 14 }}>
            {total} plan{total !== 1 ? 's' : ''} total
          </p>
        </div>
        <button onClick={onNew} style={{
          padding: '10px 20px', borderRadius: 8, border: 'none',
          background: 'var(--primary-600)', color: '#fff', cursor: 'pointer',
          fontSize: 14, fontWeight: 600,
        }}>+ New Plan</button>
      </div>

      {/* Filters */}
      <div style={{ background: '#fff', borderRadius: 12, padding: 16, boxShadow: 'var(--shadow)', marginBottom: 16, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: 8 }}>
          <input
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            placeholder="Search by festival..."
            style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid var(--neutral-200)', fontSize: 14, width: 200, color: 'var(--neutral-800)' }}
          />
          <button type="submit" style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: 'var(--primary-600)', color: '#fff', cursor: 'pointer', fontSize: 14 }}>Search</button>
          {search && <button type="button" onClick={() => { setSearch(''); setSearchInput(''); setPage(1); }} style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid var(--neutral-200)', background: '#fff', cursor: 'pointer', fontSize: 14 }}>Clear</button>}
        </form>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {['', 'planned', 'active', 'completed', 'archived'].map(s => (
            <button key={s || 'all'} onClick={() => { setStatus(s); setPage(1); }} style={{
              padding: '6px 14px', borderRadius: 20, border: '1px solid',
              borderColor: status === s ? 'var(--primary-600)' : 'var(--neutral-200)',
              background: status === s ? 'var(--primary-50)' : '#fff',
              color: status === s ? 'var(--primary-700)' : 'var(--neutral-600)',
              cursor: 'pointer', fontSize: 13, fontWeight: status === s ? 600 : 400,
            }}>
              {s ? s.charAt(0).toUpperCase() + s.slice(1) : 'All'}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div style={{ background: '#fff', borderRadius: 12, boxShadow: 'var(--shadow)', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <thead>
              <tr style={{ background: 'var(--neutral-50)', borderBottom: '1px solid var(--neutral-200)' }}>
                {[
                  { col: 'festival_name', label: 'Festival' },
                  { col: 'product_name', label: 'Product' },
                  { col: 'expected_orders', label: 'Orders' },
                  { col: null, label: 'Utilisation' },
                  { col: 'procurement_deadline', label: 'Procurement' },
                  { col: 'production_start_date', label: 'Start' },
                  { col: 'status', label: 'Status' },
                  { col: null, label: 'Actions' },
                ].map(({ col, label }) => (
                  <th key={label} onClick={col ? () => handleSort(col) : undefined}
                    style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: 'var(--neutral-600)', cursor: col ? 'pointer' : 'default', whiteSpace: 'nowrap', userSelect: 'none' }}>
                    {label}{col && <SortIcon col={col} />}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} style={{ padding: 48, textAlign: 'center' }}><Spinner /></td></tr>
              ) : plans.length === 0 ? (
                <tr><td colSpan={8} style={{ padding: 48, textAlign: 'center', color: 'var(--neutral-400)' }}>
                  No production plans found.{' '}
                  <button onClick={onNew} style={{ color: 'var(--primary-600)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 14 }}>Create one?</button>
                </td></tr>
              ) : plans.map(plan => {
                const m = calculateCapacityMetrics(plan);
                return (
                  <tr key={plan.id} style={{ borderBottom: '1px solid var(--neutral-100)', transition: 'background 0.1s' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--neutral-50)'}
                    onMouseLeave={e => e.currentTarget.style.background = '#fff'}
                  >
                    <td style={{ padding: '12px 16px', fontWeight: 500 }}>
                      {m.alertLevel !== 'none' && (
                        <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: m.alertLevel === 'critical' ? 'var(--error-500)' : 'var(--warning-500)', marginRight: 6 }} />
                      )}
                      {plan.festival_name}
                    </td>
                    <td style={{ padding: '12px 16px', color: 'var(--neutral-600)' }}>{plan.product_name}</td>
                    <td style={{ padding: '12px 16px' }}>{plan.expected_orders.toLocaleString()}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ flex: 1, height: 6, background: 'var(--neutral-100)', borderRadius: 3, minWidth: 60 }}>
                          <div style={{
                            width: `${Math.min(100, m.utilisationRate)}%`, height: '100%', borderRadius: 3,
                            background: m.utilisationRate > 95 ? 'var(--error-500)' : m.utilisationRate > 80 ? 'var(--warning-500)' : 'var(--success-500)',
                          }} />
                        </div>
                        <span style={{ fontSize: 12, color: 'var(--neutral-600)', whiteSpace: 'nowrap' }}>{m.utilisationRate}%</span>
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: 13, color: m.daysUntilProcurement < 0 ? 'var(--error-600)' : m.daysUntilProcurement <= 3 ? 'var(--warning-600)' : 'var(--neutral-600)' }}>
                      {plan.procurement_deadline}
                      <div style={{ fontSize: 11, color: 'var(--neutral-400)' }}>
                        {m.daysUntilProcurement < 0 ? `${Math.abs(m.daysUntilProcurement)}d overdue` : `${m.daysUntilProcurement}d left`}
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: 13, color: 'var(--neutral-600)' }}>{plan.production_start_date}</td>
                    <td style={{ padding: '12px 16px' }}><StatusBadge status={plan.status} /></td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button onClick={() => onDetail(plan)} style={actionBtn('var(--neutral-600)')}>View</button>
                        <button onClick={() => onEdit(plan)} style={actionBtn('var(--primary-600)')}>Edit</button>
                        <select
                          value={plan.status}
                          onChange={e => handleStatusChange(plan.id, e.target.value, plan.status)}
                          style={{ padding: '4px 6px', borderRadius: 6, border: '1px solid var(--neutral-200)', fontSize: 12, cursor: 'pointer', color: 'var(--neutral-700)', background: '#fff' }}
                        >
                          <option value="planned">Planned</option>
                          <option value="active">Active</option>
                          <option value="completed">Completed</option>
                          <option value="archived">Archived</option>
                        </select>
                        <button onClick={() => setConfirm({ msg: `Delete plan for "${plan.festival_name} - ${plan.product_name}"? This cannot be undone.`, fn: () => handleDelete(plan.id) })} style={actionBtn('var(--error-600)')}>Del</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ padding: '12px 16px', borderTop: '1px solid var(--neutral-100)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 13, color: 'var(--neutral-500)' }}>
              Page {page} of {totalPages} ({total} records)
            </span>
            <div style={{ display: 'flex', gap: 8 }}>
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)} style={pageBtn(page === 1)}>Previous</button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const p = Math.max(1, Math.min(totalPages - 4, page - 2)) + i;
                return (
                  <button key={p} onClick={() => setPage(p)} style={{ ...pageBtn(false), background: page === p ? 'var(--primary-600)' : '#fff', color: page === p ? '#fff' : 'var(--neutral-700)' }}>
                    {p}
                  </button>
                );
              })}
              <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)} style={pageBtn(page === totalPages)}>Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const actionBtn = color => ({
  padding: '4px 10px', borderRadius: 6, border: `1px solid ${color}20`,
  background: `${color}10`, color, cursor: 'pointer', fontSize: 12, fontWeight: 500,
  whiteSpace: 'nowrap',
});

const pageBtn = disabled => ({
  padding: '6px 12px', borderRadius: 6, border: '1px solid var(--neutral-200)',
  background: '#fff', cursor: disabled ? 'not-allowed' : 'pointer',
  fontSize: 13, color: disabled ? 'var(--neutral-300)' : 'var(--neutral-700)',
});
