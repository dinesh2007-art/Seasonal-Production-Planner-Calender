import { useState } from 'react';

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: '▦' },
  { id: 'entry', label: 'New Plan', icon: '+' },
  { id: 'reports', label: 'Reports', icon: '◈' },
  { id: 'orders', label: 'Orders', icon: '⊞' },
  { id: 'inventory', label: 'Inventory', icon: '⊟' },
  { id: 'requirements', label: 'Requirements', icon: '🧾' },
  { id: 'admin', label: 'Admin Config', icon: '⚙' },
];

export default function Layout({ children, currentPage, onNavigate, alerts, onLogout }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar */}
      <aside style={{
        width: sidebarOpen ? 240 : 64,
        minHeight: '100vh',
        background: 'var(--neutral-900)',
        transition: 'width 0.2s ease',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
        position: 'sticky',
        top: 0,
        zIndex: 50,
      }}>
        {/* Logo */}
        <div style={{
          padding: '16px',
          borderBottom: '1px solid var(--neutral-700)',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          cursor: 'pointer',
        }} onClick={() => setSidebarOpen(p => !p)}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: 'linear-gradient(135deg, var(--primary-500), var(--primary-700))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 16, color: '#fff', flexShrink: 0,
          }}>S</div>
          {sidebarOpen && (
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', whiteSpace: 'nowrap' }}>Sharadha Stores</div>
              <div style={{ fontSize: 11, color: 'var(--neutral-400)', whiteSpace: 'nowrap' }}>Production Calendar</div>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav style={{ padding: '8px 0', flex: 1 }}>
          {NAV_ITEMS.map(item => (
            <button key={item.id}
              onClick={() => { onNavigate(item.id); setSidebarOpen(false); }}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                padding: '10px 16px', border: 'none', cursor: 'pointer',
                background: currentPage === item.id ? 'rgba(59,130,246,0.15)' : 'transparent',
                color: currentPage === item.id ? 'var(--primary-200)' : 'var(--neutral-400)',
                transition: 'all 0.15s', borderLeft: currentPage === item.id ? '3px solid var(--primary-500)' : '3px solid transparent',
                textAlign: 'left',
              }}
              onMouseEnter={e => { if (currentPage !== item.id) e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
              onMouseLeave={e => { if (currentPage !== item.id) e.currentTarget.style.background = 'transparent'; }}
            >
              <span style={{ fontSize: 16, flexShrink: 0, width: 20, textAlign: 'center' }}>{item.icon}</span>
              {sidebarOpen && <span style={{ fontSize: 13, fontWeight: 500, whiteSpace: 'nowrap' }}>{item.label}</span>}
              {sidebarOpen && item.id === 'dashboard' && alerts > 0 && (
                <span style={{
                  marginLeft: 'auto', background: 'var(--error-500)', color: '#fff',
                  borderRadius: 10, padding: '1px 6px', fontSize: 11, fontWeight: 700,
                }}>{alerts}</span>
              )}
            </button>
          ))}
        </nav>
        {onLogout && (
          <div style={{ marginTop: 'auto', borderTop: '1px solid var(--neutral-700)', padding: '8px 0' }}>
            <button onClick={onLogout}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                padding: '10px 16px', border: 'none', cursor: 'pointer',
                background: 'transparent', color: 'var(--error-500)',
                transition: 'all 0.15s', borderLeft: '3px solid transparent',
                textAlign: 'left',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
            >
              <span style={{ fontSize: 16, flexShrink: 0, width: 20, textAlign: 'center' }}>⎋</span>
              {sidebarOpen && <span style={{ fontSize: 13, fontWeight: 500, whiteSpace: 'nowrap' }}>Logout</span>}
            </button>
          </div>
        )}
      </aside>

      {/* Main */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <div style={{ flex: 1, padding: '24px', maxWidth: 1400, width: '100%', margin: '0 auto' }}>
          {children}
        </div>
      </main>
    </div>
  );
}
