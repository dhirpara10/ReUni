import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import supabase from '../supabaseClient';
import { BACKEND_URL } from '../config';

const CATEGORIES = ['Books', 'Furniture', 'Electronics', 'Stationery', 'Other'];
const CONDITIONS = ['New', 'Good', 'Fair', 'Worn'];
const EXCHANGE_TYPES = ['Sell', 'Swap', 'Giveaway'];

function EditItem() {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('reuni_user'));

  const [formData, setFormData] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchItem();
  }, [id]);

  const fetchItem = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/items/${id}`);
      const data = await res.json();
      if (!res.ok) {
        setMessage(data.error || 'Item not found.');
      } else {
        if (data.item.seller_id !== user?.id) {
          setMessage('You can only edit your own listings.');
          return;
        }
        setFormData({
          title: data.item.title,
          description: data.item.description || '',
          category: data.item.category,
          condition: data.item.condition,
          exchange_type: data.item.exchange_type,
          price: data.item.price || ''
        });
        setImagePreview(data.item.image_url);
      }
    } catch (err) {
      setMessage('Could not reach the server.');
    } finally {
      setLoading(false);
    }
  };

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

    const { data } = supabase.storage.from('item-images').getPublicUrl(fileName);
    return data.publicUrl;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');

    try {
      let image_url;

      if (imageFile) {
        try {
          image_url = await uploadImage();
        } catch (uploadErr) {
          setMessage('Image upload failed. Try again or keep the existing image.');
          setSaving(false);
          return;
        }
      }

      const body = {
        seller_id: user.id,
        title: formData.title,
        description: formData.description,
        category: formData.category,
        condition: formData.condition,
        exchange_type: formData.exchange_type,
        price: formData.exchange_type === 'Sell' ? parseFloat(formData.price) : null
      };
      if (image_url) body.image_url = image_url;

      const res = await fetch(`${BACKEND_URL}/items/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage(data.error || 'Something went wrong.');
      } else {
        setMessage('Item updated!');
        setTimeout(() => navigate('/my-listings'), 800);
      }
    } catch (err) {
      setMessage('Could not reach the server.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className="msg" style={{ textAlign: 'center', marginTop: '40px' }}>Loading...</p>;
  if (!formData) return <p className="msg msg-error" style={{ textAlign: 'center', marginTop: '40px' }}>{message}</p>;

  return (
    <div className="page">
      <h2>Edit Item</h2>
      <form onSubmit={handleSubmit} className="card">
        <div className="field">
          <label>Title</label>
          <input type="text" name="title" value={formData.title} onChange={handleChange} required className="input" />
        </div>

        <div className="field">
          <label>Description</label>
          <textarea name="description" value={formData.description} onChange={handleChange} rows={3} className="input" />
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
            <input type="number" name="price" value={formData.price} onChange={handleChange} min="0" step="0.01" required className="input" />
          </div>
        )}

        <div className="field">
          <label>Photo</label>
          <input type="file" accept="image/*" onChange={handleImageChange} />
          {imagePreview && (
            <img src={imagePreview} alt="Preview" style={{ width: '100%', maxHeight: '200px', objectFit: 'cover', marginTop: '10px', borderRadius: 'var(--radius)' }} />
          )}
        </div>

        <button type="submit" disabled={saving} className="btn btn-primary">
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </form>

      {message && (
        <p className={`msg ${message.startsWith('Item updated') ? '' : 'msg-error'}`}>{message}</p>
      )}
    </div>
  );
}

export default EditItem;