import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import supabase from '../supabaseClient';

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
      const res = await fetch(`{process.env.BACKEND_URL}/items/${id}`);
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

      const res = await fetch(`{process.env.BACKEND_URL}/items/${id}`, {
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

  if (loading) return <p style={{ textAlign: 'center', marginTop: '40px' }}>Loading...</p>;
  if (!formData) return <p style={{ textAlign: 'center', marginTop: '40px', color: 'red' }}>{message}</p>;

  return (
    <div style={{ maxWidth: '500px', margin: '30px auto', fontFamily: 'sans-serif', padding: '0 20px' }}>
      <h2>Edit Item</h2>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '12px' }}>
          <label>Title</label><br />
          <input type="text" name="title" value={formData.title} onChange={handleChange} required style={{ width: '100%', padding: '8px' }} />
        </div>

        <div style={{ marginBottom: '12px' }}>
          <label>Description</label><br />
          <textarea name="description" value={formData.description} onChange={handleChange} rows={3} style={{ width: '100%', padding: '8px' }} />
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
            <input type="number" name="price" value={formData.price} onChange={handleChange} min="0" step="0.01" required style={{ width: '100%', padding: '8px' }} />
          </div>
        )}

        <div style={{ marginBottom: '12px' }}>
          <label>Photo</label><br />
          <input type="file" accept="image/*" onChange={handleImageChange} />
          {imagePreview && (
            <img src={imagePreview} alt="Preview" style={{ width: '100%', maxHeight: '200px', objectFit: 'cover', marginTop: '8px', borderRadius: '8px' }} />
          )}
        </div>

        <button type="submit" disabled={saving} style={{ padding: '10px 20px' }}>
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </form>

      {message && <p style={{ marginTop: '15px' }}>{message}</p>}
    </div>
  );
}

export default EditItem;