import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; 
import { BACKEND_URL } from '../config';
function Inbox() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('reuni_user'));

  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) return;
    fetchInbox();

    const interval = setInterval(fetchInbox, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchInbox = async () => {
    try {
      const res = await fetch(`{BACKEND_URL}/inbox/${user.id}`);
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to load inbox.');
        setLoading(false);
        return;
      }

      // Group the flat message list into one row per (item, other person) conversation,
      // keeping only the most recent message in each
      const grouped = {};

      data.messages.forEach((msg) => {
        const otherPartyId = msg.sender_id === user.id ? msg.receiver_id : msg.sender_id;
        const otherPartyName = msg.sender_id === user.id
          ? msg.receiver?.full_name
          : msg.sender?.full_name;
        const key = `${msg.item_id}_${otherPartyId}`;

        if (!grouped[key] || new Date(msg.created_at) > new Date(grouped[key].created_at)) {
          grouped[key] = {
            itemId: msg.item_id,
            itemTitle: msg.items?.title || 'Untitled item',
            otherPartyId,
            otherPartyName: otherPartyName || 'Unknown',
            lastMessage: msg.content,
            created_at: msg.created_at
          };
        }
      });

      const list = Object.values(grouped).sort(
        (a, b) => new Date(b.created_at) - new Date(a.created_at)
      );

      setConversations(list);
      setError('');
    } catch (err) {
      setError('Could not reach the server.');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div style={{ maxWidth: '400px', margin: '50px auto', fontFamily: 'sans-serif', textAlign: 'center' }}>
        <p>Please <a href="/login">log in</a> to view your inbox.</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '600px', margin: '30px auto', fontFamily: 'sans-serif', padding: '0 20px' }}>
      <h2>Inbox</h2>

      {loading && <p>Loading conversations...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {!loading && conversations.length === 0 && <p style={{ color: '#666' }}>No conversations yet.</p>}

      <div>
        {conversations.map((conv) => (
          <div
            key={`${conv.itemId}_${conv.otherPartyId}`}
            onClick={() => navigate(`/items/${conv.itemId}?with=${conv.otherPartyId}`)}
            style={{
              border: '1px solid #eee',
              borderRadius: '8px',
              padding: '14px',
              marginBottom: '10px',
              cursor: 'pointer',
              backgroundColor: '#fafafa'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <strong>{conv.itemTitle}</strong>
              <span style={{ fontSize: '12px', color: '#999' }}>
                {new Date(conv.created_at).toLocaleString()}
              </span>
            </div>
            <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: '#666' }}>
              With {conv.otherPartyName}
            </p>
            <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: '#333' }}>
              {conv.lastMessage.length > 60 ? conv.lastMessage.slice(0, 60) + '…' : conv.lastMessage}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Inbox;