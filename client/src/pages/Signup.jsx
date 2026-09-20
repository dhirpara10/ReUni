import { useState } from 'react';
import { BACKEND_URL } from '../config';

function Signup() {
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    password: ''
  });
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const res = await fetch(`${BACKEND_URL}/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage(data.error || 'Something went wrong.');
      } else {
        setMessage('Account created! Check your email to verify your account.');
        setFormData({ full_name: '', email: '', password: '' });
      }
    } catch (err) {
      setMessage('Could not reach the server.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <h2>Create your ReUni account</h2>
      <form onSubmit={handleSubmit} className="card">
        <div className="field">
          <label>Full Name</label>
          <input
            type="text"
            name="full_name"
            value={formData.full_name}
            onChange={handleChange}
            required
            className="input"
          />
        </div>

        <div className="field">
          <label>University Email</label>
          <input
            type="email"
            name="email"
            placeholder="yourid@my.holmes.edu.au"
            value={formData.email}
            onChange={handleChange}
            required
            className="input"
          />
        </div>

        <div className="field">
          <label>Password</label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
            className="input"
          />
        </div>

        <button type="submit" disabled={loading} className="btn btn-primary">
          {loading ? 'Creating account...' : 'Create Account'}
        </button>
      </form>

      {message && (
        <p className={`msg ${message.startsWith('Account created') ? '' : 'msg-error'}`}>
          {message}
        </p>
      )}
    </div>
  );
}

export default Signup;