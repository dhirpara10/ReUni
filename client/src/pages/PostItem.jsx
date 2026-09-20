import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import supabase from '../supabaseClient';
import { BACKEND_URL } from '../config';

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
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const uploadImage = async () => {
    const fileExt = imageFile.name.split('.').pop();
    const fileName = `${user.id}-${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('item-images')
      .upload(fileName, imageFile);

    if (uploadError) throw uploadError;

    const { data } = supabase.storage
      .from('item-images')
      .getPublicUrl(fileName);

    return data.publicUrl;
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
      let image_url = null;

      if (imageFile) {
        try {
          image_url = await uploadImage();
        } catch (uploadErr) {
          setMessage('Image upload failed. Try a different image or post without one.');
          setLoading(false);
          return;
        }
      }

      const res = await fetch(`${BACKEND_URL}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          seller_id: user.id,
          title: formData.title,
          description: formData.description,
          category: formData.category,
          condition: formData.condition,
          exchange_type: formData.exchange_type,
          price: formData.exchange_type === 'Sell' ? parseFloat(formData.price) : null,
          image_url
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
      <div className="page" style={{ textAlign: 'center' }}>
        <p>You must be logged in to post an item.</p>
      </div>
    );
  }

  return (
    <div className="page">
      <h2>Post an Item</h2>
      <form onSubmit={handleSubmit} className="card">
        <div className="field">
          <label>Title</label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            required
            className="input"
          />
        </div>

        <div className="field">
          <label>Description</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={3}
            className="input"
          />
        </div>

        <div className="field">
          <label>Category</label>
          <select name="category" value={formData.category} onChange={handleChange} className="input">
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <div className="field">
          <label>Condition</label>
          <select name="condition" value={formData.condition} onChange={handleChange} className="input">
            {CONDITIONS.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <div className="field">
          <label>Exchange Type</label>
          <select name="exchange_type" value={formData.exchange_type} onChange={handleChange} className="input">
            {EXCHANGE_TYPES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        {formData.exchange_type === 'Sell' && (
          <div className="field">
            <label>Price ($)</label>
            <input
              type="number"
              name="price"
              value={formData.price}
              onChange={handleChange}
              min="0"
              step="0.01"
              required
              className="input"
            />
          </div>
        )}

        <div className="field">
          <label>Photo (optional)</label>
          <input type="file" accept="image/*" onChange={handleImageChange} />
          {imagePreview && (
            <img
              src={imagePreview}
              alt="Preview"
              style={{ width: '100%', maxHeight: '200px', objectFit: 'cover', marginTop: '10px', borderRadius: 'var(--radius)' }}
            />
          )}
        </div>

        <button type="submit" disabled={loading} className="btn btn-primary">
          {loading ? 'Posting...' : 'Publish'}
        </button>
      </form>

      {message && (
        <p className={`msg ${message.startsWith('Item posted') ? '' : 'msg-error'}`}>{message}</p>
      )}
    </div>
  );
}

export default PostItem;