
import { useState, useEffect } from 'react';
import { BACKEND_URL } from '../config';const CATEGORIES = ['Books', 'Furniture', 'Electronics', 'Stationery', 'Other'];

function Wishlist() {
  const user = JSON.parse(localStorage.getItem('reuni_user'));

  const [wishlist, setWishlist] = useState([]);
  const [keyword, setKeyword] = useState('');
  const [category, setCategory] = useState('Books');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) fetchWishlist();
  }, []);

  const fetchWishlist = async () => {
    setLoading(true);
    try {
      const res = await fetch(`{BACKEND_URL}/wishlist/${user.id}`);
      const data = await res.json();
      if (res.ok) setWishlist(data.wishlist);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    setMessage('');
    if (!keyword.trim()) return;

    try {
      const res = await fetch(`${BACKEND_URL}/wishlist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.id, keyword, category })
      });
      const data = await res.json();

      if (!res.ok) {
        setMessage(data.error || 'Something went wrong.');
      } else {
        setKeyword('');
        fetchWishlist();
      }
    } catch (err) {
      setMessage('Could not reach the server.');
    }
  };

  const handleRemove = async (id) => {
    try {
      const res = await fetch(`{BACKEND_URL}/wishlist/${id}`, { method: 'DELETE' });
      if (res.ok) fetchWishlist();
    } catch (err) {
      console.error(err);
    }
  };

  if (!user) {
    return (
      <div style={{ maxWidth: '400px', margin: '50px auto', fontFamily: 'sans-serif', textAlign: 'center' }}>
        <p>Please <a href="/login">log in</a> to view your wishlist.</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '500px', margin: '30px auto', fontFamily: 'sans-serif', padding: '0 20px' }}>
      <h2>My Wishlist</h2>
      <p style={{ color: '#666', fontSize: '14px' }}>
        Get notified when a matching item is posted. Enter what you're looking for, e.g. "Calculus Textbook".
      </p>

      <form onSubmit={handleAdd} style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
        <input
          type="text"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="e.g. Calculus Textbook"
          style={{ flex: 1, padding: '8px' }}
        />
        <select value={category} onChange={(e) => setCategory(e.target.value)} style={{ padding: '8px' }}>
          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <button type="submit" style={{ padding: '8px 16px' }}>Add</button>
      </form>

      {message && <p style={{ color: 'red' }}>{message}</p>}

      {loading && <p>Loading...</p>}
      {!loading && wishlist.length === 0 && <p style={{ color: '#999' }}>Your wishlist is empty.</p>}

      {wishlist.map((w) => (
        <div
          key={w.id}
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            border: '1px solid #eee',
            borderRadius: '8px',
            padding: '10px 14px',
            marginBottom: '8px'
          }}
        >
          <div>
            <strong>{w.keyword}</strong>
            {w.category && <span style={{ color: '#666', fontSize: '13px' }}> — {w.category}</span>}
          </div>
          <button onClick={() => handleRemove(w.id)} style={{ cursor: 'pointer', color: 'red', border: 'none', background: 'none' }}>
            Remove
          </button>
        </div>
      ))}
    </div>
  );
}

export default Wishlist;