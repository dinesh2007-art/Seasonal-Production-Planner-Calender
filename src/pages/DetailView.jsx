import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { calculateCapacityMetrics } from '../lib/capacityEngine';
import StatusBadge from '../components/StatusBadge';
import Spinner from '../components/Spinner';

export default function DetailView({ plan, onBack, onEdit }) {
  const [history, setHistory] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const [{ data: h }, { data: o }] = await Promise.all([
        supabase.from('action_history').select('*').eq('plan_id', plan.id).order('performed_at', { ascending: false }),
        supabase.from('orders').select('*').eq('plan_id', plan.id).order('created_at', { ascending: false }),
      ]);
      setHistory(h || []);
      setOrders(o || []);
      setLoading(false);
    })();
  }, [plan.id]);

  const metrics = calculateCapacityMetrics(plan);

  const handleExport = () => {
    const rows = [
      ['Field', 'Value'],
      ['Festival', plan.festival_name],
      ['Product', plan.product_name],
      ['Batch Size', plan.batch_size],
      ['Expected Orders', plan.expected_orders],
      ['Daily Capacity', plan.production_capacity],
      ['Total Capacity', metrics.totalProductionCapacity],
      ['Utilisation', `${metrics.utilisationRate}%`],
      ['Batches Required', metrics.batchesRequired],
      ['Shortfall', metrics.shortfall],
      ['Surplus', metrics.surplus],
      ['Procurement Deadline', plan.procurement_deadline],
      ['Production Start', plan.production_start_date],
      ['Production End', plan.production_end_date],
      ['Status', plan.status],
      ['Notes', plan.notes || ''],
    ];
    const csv = rows.map(r => r.map(v => `"${v}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `plan_${plan.festival_name}_${plan.product_name}.csv`.replace(/\s+/g, '_');
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => window.print();

  const MetricCard = ({ label, value, sub, color }) => (
    <div style={{ background: '#fff', borderRadius: 10, padding: 16, boxShadow: 'var(--shadow-sm)', border: '1px solid var(--neutral-100)' }}>
      <div style={{ fontSize: 12, color: 'var(--neutral-500)', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 700, color: color || 'var(--neutral-900)' }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: 'var(--neutral-400)', marginTop: 2 }}>{sub}</div>}
    </div>
  );

  return (
    <div className="animate-fade-in">
      {/* Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20, fontSize: 14, color: 'var(--neutral-500)' }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary-600)', fontSize: 14, padding: 0 }}>
          Production Plans
        </button>
        <span>/</span>
        <span style={{ color: 'var(--neutral-800)' }}>{plan.festival_name} — {plan.product_name}</span>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
            <h1 style={{ fontSize: 22 }}>{plan.festival_name} — {plan.product_name}</h1>
            <StatusBadge status={plan.status} />
          </div>
          {metrics.alert && (
            <div style={{
              background: metrics.alertLevel === 'critical' ? 'var(--error-50)' : 'var(--warning-50)',
              border: `1px solid ${metrics.alertLevel === 'critical' ? 'var(--error-500)' : 'var(--warning-500)'}`,
              borderRadius: 8, padding: '8px 14px', fontSize: 13,
              color: metrics.alertLevel === 'critical' ? 'var(--error-700)' : 'var(--warning-700)',
              fontWeight: 500,
            }}>
              {metrics.alertLevel === 'critical' ? '⚠ ' : '!'} {metrics.alert}
            </div>
          )}
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={handlePrint} style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid var(--neutral-200)', background: '#fff', cursor: 'pointer', fontSize: 14, fontWeight: 500 }}>Print</button>
          <button onClick={handleExport} style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid var(--neutral-200)', background: '#fff', cursor: 'pointer', fontSize: 14, fontWeight: 500 }}>Export CSV</button>
          <button onClick={() => onEdit(plan)} style={{ padding: '8px 20px', borderRadius: 8, border: 'none', background: 'var(--primary-600)', color: '#fff', cursor: 'pointer', fontSize: 14, fontWeight: 600 }}>Edit Plan</button>
        </div>
      </div>

      {/* Capacity Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 20 }}>
        <MetricCard label="Utilisation Rate" value={`${metrics.utilisationRate}%`}
          color={metrics.utilisationRate > 95 ? 'var(--error-600)' : metrics.utilisationRate > 80 ? 'var(--warning-600)' : 'var(--success-600)'}
          sub={`of total capacity`} />
        <MetricCard label="Total Capacity" value={metrics.totalProductionCapacity.toLocaleString()} sub={`${metrics.productionDays} day(s) of production`} />
        <MetricCard label="Batches Required" value={metrics.batchesRequired} sub={`at ${plan.batch_size} units/batch`} />
        {metrics.shortfall > 0
          ? <MetricCard label="Projected Shortfall" value={metrics.shortfall.toLocaleString()} color="var(--error-600)" sub="units short" />
          : <MetricCard label="Projected Surplus" value={metrics.surplus.toLocaleString()} color="var(--success-600)" sub="units surplus" />
        }
        <MetricCard label="Days to Procurement"
          value={metrics.daysUntilProcurement < 0 ? 'Overdue' : metrics.daysUntilProcurement}
          color={metrics.daysUntilProcurement < 0 ? 'var(--error-600)' : metrics.daysUntilProcurement <= 3 ? 'var(--warning-600)' : 'var(--neutral-900)'}
          sub={plan.procurement_deadline} />
        <MetricCard label="Days to Production"
          value={metrics.daysUntilProduction < 0 ? 'Started' : metrics.daysUntilProduction}
          sub={plan.production_start_date} />
      </div>

      {/* Utilisation Bar */}
      <div style={{ background: '#fff', borderRadius: 12, padding: 20, boxShadow: 'var(--shadow)', marginBottom: 16 }}>
        <h2 style={{ fontSize: 14, marginBottom: 12, color: 'var(--neutral-700)' }}>Capacity Utilisation</h2>
        <div style={{ height: 16, background: 'var(--neutral-100)', borderRadius: 8, overflow: 'hidden', marginBottom: 8 }}>
          <div style={{
            width: `${Math.min(100, metrics.utilisationRate)}%`, height: '100%',
            background: metrics.utilisationRate > 95 ? 'var(--error-500)' : metrics.utilisationRate > 80 ? 'var(--warning-500)' : 'var(--success-500)',
            borderRadius: 8, transition: 'width 0.5s ease',
          }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--neutral-500)' }}>
          <span>0 units</span>
          <span>{plan.expected_orders} expected / {metrics.totalProductionCapacity} capacity</span>
          <span>{metrics.utilisationRate}%</span>
        </div>
      </div>

      {/* Plan Details */}
      <div style={{ background: '#fff', borderRadius: 12, padding: 20, boxShadow: 'var(--shadow)', marginBottom: 16 }}>
        <h2 style={{ fontSize: 14, marginBottom: 16, color: 'var(--neutral-700)' }}>Plan Details</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
          {[
            ['Festival', plan.festival_name],
            ['Product', plan.product_name],
            ['Batch Size', `${plan.batch_size} units/batch`],
            ['Expected Orders', `${plan.expected_orders.toLocaleString()} units`],
            ['Daily Capacity', `${plan.production_capacity.toLocaleString()} units/day`],
            ['Procurement Deadline', plan.procurement_deadline],
            ['Production Start', plan.production_start_date],
            ['Production End', plan.production_end_date],
            ['Created', new Date(plan.created_at).toLocaleDateString()],
            ['Last Updated', new Date(plan.updated_at).toLocaleDateString()],
          ].map(([label, value]) => (
            <div key={label}>
              <div style={{ fontSize: 12, color: 'var(--neutral-400)', marginBottom: 2 }}>{label}</div>
              <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--neutral-800)' }}>{value}</div>
            </div>
          ))}
          {plan.notes && (
            <div style={{ gridColumn: '1 / -1' }}>
              <div style={{ fontSize: 12, color: 'var(--neutral-400)', marginBottom: 2 }}>Notes</div>
              <div style={{ fontSize: 14, color: 'var(--neutral-700)', lineHeight: 1.6 }}>{plan.notes}</div>
            </div>
          )}
        </div>
      </div>

      {loading ? (
        <div style={{ padding: 32, textAlign: 'center' }}><Spinner /></div>
      ) : (
        <>
          {/* Related Orders */}
          <div style={{ background: '#fff', borderRadius: 12, padding: 20, boxShadow: 'var(--shadow)', marginBottom: 16 }}>
            <h2 style={{ fontSize: 14, marginBottom: 16, color: 'var(--neutral-700)' }}>Related Orders ({orders.length})</h2>
            {orders.length === 0 ? (
              <p style={{ color: 'var(--neutral-400)', fontSize: 14 }}>No orders linked to this plan yet.</p>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--neutral-200)' }}>
                      {['Customer', 'Product', 'Quantity', 'Date', 'Status'].map(h => (
                        <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600, color: 'var(--neutral-600)', fontSize: 13 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map(o => (
                      <tr key={o.id} style={{ borderBottom: '1px solid var(--neutral-100)' }}>
                        <td style={{ padding: '8px 12px' }}>{o.customer_name}</td>
                        <td style={{ padding: '8px 12px', color: 'var(--neutral-600)' }}>{o.product_name}</td>
                        <td style={{ padding: '8px 12px' }}>{o.quantity}</td>
                        <td style={{ padding: '8px 12px', color: 'var(--neutral-600)' }}>{o.order_date}</td>
                        <td style={{ padding: '8px 12px' }}><StatusBadge status={o.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Action History */}
          <div style={{ background: '#fff', borderRadius: 12, padding: 20, boxShadow: 'var(--shadow)' }}>
            <h2 style={{ fontSize: 14, marginBottom: 16, color: 'var(--neutral-700)' }}>Action History</h2>
            {history.length === 0 ? (
              <p style={{ color: 'var(--neutral-400)', fontSize: 14 }}>No history recorded yet.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {history.map(h => (
                  <div key={h.id} style={{ display: 'flex', gap: 12, padding: '10px 0', borderBottom: '1px solid var(--neutral-100)' }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--primary-500)', marginTop: 5, flexShrink: 0 }} />
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 500 }}>{h.action}</div>
                      {h.old_status && h.new_status && h.old_status !== h.new_status && (
                        <div style={{ fontSize: 12, color: 'var(--neutral-500)', marginTop: 2 }}>
                          {h.old_status} → {h.new_status}
                        </div>
                      )}
                      <div style={{ fontSize: 12, color: 'var(--neutral-400)', marginTop: 2 }}>
                        {new Date(h.performed_at).toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
