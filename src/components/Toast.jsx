import { useEffect } from 'react';

export default function Toast({ message, type = 'success', onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3500);
    return () => clearTimeout(t);
  }, [onClose]);

  const colors = {
    success: { bg: '#f0fdf4', border: '#86efac', color: '#166534' },
    error:   { bg: '#fef2f2', border: '#fca5a5', color: '#991b1b' },
    warning: { bg: '#fffbeb', border: '#fcd34d', color: '#92400e' },
  };
  const c = colors[type] || colors.success;

  return (
    <div style={{
      position: 'fixed', bottom: 24, right: 24, zIndex: 9999,
      background: c.bg, border: `1px solid ${c.border}`, color: c.color,
      padding: '12px 20px', borderRadius: 8, boxShadow: 'var(--shadow-lg)',
      animation: 'slideIn 0.2s ease-out', maxWidth: 360,
      display: 'flex', alignItems: 'center', gap: 12,
      fontSize: 14, fontWeight: 500,
    }}>
      <span>{message}</span>
      <button onClick={onClose} style={{
        background: 'none', border: 'none', color: c.color,
        fontSize: 16, cursor: 'pointer', marginLeft: 'auto', padding: 0,
      }}>×</button>
    </div>
  );
}
