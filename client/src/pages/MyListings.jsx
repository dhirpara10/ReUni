import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import StatusBadge from '../components/StatusBadge';
import { BACKEND_URL } from '../config';

function MyListings() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('reuni_user'));

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionMessage, setActionMessage] = useState('');

  useEffect(() => {
    if (user) fetchMyItems();
  }, []);

  const fetchMyItems = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/items/seller/${user.id}`);
      const data = await res.json();
      if (res.ok) {
        setItems(data.items);
      } else {
        setError(data.error || 'Failed to load your listings.');
      }
    } catch (err) {
      setError('Could not reach the server.');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (itemId, newStatus) => {
    setActionMessage('');
    try {
      const res = await fetch(`${BACKEND_URL}/items/${itemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ seller_id: user.id, status: newStatus })
      });
      const data = await res.json();
      if (res.ok) {
        setItems(items.map((it) => (it.id === itemId ? data.item : it)));
      } else {
        setActionMessage(data.error || 'Failed to update status.');
      }
    } catch (err) {
      setActionMessage('Could not reach the server.');
    }
  };

  const handleDelete = async (itemId) => {
    if (!window.confirm('Delete this listing? This cannot be undone.')) return;

    setActionMessage('');
    try {
      const res = await fetch(`${BACKEND_URL}/items/${itemId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ seller_id: user.id })
      });
      const data = await res.json();
      if (res.ok) {
        setItems(items.filter((it) => it.id !== itemId));
      } else {
        setActionMessage(data.error || 'Failed to delete item.');
      }
    } catch (err) {
      setActionMessage('Could not reach the server.');
    }
  };

  if (!user) {
    return (
      <div className="page" style={{ textAlign: 'center' }}>
        <p>Please <a href="/login">log in</a> to view your listings.</p>
      </div>
    );
  }

  return (
    <div className="page-wide">
      <h2>My Listings</h2>

      {loading && <p className="msg">Loading...</p>}
      {error && <p className="msg msg-error">{error}</p>}
      {actionMessage && <p className="msg msg-error">{actionMessage}</p>}
      {!loading && items.length === 0 && <p className="msg">You haven't posted anything yet.</p>}

      {items.map((item) => (
        <div
          key={item.id}
          className="card"
          style={{
            display: 'flex',
            gap: '16px',
            alignItems: 'flex-start',
            marginBottom: '12px'
          }}
        >
          <div style={{
            width: '80px',
            height: '80px',
            flexShrink: 0,
            backgroundColor: 'var(--bg)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius)',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            {item.image_url ? (
              <img src={item.image_url} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>No image</span>
            )}
          </div>

          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <strong>{item.title}</strong>
              <StatusBadge status={item.status} />
            </div>
            <p className="msg" style={{ marginTop: 0, marginBottom: '10px' }}>
              {item.category} · {item.condition} ·{' '}
              {item.exchange_type === 'Sell' ? `$${item.price}` : item.exchange_type}
            </p>

            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button onClick={() => navigate(`/items/${item.id}/edit`)} className="btn">
                Edit
              </button>

              {item.status === 'Available' && (
                <>
                  <button onClick={() => handleStatusChange(item.id, 'Sold')} className="btn">
                    Mark as Sold
                  </button>
                  <button onClick={() => handleStatusChange(item.id, 'Given Away')} className="btn">
                    Mark as Given Away
                  </button>
                </>
              )}

              {item.status !== 'Available' && (
                <button onClick={() => handleStatusChange(item.id, 'Available')} className="btn">
                  Relist as Available
                </button>
              )}

              <button onClick={() => handleDelete(item.id)} className="btn btn-danger">
                Delete
              </button>

              <Link to={`/items/${item.id}`} className="nav-link" style={{ alignSelf: 'center', fontSize: '13px' }}>
                View
              </Link>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default MyListings;