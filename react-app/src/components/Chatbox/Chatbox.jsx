import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Chatbox() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [webSocket, setWebSocket] = useState(null);
  const [data, setData] = useState(null);

  useEffect(() => {
    const ws = new WebSocket('wss://your-websocket-api-url');
    setWebSocket(ws);

    ws.onmessage = (event) => {
      const messageData = JSON.parse(event.data);
      setMessages((prev) => [...prev, messageData]);
    };

    ws.onclose = () => {
      console.log('Disconnected from WebSocket');
    };

    return () => {
      ws.close();
    };
  }, []);

  const fetchUserInfo = async () => {
    try {
      const response = await fetch("/api/me");
      if (response.ok) {
        const data = await response.json();
        setUser(data.userInfo);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error("Error fetching user info:", error);
    }
  };

  useEffect(() => {
    fetchUserInfo();
  }, []);

  const sendMessage = () => {
    if (!inputMessage.trim()) return;

    const message = {
      action: 'sendMessage',
      sender: 'Customer',
      message: inputMessage,
    };

    webSocket.send(JSON.stringify(message));
    setInputMessage('');
  };

  return (
    <div>
      {/* Chatbox Icon */}
      <div
        className="fixed bottom-4 right-4 p-3 rounded-full shadow-lg cursor-pointer transition-all"
        onClick={() => setIsOpen(!isOpen)}
        title="Chat with us"
        style={{ background: 'var(--accent-amber)', color: '#081018' }}
      >
        💬
      </div>

      {/* Chat Window */}
      {isOpen && data && (
        <div className="fixed bottom-16 right-4 w-80 bg-white shadow-lg rounded-lg">
          <div className="relative p-3 rounded-t-lg" style={{ background: 'var(--brand-deep)', color: '#ffffff' }}>
            <h2 className="text-lg font-bold">Chat with Admin</h2>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white absolute top-2 right-2 font-bold"
            >
              ✕
            </button>
          </div>
          <div className="p-4 h-64 overflow-y-auto space-y-2 bg-white">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`p-2 rounded-lg ${msg.sender === 'Admin' ? 'bg-[#FBF8F3] border border-[#E6D8C3]' : 'bg-[#fff7ed] border border-[#FFE6BF]'} `}
              >
                <p className="text-sm">
                  <strong>{msg.sender}:</strong> {msg.message}
                </p>
              </div>
            ))}
          </div>
          <div className="p-3 border-t border-gray-200 bg-white">
            <input
              type="text"
              placeholder="Type your message..."
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              className="w-full p-2 border rounded-lg"
              style={{ borderColor: 'rgba(15,76,76,0.12)' }}
              onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
            />
            <button
              onClick={sendMessage}
              className="mt-2 w-full py-2 rounded-lg"
              style={{ background: 'var(--accent-amber)', color: '#081018' }}
            >
              Send
            </button>
          </div>
        </div>
      )}
      {isOpen && !data && (
        <div className="fixed bottom-16 right-4 w-80 bg-white shadow-lg rounded-lg">
          <div className="relative p-3 rounded-t-lg" style={{ background: 'var(--brand-deep)', color: '#ffffff' }}>
            <h2 className="text-lg font-bold">Chat with Admin</h2>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white absolute top-2 right-2 font-bold"
            >
              ✕
            </button>
          </div>
          <div className="p-4 h-64 overflow-y-auto space-y-2">Coming soon</div>
        </div>
      )}
    </div>
  );
}
