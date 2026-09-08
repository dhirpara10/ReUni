import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import Signup from './pages/Signup';
import Login from './pages/Login';
import Browse from './pages/Browse';
import PostItem from './pages/PostItem';
import ItemDetail from './pages/ItemDetail';

function App() {
  return (
    <BrowserRouter>
      <nav style={{ padding: '20px', textAlign: 'center', fontFamily: 'sans-serif' }}>
        <Link to="/signup" style={{ marginRight: '20px' }}>Sign Up</Link>
        <Link to="/login" style={{ marginRight: '20px' }}>Log In</Link>
        <Link to="/browse" style={{ marginRight: '20px' }}>Browse Items</Link>
        <Link to="/post">Post Item</Link>
      </nav>

      <Routes>
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />
        <Route path="/browse" element={<Browse />} />
        <Route path="/post" element={<PostItem />} />
        <Route path="/items/:id" element={<ItemDetail />} />
        <Route path="/" element={<Browse />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;