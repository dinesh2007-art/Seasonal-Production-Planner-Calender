import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { calculateCapacityMetrics } from '../lib/capacityEngine';
import StatusBadge from '../components/StatusBadge';
import Spinner from '../components/Spinner';

export default function Home({ onNavigate, onDetail }) {
  const [summary, setSummary] = useState(null);
  const [recentPlans, setRecentPlans] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [{ data: plans }, { data: orders }, { data: inventory }] = await Promise.all([
        supabase.from('production_plans').select('*').order('created_at', { ascending: false }),
        supabase.from('orders').select('id, status'),
        supabase.from('inventory').select('quantity_available, reorder_level'),
      ]);

      const p = plans || [];
      const o = orders || [];
      const inv = inventory || [];

      const statusCounts = { planned: 0, active: 0, completed: 0, archived: 0 };
      p.forEach(pl => { statusCounts[pl.status] = (statusCounts[pl.status] || 0) + 1; });
      const lowStock = inv.filter(i => Number(i.quantity_available) <= Number(i.reorder_level));
      const pendingOrders = o.filter(x => x.status === 'pending').length;

      const planAlerts = p.flatMap(pl => {
        const m = calculateCapacityMetrics(pl);
        if (m.alertLevel !== 'none') return [{ plan: pl, metrics: m }];
        return [];
      });

      setSummary({ totalPlans: p.length, activePlans: statusCounts.active, completedPlans: statusCounts.completed, pendingOrders, lowStockCount: lowStock.length, totalOrders: o.length });
      setRecentPlans(p.slice(0, 5));
      setAlerts(planAlerts.slice(0, 5));
      setLoading(false);
    })();
  }, []);

  if (loading) return <div style={{ padding: 48, textAlign: 'center' }}><Spinner /></div>;

  const cards = [
    { label: 'Total Plans', value: summary.totalPlans, color: 'var(--primary-600)', bg: 'var(--primary-50)', action: () => onNavigate('dashboard') },
    { label: 'Active Plans', value: summary.activePlans, color: 'var(--success-600)', bg: 'var(--success-50)', action: () => onNavigate('dashboard') },
    { label: 'Pending Orders', value: summary.pendingOrders, color: 'var(--warning-600)', bg: 'var(--warning-50)', action: () => onNavigate('orders') },
    { label: 'Low Stock Items', value: summary.lowStockCount, color: summary.lowStockCount > 0 ? 'var(--error-600)' : 'var(--success-600)', bg: summary.lowStockCount > 0 ? 'var(--error-50)' : 'var(--success-50)', action: () => onNavigate('inventory') },
  ];

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 24, marginBottom: 4 }}>Sharadha Stores</h1>
        <p style={{ color: 'var(--neutral-500)', fontSize: 15 }}>Seasonal Production Planning Calendar — at a glance.</p>
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14, marginBottom: 28 }}>
        {cards.map(c => (
          <button key={c.label} onClick={c.action} style={{ background: '#fff', borderRadius: 12, padding: 20, boxShadow: 'var(--shadow)', border: '1px solid var(--neutral-100)', textAlign: 'left', cursor: 'pointer', transition: 'box-shadow 0.15s, transform 0.15s' }}
            onMouseEnter={e => { e.currentTarget.style.boxShadow = 'var(--shadow-lg)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
            onMouseLeave={e => { e.currentTarget.style.boxShadow = 'var(--shadow)'; e.currentTarget.style.transform = 'translateY(0)'; }}>
            <div style={{ fontSize: 32, fontWeight: 800, color: c.color, marginBottom: 4 }}>{c.value}</div>
            <div style={{ fontSize: 13, color: 'var(--neutral-500)' }}>{c.label}</div>
          </button>
        ))}
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div style={{ background: '#fff', borderRadius: 12, padding: 20, boxShadow: 'var(--shadow)', marginBottom: 20 }}>
          <h2 style={{ fontSize: 15, marginBottom: 16, color: 'var(--neutral-700)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--error-500)', display: 'inline-block' }} />
            Active Alerts ({alerts.length})
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {alerts.map(({ plan, metrics }) => (
              <div key={plan.id} onClick={() => onDetail(plan)} style={{
                background: metrics.alertLevel === 'critical' ? 'var(--error-50)' : 'var(--warning-50)',
                border: `1px solid ${metrics.alertLevel === 'critical' ? 'var(--error-200)' : 'var(--warning-200)'}`,
                borderRadius: 8, padding: '12px 16px', cursor: 'pointer', transition: 'opacity 0.15s',
              }}
                onMouseEnter={e => e.currentTarget.style.opacity = '0.8'}
                onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
                <div style={{ fontWeight: 600, fontSize: 14, color: metrics.alertLevel === 'critical' ? 'var(--error-700)' : 'var(--warning-700)', marginBottom: 2 }}>
                  {plan.festival_name} — {plan.product_name}
                </div>
                <div style={{ fontSize: 13, color: metrics.alertLevel === 'critical' ? 'var(--error-600)' : 'var(--warning-600)' }}>
                  {metrics.alert}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
        {/* Recent Plans */}
        <div style={{ background: '#fff', borderRadius: 12, padding: 20, boxShadow: 'var(--shadow)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h2 style={{ fontSize: 15, color: 'var(--neutral-700)' }}>Recent Plans</h2>
            <button onClick={() => onNavigate('dashboard')} style={{ fontSize: 13, color: 'var(--primary-600)', background: 'none', border: 'none', cursor: 'pointer' }}>View all</button>
          </div>
          {recentPlans.length === 0 ? (
            <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--neutral-400)', fontSize: 14 }}>
              No plans yet.{' '}
              <button onClick={() => onNavigate('entry')} style={{ color: 'var(--primary-600)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 14 }}>Create one?</button>
            </div>
          ) : recentPlans.map(p => (
            <div key={p.id} onClick={() => onDetail(p)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--neutral-100)', cursor: 'pointer' }}
              onMouseEnter={e => e.currentTarget.style.opacity = '0.7'}
              onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--neutral-800)' }}>{p.festival_name}</div>
                <div style={{ fontSize: 12, color: 'var(--neutral-500)' }}>{p.product_name} · {p.expected_orders} units</div>
              </div>
              <StatusBadge status={p.status} />
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div style={{ background: '#fff', borderRadius: 12, padding: 20, boxShadow: 'var(--shadow)' }}>
          <h2 style={{ fontSize: 15, color: 'var(--neutral-700)', marginBottom: 16 }}>Quick Actions</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { label: 'Create New Production Plan', page: 'entry', desc: 'Map a festival to production batches', color: 'var(--primary-600)' },
              { label: 'View Dashboard', page: 'dashboard', desc: 'Filter, sort, and manage all plans', color: 'var(--success-600)' },
              { label: 'Add an Order', page: 'orders', desc: 'Record a customer order', color: 'var(--accent-600)' },
              { label: 'View Reports', page: 'reports', desc: 'Analytics, charts, and CSV export', color: 'var(--neutral-700)' },
              { label: 'Manage Inventory', page: 'inventory', desc: 'Track ingredient stock levels', color: 'var(--warning-600)' },
            ].map(item => (
              <button key={item.label} onClick={() => onNavigate(item.page)} style={{
                display: 'flex', flexDirection: 'column', padding: '12px 16px', borderRadius: 8,
                border: '1px solid var(--neutral-200)', background: '#fff', cursor: 'pointer', textAlign: 'left',
                transition: 'border-color 0.15s, background 0.15s',
              }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--primary-300)'; e.currentTarget.style.background = 'var(--primary-50)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--neutral-200)'; e.currentTarget.style.background = '#fff'; }}>
                <span style={{ fontSize: 14, fontWeight: 600, color: item.color, marginBottom: 2 }}>{item.label}</span>
                <span style={{ fontSize: 12, color: 'var(--neutral-400)' }}>{item.desc}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
