import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid, Legend, PieChart, Pie, Cell } from 'recharts';
import Spinner from '../components/Spinner';

const STATUS_COLORS = { planned: '#3b82f6', active: '#10b981', completed: '#6b7280', archived: '#9ca3af' };

export default function Reports() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  });
  const [dateTo, setDateTo] = useState(() => new Date().toISOString().split('T')[0]);

  const load = async () => {
    setLoading(true);
    const { data: plans } = await supabase
      .from('production_plans')
      .select('*')
      .gte('created_at', dateFrom)
      .lte('created_at', dateTo + 'T23:59:59');

    if (!plans) { setLoading(false); return; }

    const statusCounts = { planned: 0, active: 0, completed: 0, archived: 0 };
    let totalOrders = 0, totalCapacity = 0;
    plans.forEach(p => {
      statusCounts[p.status] = (statusCounts[p.status] || 0) + 1;
      totalOrders += p.expected_orders;
      const days = Math.max(1, Math.round((new Date(p.production_end_date) - new Date(p.production_start_date)) / 86400000) + 1);
      totalCapacity += p.production_capacity * days;
    });

    const pieData = Object.entries(statusCounts).filter(([, v]) => v > 0).map(([k, v]) => ({ name: k, value: v }));

    const byFestival = {};
    plans.forEach(p => {
      if (!byFestival[p.festival_name]) byFestival[p.festival_name] = { festival: p.festival_name, orders: 0, capacity: 0, count: 0 };
      byFestival[p.festival_name].orders += p.expected_orders;
      const days = Math.max(1, Math.round((new Date(p.production_end_date) - new Date(p.production_start_date)) / 86400000) + 1);
      byFestival[p.festival_name].capacity += p.production_capacity * days;
      byFestival[p.festival_name].count += 1;
    });

    const byDay = {};
    plans.forEach(p => {
      const d = p.created_at.split('T')[0];
      if (!byDay[d]) byDay[d] = { date: d, plans: 0, orders: 0 };
      byDay[d].plans += 1;
      byDay[d].orders += p.expected_orders;
    });

    setData({
      total: plans.length,
      statusCounts,
      totalOrders,
      totalCapacity,
      utilisationRate: totalCapacity > 0 ? Math.round((totalOrders / totalCapacity) * 100) : 0,
      pieData,
      festivalData: Object.values(byFestival).sort((a, b) => b.orders - a.orders),
      trendData: Object.values(byDay).sort((a, b) => a.date.localeCompare(b.date)),
    });
    setLoading(false);
  };

  useEffect(() => { load(); }, [dateFrom, dateTo]);

  const handleCSVExport = () => {
    if (!data) return;
    const rows = [
      ['Metric', 'Value'],
      ['Total Plans', data.total],
      ['Total Expected Orders', data.totalOrders],
      ['Total Production Capacity', data.totalCapacity],
      ['Overall Utilisation Rate', `${data.utilisationRate}%`],
      ...Object.entries(data.statusCounts).map(([s, c]) => [`${s} plans`, c]),
    ];
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sharadha_stores_report_${dateFrom}_to_${dateTo}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 22, marginBottom: 4 }}>Reports & Analytics</h1>
          <p style={{ color: 'var(--neutral-500)', fontSize: 14 }}>Production planning trends and insights for Sharadha Stores.</p>
        </div>
        <button onClick={handleCSVExport} style={{ padding: '10px 20px', borderRadius: 8, border: '1px solid var(--neutral-200)', background: '#fff', cursor: 'pointer', fontSize: 14, fontWeight: 500 }}>
          Export CSV
        </button>
      </div>

      {/* Date Range Filter */}
      <div style={{ background: '#fff', borderRadius: 12, padding: 16, boxShadow: 'var(--shadow)', marginBottom: 20, display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
        <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--neutral-700)' }}>Date Range:</span>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
            style={{ padding: '7px 10px', borderRadius: 8, border: '1px solid var(--neutral-200)', fontSize: 14, color: 'var(--neutral-800)' }} />
          <span style={{ color: 'var(--neutral-400)' }}>to</span>
          <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
            style={{ padding: '7px 10px', borderRadius: 8, border: '1px solid var(--neutral-200)', fontSize: 14, color: 'var(--neutral-800)' }} />
        </div>
        {['7d', '30d', '90d'].map(r => (
          <button key={r} onClick={() => {
            const d = new Date();
            const days = parseInt(r);
            d.setDate(d.getDate() - days);
            setDateFrom(d.toISOString().split('T')[0]);
            setDateTo(new Date().toISOString().split('T')[0]);
          }} style={{ padding: '6px 12px', borderRadius: 20, border: '1px solid var(--neutral-200)', background: '#fff', cursor: 'pointer', fontSize: 13, color: 'var(--neutral-600)' }}>
            Last {r}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ padding: 48, textAlign: 'center' }}><Spinner /></div>
      ) : !data || data.total === 0 ? (
        <div style={{ padding: 48, textAlign: 'center', color: 'var(--neutral-400)', background: '#fff', borderRadius: 12, boxShadow: 'var(--shadow)' }}>
          No data in selected date range.
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 20 }}>
            {[
              { label: 'Total Plans', value: data.total, color: 'var(--primary-600)' },
              { label: 'Expected Orders', value: data.totalOrders.toLocaleString(), color: 'var(--success-600)' },
              { label: 'Total Capacity', value: data.totalCapacity.toLocaleString(), color: 'var(--accent-600)' },
              { label: 'Avg Utilisation', value: `${data.utilisationRate}%`, color: data.utilisationRate > 80 ? 'var(--error-600)' : 'var(--success-600)' },
            ].map(c => (
              <div key={c.label} style={{ background: '#fff', borderRadius: 10, padding: 20, boxShadow: 'var(--shadow-sm)', border: '1px solid var(--neutral-100)', textAlign: 'center' }}>
                <div style={{ fontSize: 28, fontWeight: 700, color: c.color, marginBottom: 4 }}>{c.value}</div>
                <div style={{ fontSize: 13, color: 'var(--neutral-500)' }}>{c.label}</div>
              </div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16, marginBottom: 16 }}>
            {/* Status Distribution */}
            <div style={{ background: '#fff', borderRadius: 12, padding: 20, boxShadow: 'var(--shadow)' }}>
              <h2 style={{ fontSize: 14, marginBottom: 16, color: 'var(--neutral-700)' }}>Plans by Status</h2>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={data.pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label={({ name, value }) => `${name}: ${value}`}>
                    {data.pieData.map(e => <Cell key={e.name} fill={STATUS_COLORS[e.name] || '#94a3b8'} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Festival Bar Chart */}
            {data.festivalData.length > 0 && (
              <div style={{ background: '#fff', borderRadius: 12, padding: 20, boxShadow: 'var(--shadow)' }}>
                <h2 style={{ fontSize: 14, marginBottom: 16, color: 'var(--neutral-700)' }}>Orders by Festival</h2>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={data.festivalData.slice(0, 6)}>
                    <XAxis dataKey="festival" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="orders" fill="var(--primary-500)" radius={[4, 4, 0, 0]} name="Expected Orders" />
                    <Bar dataKey="capacity" fill="var(--success-500)" radius={[4, 4, 0, 0]} name="Total Capacity" />
                    <Legend iconSize={12} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Trend Chart */}
          {data.trendData.length > 1 && (
            <div style={{ background: '#fff', borderRadius: 12, padding: 20, boxShadow: 'var(--shadow)', marginBottom: 16 }}>
              <h2 style={{ fontSize: 14, marginBottom: 16, color: 'var(--neutral-700)' }}>Plans Created Over Time</h2>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={data.trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--neutral-100)" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="plans" stroke="var(--primary-500)" strokeWidth={2} dot={{ r: 3 }} name="Plans" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Festival Table */}
          {data.festivalData.length > 0 && (
            <div style={{ background: '#fff', borderRadius: 12, padding: 20, boxShadow: 'var(--shadow)' }}>
              <h2 style={{ fontSize: 14, marginBottom: 16, color: 'var(--neutral-700)' }}>Festival Summary</h2>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--neutral-200)' }}>
                      {['Festival', 'Plans', 'Expected Orders', 'Total Capacity', 'Utilisation'].map(h => (
                        <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontSize: 13, fontWeight: 600, color: 'var(--neutral-600)' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.festivalData.map(row => {
                      const u = row.capacity > 0 ? Math.round((row.orders / row.capacity) * 100) : 0;
                      return (
                        <tr key={row.festival} style={{ borderBottom: '1px solid var(--neutral-100)' }}>
                          <td style={{ padding: '10px 12px', fontWeight: 500 }}>{row.festival}</td>
                          <td style={{ padding: '10px 12px', color: 'var(--neutral-600)' }}>{row.count}</td>
                          <td style={{ padding: '10px 12px' }}>{row.orders.toLocaleString()}</td>
                          <td style={{ padding: '10px 12px' }}>{row.capacity.toLocaleString()}</td>
                          <td style={{ padding: '10px 12px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <div style={{ width: 60, height: 6, background: 'var(--neutral-100)', borderRadius: 3 }}>
                                <div style={{ width: `${Math.min(100, u)}%`, height: '100%', borderRadius: 3, background: u > 80 ? 'var(--error-500)' : 'var(--success-500)' }} />
                              </div>
                              <span style={{ fontSize: 12 }}>{u}%</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
