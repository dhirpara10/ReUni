import { useState, useEffect } from 'react';
import { BACKEND_URL } from '../config';

const CATEGORIES = ['Books', 'Furniture', 'Electronics', 'Stationery', 'Other'];

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
      const res = await fetch(`${BACKEND_URL}/wishlist/${user.id}`);
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
      const res = await fetch(`${BACKEND_URL}/wishlist/${id}`, { method: 'DELETE' });
      if (res.ok) fetchWishlist();
    } catch (err) {
      console.error(err);
    }
  };

  if (!user) {
    return (
      <div className="page" style={{ textAlign: 'center' }}>
        <p>Please <a href="/login">log in</a> to view your wishlist.</p>
      </div>
    );
  }

  return (
    <div className="page">
      <h2>My Wishlist</h2>
      <p className="msg" style={{ marginTop: 0, marginBottom: '20px' }}>
        Get notified when a matching item is posted. Enter what you're looking for, e.g. "Calculus Textbook".
      </p>

      <form onSubmit={handleAdd} style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
        <input
          type="text"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="e.g. Calculus Textbook"
          className="input"
          style={{ flex: 1 }}
        />
        <select value={category} onChange={(e) => setCategory(e.target.value)} className="input" style={{ width: 'auto' }}>
          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <button type="submit" className="btn btn-primary">Add</button>
      </form>

      {message && <p className="msg msg-error">{message}</p>}

      {loading && <p className="msg">Loading...</p>}
      {!loading && wishlist.length === 0 && <p className="msg">Your wishlist is empty.</p>}

      {wishlist.map((w) => (
        <div
          key={w.id}
          className="card"
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '12px 16px',
            marginBottom: '8px'
          }}
        >
          <div>
            <strong>{w.keyword}</strong>
            {w.category && <span className="msg" style={{ marginTop: 0, marginLeft: '8px', display: 'inline' }}>— {w.category}</span>}
          </div>
          <button onClick={() => handleRemove(w.id)} className="btn btn-danger" style={{ background: 'none', border: 'none' }}>
            Remove
          </button>
        </div>
      ))}
    </div>
  );
}

export default Wishlist;