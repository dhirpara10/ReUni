import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const CATEGORIES = ['All', 'Books', 'Furniture', 'Electronics', 'Stationery', 'Other'];

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
        ? 'http://localhost:5001/items'
        : `http://localhost:5001/items?category=${category}`;

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
    <div style={{ maxWidth: '900px', margin: '30px auto', fontFamily: 'sans-serif', padding: '0 20px' }}>
      <h2>Browse Items</h2>

      {/* Category filter buttons */}
      <div style={{ marginBottom: '20px' }}>
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            style={{
              marginRight: '8px',
              padding: '8px 14px',
              backgroundColor: category === cat ? '#333' : '#eee',
              color: category === cat ? '#fff' : '#333',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {loading && <p>Loading items...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {!loading && items.length === 0 && <p>No items found in this category.</p>}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '16px' }}>
        {items.map((item) => (
          <Link
            to={`/items/${item.id}`}
            key={item.id}
            style={{
              border: '1px solid #ccc',
              borderRadius: '8px',
              padding: '14px',
              textDecoration: 'none',
              color: 'inherit',
              display: 'block'
            }}
          >
            <h4 style={{ margin: '0 0 6px 0' }}>{item.title}</h4>
            <p style={{ margin: '0 0 4px 0', fontSize: '14px', color: '#666' }}>{item.category} · {item.condition}</p>
            <p style={{ margin: '0 0 4px 0', fontWeight: 'bold' }}>
              {item.exchange_type === 'Sell' ? `$${item.price}` : item.exchange_type}
            </p>
            <p style={{ margin: 0, fontSize: '12px', color: '#999' }}>Posted by {item.users?.full_name}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default Browse;