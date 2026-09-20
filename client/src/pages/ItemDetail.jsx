import { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import StatusBadge from '../components/StatusBadge';
import { BACKEND_URL } from '../config';

const EXCHANGE_BADGE = {
  Sell: 'badge-sell',
  Swap: 'badge-swap',
  Giveaway: 'badge-give'
};

function ItemDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const withParam = searchParams.get('with');
  const user = JSON.parse(localStorage.getItem('reuni_user'));

  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);

  const isOwnItem = user && item && user.id === item.seller_id;
  const [otherPartyId, setOtherPartyId] = useState(null);

  useEffect(() => {
    fetchItem();
  }, [id]);

  useEffect(() => {
    if (item && user) {
      if (withParam) {
        setOtherPartyId(withParam);
      } else if (isOwnItem) {
        fetchAllConversationsForSeller();
      } else {
        setOtherPartyId(item.seller_id);
      }
    }
  }, [item, user, withParam]);

  useEffect(() => {
    if (item && user && otherPartyId) {
      fetchMessages(otherPartyId);
    }
  }, [otherPartyId]);

  // Polling: refresh messages every 3 seconds while this page is open
  useEffect(() => {
    if (!otherPartyId) return;

    const interval = setInterval(() => {
      fetchMessages(otherPartyId);
    }, 3000);

    return () => clearInterval(interval);
  }, [otherPartyId]);

  const fetchItem = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${BACKEND_URL}/items/${id}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Item not found.');
      } else {
        setItem(data.item);
      }
    } catch (err) {
      setError('Could not reach the server.');
    } finally {
      setLoading(false);
    }
  };

  // For sellers: find any buyer who has messaged about this item
  const fetchAllConversationsForSeller = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/inbox/${user.id}`);
      const data = await res.json();
      if (res.ok) {
        const relatedMsg = data.messages.find(m => m.item_id === id);
        if (relatedMsg) {
          const buyerId = relatedMsg.sender_id === user.id ? relatedMsg.receiver_id : relatedMsg.sender_id;
          setOtherPartyId(buyerId);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchMessages = async (partyId) => {
    try {
      const res = await fetch(`${BACKEND_URL}/messages/${id}/${user.id}/${partyId}`);
      const data = await res.json();
      if (res.ok) setMessages(data.messages);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !otherPartyId) return;

    setSending(true);
    try {
      const res = await fetch(`${BACKEND_URL}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          item_id: id,
          sender_id: user.id,
          receiver_id: otherPartyId,
          content: newMessage
        })
      });

      if (res.ok) {
        setNewMessage('');
        fetchMessages(otherPartyId);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSending(false);
    }
  };

  if (loading) return <p className="msg" style={{ textAlign: 'center', marginTop: '40px' }}>Loading...</p>;
  if (error) return <p className="msg msg-error" style={{ textAlign: 'center', marginTop: '40px' }}>{error}</p>;
  if (!item) return null;

  return (
    <div className="page">
      <div className="card" style={{ marginBottom: '24px' }}>
        {item.image_url && (
          <img
            src={item.image_url}
            alt={item.title}
            style={{
              width: '100%',
              maxHeight: '300px',
              objectFit: 'cover',
              borderRadius: 'var(--radius)',
              marginBottom: '16px'
            }}
          />
        )}
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {item.title} <StatusBadge status={item.status} />
        </h2>
        <p className="msg" style={{ marginTop: 0 }}>{item.category} · {item.condition}</p>
        <p style={{ fontSize: '18px', fontWeight: 600, marginBottom: '12px' }}>
          {item.exchange_type === 'Sell' ? (
            <span className={`badge ${EXCHANGE_BADGE[item.exchange_type]}`} style={{ fontSize: '16px', padding: '4px 12px' }}>
              ${item.price}
            </span>
          ) : (
            <span className={`badge ${EXCHANGE_BADGE[item.exchange_type]}`} style={{ fontSize: '16px', padding: '4px 12px' }}>
              {item.exchange_type}
            </span>
          )}
        </p>
        <p>{item.description}</p>
        <p className="msg">
          Posted by {item.users?.full_name} ({item.users?.email})
        </p>
      </div>

      {user && isOwnItem && (
        <div style={{ marginBottom: '20px', display: 'flex', gap: '8px' }}>
          <button onClick={() => navigate(`/items/${item.id}/edit`)} className="btn">
            Edit
          </button>
          <button onClick={() => navigate('/my-listings')} className="btn">
            Manage Listing
          </button>
        </div>
      )}

      {!user && <p className="msg">Please <a href="/login">log in</a> to message the seller.</p>}

      {user && isOwnItem && !otherPartyId && (
        <p className="msg">No messages yet on this listing.</p>
      )}

      {user && (isOwnItem ? otherPartyId : true) && (
        <div>
          <h3>{isOwnItem ? 'Conversation' : 'Message Seller'}</h3>

          <div className="card" style={{
            height: '220px',
            overflowY: 'auto',
            marginBottom: '12px',
            padding: '14px'
          }}>
            {messages.length === 0 && <p className="msg" style={{ marginTop: 0 }}>No messages yet. Say hello!</p>}
            {messages.map((msg) => (
              <div key={msg.id} style={{ textAlign: msg.sender_id === user.id ? 'right' : 'left', marginBottom: '8px' }}>
                <span style={{
                  display: 'inline-block',
                  padding: '7px 13px',
                  borderRadius: 'var(--radius)',
                  backgroundColor: msg.sender_id === user.id ? 'var(--accent-sell)' : 'var(--bg)',
                  color: msg.sender_id === user.id ? '#1A1300' : 'var(--text)',
                  border: msg.sender_id === user.id ? 'none' : '1px solid var(--border)',
                  maxWidth: '80%',
                  fontSize: '14px'
                }}>
                  {msg.content}
                </span>
              </div>
            ))}
          </div>

          <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: '8px' }}>
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              className="input"
              style={{ flex: 1 }}
            />
            <button type="submit" disabled={sending} className="btn btn-primary">
              Send
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

export default ItemDetail;import { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import StatusBadge from '../components/StatusBadge';
import { BACKEND_URL } from '../config';

const EXCHANGE_BADGE = {
  Sell: 'badge-sell',
  Swap: 'badge-swap',
  Giveaway: 'badge-give'
};

function ItemDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const withParam = searchParams.get('with');
  const user = JSON.parse(localStorage.getItem('reuni_user'));

  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);

  const isOwnItem = user && item && user.id === item.seller_id;
  const [otherPartyId, setOtherPartyId] = useState(null);

  useEffect(() => {
    fetchItem();
  }, [id]);

  useEffect(() => {
    if (item && user) {
      if (withParam) {
        setOtherPartyId(withParam);
      } else if (isOwnItem) {
        fetchAllConversationsForSeller();
      } else {
        setOtherPartyId(item.seller_id);
      }
    }
  }, [item, user, withParam]);

  useEffect(() => {
    if (item && user && otherPartyId) {
      fetchMessages(otherPartyId);
    }
  }, [otherPartyId]);

  // Polling: refresh messages every 3 seconds while this page is open
  useEffect(() => {
    if (!otherPartyId) return;

    const interval = setInterval(() => {
      fetchMessages(otherPartyId);
    }, 3000);

    return () => clearInterval(interval);
  }, [otherPartyId]);

  const fetchItem = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${BACKEND_URL}/items/${id}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Item not found.');
      } else {
        setItem(data.item);
      }
    } catch (err) {
      setError('Could not reach the server.');
    } finally {
      setLoading(false);
    }
  };

  // For sellers: find any buyer who has messaged about this item
  const fetchAllConversationsForSeller = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/inbox/${user.id}`);
      const data = await res.json();
      if (res.ok) {
        const relatedMsg = data.messages.find(m => m.item_id === id);
        if (relatedMsg) {
          const buyerId = relatedMsg.sender_id === user.id ? relatedMsg.receiver_id : relatedMsg.sender_id;
          setOtherPartyId(buyerId);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchMessages = async (partyId) => {
    try {
      const res = await fetch(`${BACKEND_URL}/messages/${id}/${user.id}/${partyId}`);
      const data = await res.json();
      if (res.ok) setMessages(data.messages);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !otherPartyId) return;

    setSending(true);
    try {
      const res = await fetch(`${BACKEND_URL}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          item_id: id,
          sender_id: user.id,
          receiver_id: otherPartyId,
          content: newMessage
        })
      });

      if (res.ok) {
        setNewMessage('');
        fetchMessages(otherPartyId);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSending(false);
    }
  };

  if (loading) return <p className="msg" style={{ textAlign: 'center', marginTop: '40px' }}>Loading...</p>;
  if (error) return <p className="msg msg-error" style={{ textAlign: 'center', marginTop: '40px' }}>{error}</p>;
  if (!item) return null;

  return (
    <div className="page">
      <div className="card" style={{ marginBottom: '24px' }}>
        {item.image_url && (
          <img
            src={item.image_url}
            alt={item.title}
            style={{
              width: '100%',
              maxHeight: '300px',
              objectFit: 'cover',
              borderRadius: 'var(--radius)',
              marginBottom: '16px'
            }}
          />
        )}
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {item.title} <StatusBadge status={item.status} />
        </h2>
        <p className="msg" style={{ marginTop: 0 }}>{item.category} · {item.condition}</p>
        <p style={{ fontSize: '18px', fontWeight: 600, marginBottom: '12px' }}>
          {item.exchange_type === 'Sell' ? (
            <span className={`badge ${EXCHANGE_BADGE[item.exchange_type]}`} style={{ fontSize: '16px', padding: '4px 12px' }}>
              ${item.price}
            </span>
          ) : (
            <span className={`badge ${EXCHANGE_BADGE[item.exchange_type]}`} style={{ fontSize: '16px', padding: '4px 12px' }}>
              {item.exchange_type}
            </span>
          )}
        </p>
        <p>{item.description}</p>
        <p className="msg">
          Posted by {item.users?.full_name} ({item.users?.email})
        </p>
      </div>

      {user && isOwnItem && (
        <div style={{ marginBottom: '20px', display: 'flex', gap: '8px' }}>
          <button onClick={() => navigate(`/items/${item.id}/edit`)} className="btn">
            Edit
          </button>
          <button onClick={() => navigate('/my-listings')} className="btn">
            Manage Listing
          </button>
        </div>
      )}

      {!user && <p className="msg">Please <a href="/login">log in</a> to message the seller.</p>}

      {user && isOwnItem && !otherPartyId && (
        <p className="msg">No messages yet on this listing.</p>
      )}

      {user && (isOwnItem ? otherPartyId : true) && (
        <div>
          <h3>{isOwnItem ? 'Conversation' : 'Message Seller'}</h3>

          <div className="card" style={{
            height: '220px',
            overflowY: 'auto',
            marginBottom: '12px',
            padding: '14px'
          }}>
            {messages.length === 0 && <p className="msg" style={{ marginTop: 0 }}>No messages yet. Say hello!</p>}
            {messages.map((msg) => (
              <div key={msg.id} style={{ textAlign: msg.sender_id === user.id ? 'right' : 'left', marginBottom: '8px' }}>
                <span style={{
                  display: 'inline-block',
                  padding: '7px 13px',
                  borderRadius: 'var(--radius)',
                  backgroundColor: msg.sender_id === user.id ? 'var(--accent-sell)' : 'var(--bg)',
                  color: msg.sender_id === user.id ? '#1A1300' : 'var(--text)',
                  border: msg.sender_id === user.id ? 'none' : '1px solid var(--border)',
                  maxWidth: '80%',
                  fontSize: '14px'
                }}>
                  {msg.content}
                </span>
              </div>
            ))}
          </div>

          <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: '8px' }}>
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              className="input"
              style={{ flex: 1 }}
            />
            <button type="submit" disabled={sending} className="btn btn-primary">
              Send
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

export default ItemDetail;