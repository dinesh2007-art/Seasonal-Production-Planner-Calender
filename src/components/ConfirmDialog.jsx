export default function ConfirmDialog({ message, onConfirm, onCancel }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
      zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{
        background: '#fff', borderRadius: 12, padding: 32,
        maxWidth: 400, width: '90%', boxShadow: 'var(--shadow-lg)',
        animation: 'fadeIn 0.15s ease-out',
      }}>
        <h3 style={{ marginBottom: 12, fontSize: 17 }}>Confirm Action</h3>
        <p style={{ color: 'var(--neutral-600)', fontSize: 14, marginBottom: 24, lineHeight: 1.6 }}>{message}</p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
          <button onClick={onCancel} style={{
            padding: '8px 20px', borderRadius: 8, border: '1px solid var(--neutral-200)',
            background: '#fff', cursor: 'pointer', fontSize: 14, fontWeight: 500, color: 'var(--neutral-700)',
          }}>Cancel</button>
          <button onClick={onConfirm} style={{
            padding: '8px 20px', borderRadius: 8, border: 'none',
            background: 'var(--error-500)', cursor: 'pointer', fontSize: 14, fontWeight: 600, color: '#fff',
          }}>Confirm</button>
        </div>
      </div>
    </div>
  );
}
