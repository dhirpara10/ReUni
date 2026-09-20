import { BrowserRouter, Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Signup from './pages/Signup';
import Login from './pages/Login';
import Browse from './pages/Browse';
import PostItem from './pages/PostItem';
import ItemDetail from './pages/ItemDetail';
import Wishlist from './pages/Wishlist';
import Inbox from './pages/Inbox';
import MyListings from './pages/MyListings';
import EditItem from './pages/EditItem';

function Nav() {
  const navigate = useNavigate();
  const location = useLocation();
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

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="nav">
      <div className="nav-left">
        <Link to="/browse" className="nav-brand">ReUni</Link>
        <Link to="/browse" className={`nav-link ${isActive('/browse') ? 'active' : ''}`}>Browse</Link>
        {user && (
          <Link to="/wishlist" className={`nav-link ${isActive('/wishlist') ? 'active' : ''}`}>Wishlist</Link>
        )}
        {user && (
          <Link to="/inbox" className={`nav-link ${isActive('/inbox') ? 'active' : ''}`}>Inbox</Link>
        )}
        {user && (
          <Link to="/my-listings" className={`nav-link ${isActive('/my-listings') ? 'active' : ''}`}>My Listings</Link>
        )}
      </div>

      <div className="nav-right">
        {user && (
          <Link to="/post" className="btn btn-primary" style={{ fontSize: '13px', padding: '8px 14px' }}>
            Post Item
          </Link>
        )}

        {!user && (
          <>
            <Link to="/signup" className="nav-link">Sign Up</Link>
            <Link to="/login" className="nav-link">Log In</Link>
          </>
        )}

        {user && (
          <>
            <span className="nav-greeting">Hi, {user.full_name}</span>
            <button onClick={handleLogout} className="btn">Log Out</button>
          </>
        )}
      </div>
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
        <Route path="/inbox" element={<Inbox />} />
        <Route path="/" element={<Browse />} />
        <Route path="/my-listings" element={<MyListings />} />
        <Route path="/items/:id/edit" element={<EditItem />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;