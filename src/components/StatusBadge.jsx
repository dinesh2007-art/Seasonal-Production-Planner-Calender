const STATUS_STYLES = {
  planned:   { bg: '#dbeafe', color: '#1d4ed8', label: 'Planned' },
  active:    { bg: '#d1fae5', color: '#065f46', label: 'Active' },
  completed: { bg: '#f1f5f9', color: '#334155', label: 'Completed' },
  archived:  { bg: '#f1f5f9', color: '#64748b', label: 'Archived' },
  pending:   { bg: '#fff7ed', color: '#c2410c', label: 'Pending' },
  confirmed: { bg: '#d1fae5', color: '#065f46', label: 'Confirmed' },
  delivered: { bg: '#f0fdf4', color: '#166534', label: 'Delivered' },
  cancelled: { bg: '#fef2f2', color: '#991b1b', label: 'Cancelled' },
};

export default function StatusBadge({ status }) {
  const s = STATUS_STYLES[status] || { bg: '#f1f5f9', color: '#64748b', label: status };
  return (
    <span style={{
      display: 'inline-block', padding: '2px 10px',
      borderRadius: 20, fontSize: 12, fontWeight: 600,
      background: s.bg, color: s.color, whiteSpace: 'nowrap',
    }}>{s.label}</span>
  );
}
