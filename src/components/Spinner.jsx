export default function Spinner({ size = 24, color = 'var(--primary-500)' }) {
  return (
    <div style={{
      width: size, height: size,
      border: `2px solid var(--neutral-200)`,
      borderTop: `2px solid ${color}`,
      borderRadius: '50%',
      animation: 'spin 0.7s linear infinite',
      display: 'inline-block',
    }} />
  );
}
