import { BrowserRouter, Routes, Route, Link, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Signup from './pages/Signup';
import Login from './pages/Login';
import Browse from './pages/Browse';
import PostItem from './pages/PostItem';
import ItemDetail from './pages/ItemDetail';
import Wishlist from './pages/Wishlist';

function Nav() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const stored = localStorage.getItem('reuni_user');
    if (stored) setUser(JSON.parse(stored));
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('reuni_user');
    setUser(null);
    navigate('/login');
  };

  return (
    <nav style={{ padding: '20px', textAlign: 'center', fontFamily: 'sans-serif' }}>
      <Link to="/browse" style={{ marginRight: '20px' }}>Browse Items</Link>
      {user && <Link to="/post" style={{ marginRight: '20px' }}>Post Item</Link>}
      {user && <Link to="/wishlist" style={{ marginRight: '20px' }}>Wishlist</Link>}

      {!user && (
        <>
          <Link to="/signup" style={{ marginRight: '20px' }}>Sign Up</Link>
          <Link to="/login">Log In</Link>
        </>
      )}

      {user && (
        <>
          <span style={{ marginRight: '20px' }}>Hi, {user.full_name}</span>
          <button onClick={handleLogout} style={{ cursor: 'pointer' }}>Log Out</button>
        </>
      )}
    </nav>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Nav />
      <Routes>
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />
        <Route path="/browse" element={<Browse />} />
        <Route path="/post" element={<PostItem />} />
        <Route path="/items/:id" element={<ItemDetail />} />
        <Route path="/wishlist" element={<Wishlist />} />
        <Route path="/" element={<Browse />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
