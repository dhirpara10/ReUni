import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import StatusBadge from '../components/StatusBadge';

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
      const res = await fetch(`{BACKEND_URL}/items/seller/${user.id}`);
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
      const res = await fetch(`{BACKEND_URL}/items/${itemId}`, {
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
      const res = await fetch(`{BACKEND_URL}/items/${itemId}`, {
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
      <div style={{ maxWidth: '400px', margin: '50px auto', fontFamily: 'sans-serif', textAlign: 'center' }}>
        <p>Please <a href="/login">log in</a> to view your listings.</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '700px', margin: '30px auto', fontFamily: 'sans-serif', padding: '0 20px' }}>
      <h2>My Listings</h2>

      {loading && <p>Loading...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {actionMessage && <p style={{ color: 'red' }}>{actionMessage}</p>}
      {!loading && items.length === 0 && <p style={{ color: '#666' }}>You haven't posted anything yet.</p>}

      {items.map((item) => (
        <div
          key={item.id}
          style={{
            border: '1px solid #eee',
            borderRadius: '8px',
            padding: '14px',
            marginBottom: '12px',
            display: 'flex',
            gap: '14px',
            alignItems: 'flex-start'
          }}
        >
          <div style={{
            width: '80px',
            height: '80px',
            flexShrink: 0,
            backgroundColor: '#f0f0f0',
            borderRadius: '6px',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            {item.image_url ? (
              <img src={item.image_url} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <span style={{ fontSize: '10px', color: '#aaa' }}>No image</span>
            )}
          </div>

          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <strong>{item.title}</strong>
              <StatusBadge status={item.status} />
            </div>
            <p style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#666' }}>
              {item.category} · {item.condition} ·{' '}
              {item.exchange_type === 'Sell' ? `$${item.price}` : item.exchange_type}
            </p>

            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button onClick={() => navigate(`/items/${item.id}/edit`)} style={{ padding: '6px 12px', cursor: 'pointer' }}>
                Edit
              </button>

              {item.status === 'Available' && (
                <>
                  <button onClick={() => handleStatusChange(item.id, 'Sold')} style={{ padding: '6px 12px', cursor: 'pointer' }}>
                    Mark as Sold
                  </button>
                  <button onClick={() => handleStatusChange(item.id, 'Given Away')} style={{ padding: '6px 12px', cursor: 'pointer' }}>
                    Mark as Given Away
                  </button>
                </>
              )}

              {item.status !== 'Available' && (
                <button onClick={() => handleStatusChange(item.id, 'Available')} style={{ padding: '6px 12px', cursor: 'pointer' }}>
                  Relist as Available
                </button>
              )}

              <button
                onClick={() => handleDelete(item.id)}
                style={{ padding: '6px 12px', cursor: 'pointer', color: '#c0392b' }}
              >
                Delete
              </button>

              <Link to={`/items/${item.id}`} style={{ padding: '6px 12px', alignSelf: 'center', fontSize: '13px' }}>
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