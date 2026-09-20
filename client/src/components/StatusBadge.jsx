function StatusBadge({ status }) {
  if (!status || status === 'Available') return null;

  const colors = {
    Sold: { bg: '#fdecea', color: '#c0392b' },
    'Given Away': { bg: '#eafaf1', color: '#27ae60' }
  };

  const style = colors[status] || { bg: '#eee', color: '#666' };

  return (
    <span style={{
      display: 'inline-block',
      padding: '3px 10px',
      borderRadius: '12px',
      fontSize: '12px',
      fontWeight: 'bold',
      backgroundColor: style.bg,
      color: style.color
    }}>
      {status}
    </span>
  );
}

export default StatusBadge;