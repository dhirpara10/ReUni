import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';

function ItemDetail() {
  const { id } = useParams();
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
      if (isOwnItem) {
        fetchAllConversationsForSeller();
      } else {
        setOtherPartyId(item.seller_id);
      }
    }
  }, [item, user]);

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
      const res = await fetch(`http://localhost:5001/items/${id}`);
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
      const res = await fetch(`http://localhost:5001/inbox/${user.id}`);
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
      const res = await fetch(`http://localhost:5001/messages/${id}/${user.id}/${partyId}`);
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
      const res = await fetch('http://localhost:5001/messages', {
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

  if (loading) return <p style={{ textAlign: 'center', marginTop: '40px' }}>Loading...</p>;
  if (error) return <p style={{ textAlign: 'center', marginTop: '40px', color: 'red' }}>{error}</p>;
  if (!item) return null;

  return (
    <div style={{ maxWidth: '600px', margin: '30px auto', fontFamily: 'sans-serif', padding: '0 20px' }}>
      <div style={{ border: '1px solid #ccc', borderRadius: '8px', padding: '20px', marginBottom: '24px' }}>
        <h2 style={{ marginTop: 0 }}>{item.title}</h2>
        <p style={{ color: '#666' }}>{item.category} · {item.condition}</p>
        <p style={{ fontWeight: 'bold', fontSize: '18px' }}>
          {item.exchange_type === 'Sell' ? `$${item.price}` : item.exchange_type}
        </p>
        <p>{item.description}</p>
        <p style={{ fontSize: '13px', color: '#999' }}>
          Posted by {item.users?.full_name} ({item.users?.email})
        </p>
      </div>

      {!user && <p>Please <a href="/login">log in</a> to message the seller.</p>}

      {user && isOwnItem && !otherPartyId && (
        <p style={{ color: '#666' }}>No messages yet on this listing.</p>
      )}

      {user && (isOwnItem ? otherPartyId : true) && (
        <div>
          <h3>{isOwnItem ? 'Conversation' : 'Message Seller'}</h3>

          <div style={{
            border: '1px solid #eee',
            borderRadius: '8px',
            padding: '12px',
            height: '200px',
            overflowY: 'auto',
            marginBottom: '12px',
            backgroundColor: '#fafafa'
          }}>
            {messages.length === 0 && <p style={{ color: '#999' }}>No messages yet. Say hello!</p>}
            {messages.map((msg) => (
              <div key={msg.id} style={{ textAlign: msg.sender_id === user.id ? 'right' : 'left', marginBottom: '8px' }}>
                <span style={{
                  display: 'inline-block',
                  padding: '6px 12px',
                  borderRadius: '12px',
                  backgroundColor: msg.sender_id === user.id ? '#333' : '#e0e0e0',
                  color: msg.sender_id === user.id ? '#fff' : '#000',
                  maxWidth: '80%'
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
              style={{ flex: 1, padding: '8px' }}
            />
            <button type="submit" disabled={sending} style={{ padding: '8px 16px' }}>
              Send
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

export default ItemDetail;