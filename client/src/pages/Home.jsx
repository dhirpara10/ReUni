import { Link } from 'react-router-dom';

function Home() {
  const user = JSON.parse(localStorage.getItem('reuni_user'));

  return (
    <div className="page-wide">
      <div style={{ padding: '40px 0 60px 0' }}>
        <h1 style={{ fontSize: '38px', maxWidth: '600px', marginBottom: '16px' }}>
          Buy, sell, and swap with people on your own campus
        </h1>
        <p style={{ fontSize: '16px', color: 'var(--text-muted)', maxWidth: '480px', marginBottom: '28px' }}>
          ReUni is a secondhand marketplace for Holmes Institute students. List textbooks,
          furniture, and gear you no longer need — or find what you're after from someone
          down the hall, verified with a campus email.
        </p>

        <div style={{ display: 'flex', gap: '12px' }}>
          <Link to="/browse" className="btn btn-primary">Browse Items</Link>
          {!user && <Link to="/signup" className="btn">Sign Up</Link>}
          {user && <Link to="/post" className="btn">Post an Item</Link>}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '20px' }}>
        <div className="card" style={{ borderLeft: '3px solid var(--accent-sell)' }}>
          <span className="badge badge-sell" style={{ marginBottom: '10px' }}>Sell</span>
          <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-muted)' }}>
            Set a price and get paid directly by the buyer when you hand it over.
          </p>
        </div>

        <div className="card" style={{ borderLeft: '3px solid var(--accent-swap)' }}>
          <span className="badge badge-swap" style={{ marginBottom: '10px' }}>Swap</span>
          <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-muted)' }}>
            Trade something you have for something you need — no cash involved.
          </p>
        </div>

        <div className="card" style={{ borderLeft: '3px solid var(--accent-give)' }}>
          <span className="badge badge-give" style={{ marginBottom: '10px' }}>Giveaway</span>
          <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-muted)' }}>
            Pass something on for free instead of throwing it out at the end of semester.
          </p>
        </div>
      </div>

      <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
        Every account is verified with a @my.holmes.edu.au email, so you're only dealing with other students.
      </p>
    </div>
  );
}

export default Home;