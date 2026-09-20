import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BACKEND_URL } from '../config';

const CATEGORIES = ['All', 'Books', 'Furniture', 'Electronics', 'Stationery', 'Other'];

const EXCHANGE_STYLE = {
  Sell: { border: 'var(--accent-sell)', badge: 'badge-sell' },
  Swap: { border: 'var(--accent-swap)', badge: 'badge-swap' },
  Giveaway: { border: 'var(--accent-give)', badge: 'badge-give' }
};

function Browse() {
  const [items, setItems] = useState([]);
  const [category, setCategory] = useState('All');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchItems();
  }, [category]);

  const fetchItems = async () => {
    setLoading(true);
    setError('');
    try {
      const url = category === 'All'
        ? `${BACKEND_URL}/items`
        : `${BACKEND_URL}/items?category=${category}`;

      const res = await fetch(url);
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to load items.');
      } else {
        setItems(data.items);
      }
    } catch (err) {
      setError('Could not reach the server.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-wide">
      <h2>Browse Items</h2>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className="btn"
            style={{
              padding: '7px 14px',
              fontSize: '13px',
              backgroundColor: category === cat ? 'var(--text)' : 'var(--surface)',
              color: category === cat ? 'var(--bg)' : 'var(--text)',
              borderColor: category === cat ? 'var(--text)' : 'var(--border)'
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {loading && <p className="msg">Loading items...</p>}
      {error && <p className="msg msg-error">{error}</p>}
      {!loading && items.length === 0 && <p className="msg">No items found in this category.</p>}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '16px' }}>
        {items.map((item) => {
          const style = EXCHANGE_STYLE[item.exchange_type] || EXCHANGE_STYLE.Sell;
          return (
            <Link
              to={`/items/${item.id}`}
              key={item.id}
              className="card"
              style={{
                padding: 0,
                overflow: 'hidden',
                textDecoration: 'none',
                color: 'inherit',
                display: 'block',
                borderLeft: `3px solid ${style.border}`
              }}
            >
              <div style={{
                width: '100%',
                height: '140px',
                backgroundColor: 'var(--bg)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden'
              }}>
                {item.image_url ? (
                  <img
                    src={item.image_url}
                    alt={item.title}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>No image</span>
                )}
              </div>

              <div style={{ padding: '14px' }}>
                <h4 style={{ margin: '0 0 6px 0' }}>{item.title}</h4>
                <p className="msg" style={{ margin: '0 0 8px 0' }}>{item.category} · {item.condition}</p>
                <span className={`badge ${style.badge}`}>
                  {item.exchange_type === 'Sell' ? `$${item.price}` : item.exchange_type}
                </span>
                <p style={{ margin: '10px 0 0 0', fontSize: '12px', color: 'var(--text-muted)' }}>
                  Posted by {item.users?.full_name}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export default Browse;