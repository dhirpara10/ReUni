import { useState } from 'react';
import { BACKEND_URL } from '../config';

function Login() {
  const [formData, setFormData] = useState({ email: '', password: '' });
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
      const res = await fetch(`${BACKEND_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage(data.error || 'Something went wrong.');
      } else {
        setMessage(`Welcome back, ${data.user.full_name}!`);
        localStorage.setItem('reuni_user', JSON.stringify(data.user));
        window.location.href = '/browse';
      }
    } catch (err) {
      setMessage('Could not reach the server.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <h2>Log in to ReUni</h2>
      <form onSubmit={handleSubmit} className="card">
        <div className="field">
          <label>University Email</label>
          <input
            type="email"
            name="email"
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
          {loading ? 'Logging in...' : 'Log In'}
        </button>
      </form>

      {message && (
        <p className={`msg ${message.toLowerCase().includes('welcome') ? '' : 'msg-error'}`}>
          {message}
        </p>
      )}
    </div>
  );
}

export default Login;