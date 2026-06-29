import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import Spinner from '../components/Spinner';

export default function AdminConfig({ onToast }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [allPlans, setAllPlans] = useState([]);
  const [plansLoading, setPlansLoading] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [updatingCreds, setUpdatingCreds] = useState(false);

  useEffect(() => {
    (async () => {
      const [{ data: plans }, { data: orders }, { data: inventory }, { data: history }] = await Promise.all([
        supabase.from('production_plans').select('id, status', { count: 'exact' }),
        supabase.from('orders').select('id, status', { count: 'exact' }),
        supabase.from('inventory').select('id, quantity_available, reorder_level'),
        supabase.from('action_history').select('id', { count: 'exact' }),
      ]);
      const statusCounts = {};
      (plans || []).forEach(p => { statusCounts[p.status] = (statusCounts[p.status] || 0) + 1; });
      const orderStatusCounts = {};
      (orders || []).forEach(o => { orderStatusCounts[o.status] = (orderStatusCounts[o.status] || 0) + 1; });
      const lowStock = (inventory || []).filter(i => Number(i.quantity_available) <= Number(i.reorder_level));
      setStats({ totalPlans: (plans || []).length, totalOrders: (orders || []).length, totalInventory: (inventory || []).length, totalHistory: (history || []).length, statusCounts, orderStatusCounts, lowStockCount: lowStock.length });
      setLoading(false);
    })();
    (async () => {
      const { data } = await supabase.from('production_plans').select('*').order('created_at', { ascending: false });
      setAllPlans(data || []);
      setPlansLoading(false);
    })();
    (async () => {
      const { data } = await supabase.auth.getCredentials();
      if (data?.username) {
        setUsername(data.username);
      }
    })();
  }, []);

  const handleUpdateCredentials = async (e) => {
    e.preventDefault();
    if (!username.trim()) {
      onToast('Username is required.', 'error');
      return;
    }
    if (!password) {
      onToast('Password is required.', 'error');
      return;
    }
    if (password !== confirmPassword) {
      onToast('Passwords do not match.', 'error');
      return;
    }

    setUpdatingCreds(true);
    const { error } = await supabase.auth.updateCredentials(username, password);
    setUpdatingCreds(false);

    if (error) {
      onToast(error, 'error');
    } else {
      onToast('Credentials updated successfully.', 'success');
      setPassword('');
      setConfirmPassword('');
    }
  };

  const handleBulkArchive = async () => {
    const { error } = await supabase.from('production_plans').update({ status: 'archived' }).eq('status', 'completed');
    if (!error) {
      onToast('Completed plans archived.', 'success');
      setAllPlans(p => p.map(pl => pl.status === 'completed' ? { ...pl, status: 'archived' } : pl));
      setStats(s => ({ ...s, statusCounts: { ...s.statusCounts, completed: 0, archived: (s.statusCounts.archived || 0) + (s.statusCounts.completed || 0) } }));
    } else onToast(error.message, 'error');
  };

  const handleDeleteAll = async () => {
    if (!window.confirm('Delete ALL archived plans permanently? This cannot be undone.')) return;
    const { error } = await supabase.from('production_plans').delete().eq('status', 'archived');
    if (!error) {
      onToast('Archived plans deleted.', 'success');
      setAllPlans(p => p.filter(pl => pl.status !== 'archived'));
      setStats(s => ({ ...s, statusCounts: { ...s.statusCounts, archived: 0 }, totalPlans: s.totalPlans - (s.statusCounts.archived || 0) }));
    } else onToast(error.message, 'error');
  };

  const handleExportAll = async () => {
    const { data } = await supabase.from('production_plans').select('*').order('created_at', { ascending: false });
    if (!data?.length) { onToast('No data to export.', 'warning'); return; }
    const headers = Object.keys(data[0]);
    const rows = [headers.join(','), ...data.map(r => headers.map(h => `"${r[h] ?? ''}"`).join(','))].join('\n');
    const blob = new Blob([rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sharadha_stores_all_plans_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    onToast('Export downloaded.', 'success');
  };

  const StatBox = ({ label, value, color }) => (
    <div style={{ background: '#fff', borderRadius: 10, padding: 20, boxShadow: 'var(--shadow-sm)', border: '1px solid var(--neutral-100)', textAlign: 'center' }}>
      <div style={{ fontSize: 32, fontWeight: 700, color: color || 'var(--neutral-900)', marginBottom: 4 }}>{value}</div>
      <div style={{ fontSize: 13, color: 'var(--neutral-500)' }}>{label}</div>
    </div>
  );

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, marginBottom: 4 }}>Admin Configuration</h1>
        <p style={{ color: 'var(--neutral-500)', fontSize: 14 }}>System overview, bulk operations, and data management for Sharadha Stores.</p>
      </div>

      {loading ? <div style={{ padding: 48, textAlign: 'center' }}><Spinner /></div> : (
        <>
          {/* System Stats */}
          <div style={{ background: '#fff', borderRadius: 12, padding: 24, boxShadow: 'var(--shadow)', marginBottom: 20 }}>
            <h2 style={{ fontSize: 15, marginBottom: 20, color: 'var(--neutral-700)' }}>System Overview</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 }}>
              <StatBox label="Total Plans" value={stats.totalPlans} color="var(--primary-600)" />
              <StatBox label="Total Orders" value={stats.totalOrders} color="var(--success-600)" />
              <StatBox label="Ingredients" value={stats.totalInventory} color="var(--accent-600)" />
              <StatBox label="Action Logs" value={stats.totalHistory} color="var(--neutral-500)" />
              {stats.lowStockCount > 0 && <StatBox label="Low Stock Items" value={stats.lowStockCount} color="var(--warning-600)" />}
            </div>
          </div>

          {/* Plan Status Breakdown */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16, marginBottom: 20 }}>
            <div style={{ background: '#fff', borderRadius: 12, padding: 24, boxShadow: 'var(--shadow)' }}>
              <h2 style={{ fontSize: 15, marginBottom: 16, color: 'var(--neutral-700)' }}>Plans by Status</h2>
              {Object.entries(stats.statusCounts).map(([s, c]) => (
                <div key={s} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--neutral-100)' }}>
                  <span style={{ fontSize: 14, textTransform: 'capitalize', color: 'var(--neutral-700)' }}>{s}</span>
                  <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--neutral-900)' }}>{c}</span>
                </div>
              ))}
            </div>
            <div style={{ background: '#fff', borderRadius: 12, padding: 24, boxShadow: 'var(--shadow)' }}>
              <h2 style={{ fontSize: 15, marginBottom: 16, color: 'var(--neutral-700)' }}>Orders by Status</h2>
              {Object.entries(stats.orderStatusCounts).length === 0 ? (
                <p style={{ color: 'var(--neutral-400)', fontSize: 14 }}>No orders yet.</p>
              ) : Object.entries(stats.orderStatusCounts).map(([s, c]) => (
                <div key={s} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--neutral-100)' }}>
                  <span style={{ fontSize: 14, textTransform: 'capitalize', color: 'var(--neutral-700)' }}>{s}</span>
                  <span style={{ fontSize: 14, fontWeight: 600 }}>{c}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Bulk Operations */}
          <div style={{ background: '#fff', borderRadius: 12, padding: 24, boxShadow: 'var(--shadow)', marginBottom: 20 }}>
            <h2 style={{ fontSize: 15, marginBottom: 8, color: 'var(--neutral-700)' }}>Bulk Operations</h2>
            <p style={{ fontSize: 13, color: 'var(--neutral-400)', marginBottom: 20 }}>Use with caution — some operations cannot be reversed.</p>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <button onClick={handleBulkArchive} style={{ padding: '10px 20px', borderRadius: 8, border: '1px solid var(--neutral-200)', background: '#fff', cursor: 'pointer', fontSize: 14, fontWeight: 500, color: 'var(--neutral-700)' }}>
                Archive All Completed Plans
              </button>
              <button onClick={handleExportAll} style={{ padding: '10px 20px', borderRadius: 8, border: '1px solid var(--success-500)', background: 'var(--success-50)', cursor: 'pointer', fontSize: 14, fontWeight: 500, color: 'var(--success-700)' }}>
                Export All Plans (CSV)
              </button>
              <button onClick={handleDeleteAll} style={{ padding: '10px 20px', borderRadius: 8, border: '1px solid var(--error-500)', background: 'var(--error-50)', cursor: 'pointer', fontSize: 14, fontWeight: 500, color: 'var(--error-700)' }}>
                Delete All Archived Plans
              </button>
            </div>
          </div>

          {/* Admin Credentials */}
          <div style={{ background: '#fff', borderRadius: 12, padding: 24, boxShadow: 'var(--shadow)', marginBottom: 20 }}>
            <h2 style={{ fontSize: 15, marginBottom: 8, color: 'var(--neutral-700)' }}>Modify Admin Credentials</h2>
            <p style={{ fontSize: 13, color: 'var(--neutral-400)', marginBottom: 20 }}>Update username and password used to access the administrator portal.</p>
            <form onSubmit={handleUpdateCredentials} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, alignItems: 'end' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--neutral-700)' }}>Username</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin"
                  style={{ padding: '9px 12px', borderRadius: 8, fontSize: 14, border: '1px solid var(--neutral-200)', outline: 'none', color: 'var(--neutral-800)', background: '#fff' }}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--neutral-700)' }}>New Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  style={{ padding: '9px 12px', borderRadius: 8, fontSize: 14, border: '1px solid var(--neutral-200)', outline: 'none', color: 'var(--neutral-800)', background: '#fff' }}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--neutral-700)' }}>Confirm Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  style={{ padding: '9px 12px', borderRadius: 8, fontSize: 14, border: '1px solid var(--neutral-200)', outline: 'none', color: 'var(--neutral-800)', background: '#fff' }}
                />
              </div>
              <button
                type="submit"
                disabled={updatingCreds}
                style={{
                  padding: '10px 20px',
                  borderRadius: 8,
                  border: 'none',
                  background: updatingCreds ? 'var(--neutral-300)' : 'var(--primary-600)',
                  color: '#fff',
                  cursor: updatingCreds ? 'not-allowed' : 'pointer',
                  fontSize: 14,
                  fontWeight: 600,
                  height: 40,
                }}
              >
                {updatingCreds ? 'Updating...' : 'Update Credentials'}
              </button>
            </form>
          </div>

          {/* All Plans Record */}
          <div style={{ background: '#fff', borderRadius: 12, padding: 24, boxShadow: 'var(--shadow)' }}>
            <h2 style={{ fontSize: 15, marginBottom: 16, color: 'var(--neutral-700)' }}>All Records</h2>
            {plansLoading ? <Spinner /> : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--neutral-200)' }}>
                      {['ID', 'Festival', 'Product', 'Expected Orders', 'Capacity/day', 'Procurement', 'Status', 'Created'].map(h => (
                        <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600, color: 'var(--neutral-600)', fontSize: 12, whiteSpace: 'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {allPlans.length === 0 ? (
                      <tr><td colSpan={8} style={{ padding: 32, textAlign: 'center', color: 'var(--neutral-400)' }}>No plans yet.</td></tr>
                    ) : allPlans.map(p => (
                      <tr key={p.id} style={{ borderBottom: '1px solid var(--neutral-100)' }}>
                        <td style={{ padding: '8px 12px', color: 'var(--neutral-400)', fontSize: 11 }}>{p.id.slice(0, 8)}…</td>
                        <td style={{ padding: '8px 12px', fontWeight: 500 }}>{p.festival_name}</td>
                        <td style={{ padding: '8px 12px', color: 'var(--neutral-600)' }}>{p.product_name}</td>
                        <td style={{ padding: '8px 12px' }}>{p.expected_orders}</td>
                        <td style={{ padding: '8px 12px', color: 'var(--neutral-600)' }}>{p.production_capacity}</td>
                        <td style={{ padding: '8px 12px', color: 'var(--neutral-600)' }}>{p.procurement_deadline}</td>
                        <td style={{ padding: '8px 12px' }}>
                          <span style={{ textTransform: 'capitalize', fontSize: 12, fontWeight: 500, color: p.status === 'active' ? 'var(--success-700)' : p.status === 'archived' ? 'var(--neutral-400)' : 'var(--neutral-700)' }}>{p.status}</span>
                        </td>
                        <td style={{ padding: '8px 12px', color: 'var(--neutral-400)', fontSize: 12 }}>{new Date(p.created_at).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
