import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const CATEGORIES = ['Books', 'Furniture', 'Electronics', 'Stationery', 'Other'];
const CONDITIONS = ['New', 'Good', 'Fair', 'Worn'];
const EXCHANGE_TYPES = ['Sell', 'Swap', 'Giveaway'];

function PostItem() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('reuni_user'));

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'Books',
    condition: 'Good',
    exchange_type: 'Sell',
    price: ''
  });
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!user) {
      setMessage('You must be logged in to post an item.');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const res = await fetch('http://localhost:5001/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          seller_id: user.id,
          title: formData.title,
          description: formData.description,
          category: formData.category,
          condition: formData.condition,
          exchange_type: formData.exchange_type,
          price: formData.exchange_type === 'Sell' ? parseFloat(formData.price) : null
        })
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage(data.error || 'Something went wrong.');
      } else {
        setMessage('Item posted successfully!');
        setTimeout(() => navigate('/browse'), 1000);
      }
    } catch (err) {
      setMessage('Could not reach the server.');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div style={{ maxWidth: '400px', margin: '50px auto', fontFamily: 'sans-serif', textAlign: 'center' }}>
        <p>You must be logged in to post an item.</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '500px', margin: '30px auto', fontFamily: 'sans-serif', padding: '0 20px' }}>
      <h2>Post an Item</h2>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '12px' }}>
          <label>Title</label><br />
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            required
            style={{ width: '100%', padding: '8px' }}
          />
        </div>

        <div style={{ marginBottom: '12px' }}>
          <label>Description</label><br />
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={3}
            style={{ width: '100%', padding: '8px' }}
          />
        </div>

        <div style={{ marginBottom: '12px' }}>
          <label>Category</label><br />
          <select name="category" value={formData.category} onChange={handleChange} style={{ width: '100%', padding: '8px' }}>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <div style={{ marginBottom: '12px' }}>
          <label>Condition</label><br />
          <select name="condition" value={formData.condition} onChange={handleChange} style={{ width: '100%', padding: '8px' }}>
            {CONDITIONS.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <div style={{ marginBottom: '12px' }}>
          <label>Exchange Type</label><br />
          <select name="exchange_type" value={formData.exchange_type} onChange={handleChange} style={{ width: '100%', padding: '8px' }}>
            {EXCHANGE_TYPES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        {formData.exchange_type === 'Sell' && (
          <div style={{ marginBottom: '12px' }}>
            <label>Price ($)</label><br />
            <input
              type="number"
              name="price"
              value={formData.price}
              onChange={handleChange}
              min="0"
              step="0.01"
              required
              style={{ width: '100%', padding: '8px' }}
            />
          </div>
        )}

        <button type="submit" disabled={loading} style={{ padding: '10px 20px' }}>
          {loading ? 'Posting...' : 'Publish'}
        </button>
      </form>

      {message && <p style={{ marginTop: '15px' }}>{message}</p>}
    </div>
  );
}

export default PostItem;