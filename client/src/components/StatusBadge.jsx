function StatusBadge({ status }) {
  if (!status || status === 'Available') return null;

  return <span className="badge badge-status">{status}</span>;
}

export default StatusBadge;