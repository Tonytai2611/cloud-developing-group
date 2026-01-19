import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  MoreVertical,
  Search,
  Phone,
  Video,
  Send,
  ArrowLeft,
  Home,
  Trash2,
  Bell
} from "lucide-react";
import AdminHeader from "../../components/application_component/AdminHeader";
import { useAuth } from '../../hooks/useAuth';

// Helper for notifications
const Notification = ({ message, onClose }) => (
  <div className="fixed top-20 right-4 bg-white border-l-4 border-teal-500 shadow-lg rounded-lg p-4 max-w-sm animate-in slide-in-from-right z-50 flex items-start gap-3">
    <div className="bg-teal-100 p-2 rounded-full text-teal-600">
      <Bell size={20} />
    </div>
    <div className="flex-1">
      <h4 className="font-bold text-gray-800 text-sm">New Message</h4>
      <p className="text-gray-600 text-sm mt-1">{message}</p>
    </div>
    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">×</button>
  </div>
);

const AdminChatWithUsers = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [selectedUser, setSelectedUser] = useState(null);
  const [users, setUsers] = useState([]); // Dynamic list of users
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [ws, setWs] = useState(null);
  const [adminEmail, setAdminEmail] = useState(null); // Will be fetched from cookie
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [notification, setNotification] = useState(null);

  const messagesEndRef = useRef(null);
  const WS_URL = "wss://juz9ngh3u7.execute-api.us-east-1.amazonaws.com/production";

  // localStorage key for persisting conversations
  const STORAGE_KEY = 'admin_chat_conversations';

  // Load conversations from localStorage on mount (before WebSocket connects)
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const savedUsers = JSON.parse(saved);
        console.log('Loaded', savedUsers.length, 'conversations from localStorage');
        setUsers(savedUsers);
      } catch (e) {
        console.error('Failed to load saved conversations:', e);
      }
    }
  }, []);

  // Save conversations to localStorage whenever they change
  useEffect(() => {
    if (users.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
      console.log('Saved', users.length, 'conversations to localStorage');
    }
  }, [users]);

  // Format timestamp to local Vietnam time
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '';
    // Add Z suffix if missing to ensure UTC parsing
    let ts = timestamp;
    if (!ts.endsWith('Z') && !ts.includes('+')) {
      ts = ts + 'Z';
    }
    const date = new Date(ts);
    return date.toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  // Show notification helper
  const showNotification = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  // Get admin email from AuthProvider
  useEffect(() => {
    if (user?.email || user?.username) {
      const email = user.email || user.username;
      console.log('Admin email from AuthProvider:', email);
      setAdminEmail(email);
    } else {
      console.error("Not authenticated");
      navigate('/');
    }
  }, [user, navigate]);

  // Connect WebSocket after adminEmail is loaded
  useEffect(() => {
    if (!adminEmail) return; // Wait for admin email

    const connectWebSocket = () => {
      try {
        console.log('Connecting WebSocket as admin:', adminEmail);
        const socket = new WebSocket(`${WS_URL}?userId=${adminEmail}&role=admin`);

        socket.onopen = () => {
          console.log('WebSocket connected');
          setIsConnected(true);
          setWs(socket);
          setLoading(false);

          // Fetch conversation history (users who have chatted before)
          console.log('Fetching conversations for admin:', adminEmail);
          socket.send(JSON.stringify({
            action: 'getConversations',
            adminEmail: adminEmail
          }));

          // Also fetch online customers
          socket.send(JSON.stringify({
            action: 'getUsers',
            role: 'customer'
          }));
        };

        socket.onmessage = (event) => {
          const data = JSON.parse(event.data);
          console.log('Received:', data.type, data);

          if (data.type === 'conversationList') {
            console.log('Got conversation list:', data.conversations?.length || 0, 'conversations');
            // Load conversation history (users who have chatted before)
            const historyUsers = data.conversations.map(conv => ({
              id: conv.userId,
              name: conv.userId.split('@')[0],
              email: conv.userId,
              avatar: conv.userId.charAt(0).toUpperCase(),
              status: 'Offline', // Will be updated by userList
              unread: conv.unread || 0,
              lastMessage: conv.lastMessage || 'No messages',
              lastTimestamp: conv.lastTimestamp
            }));

            setUsers(prevUsers => {
              // Merge with existing online users
              const merged = [...historyUsers];
              prevUsers.forEach(onlineUser => {
                const existingIndex = merged.findIndex(u => u.email === onlineUser.email);
                if (existingIndex !== -1) {
                  // Update status to Online
                  merged[existingIndex] = { ...merged[existingIndex], status: 'Online' };
                } else {
                  merged.push(onlineUser);
                }
              });
              return merged;
            });
          } else if (data.type === 'userList') {
            console.log('Got user list:', data.users?.length || 0, 'online users');
            // Update online status for users
            const onlineUserEmails = data.users.map(u => u.userId);

            setUsers(prevUsers => {
              if (prevUsers.length === 0) {
                // If no history, just show online users
                return data.users.map(u => ({
                  id: u.userId,
                  name: u.userId.split('@')[0],
                  email: u.userId,
                  avatar: u.userId.charAt(0).toUpperCase(),
                  status: 'Online',
                  unread: 0,
                  lastMessage: 'Online now'
                }));
              }

              // Update online status for existing users
              return prevUsers.map(user => ({
                ...user,
                status: onlineUserEmails.includes(user.email) ? 'Online' : 'Offline'
              }));
            });
          } else if (data.type === 'messageHistory') {
            const formattedMessages = data.messages.map(msg => ({
              id: msg.messageId,
              text: msg.message,
              sender: msg.senderId === adminEmail ? 'You' : 'User',
              timestamp: msg.timestamp,
              isAdmin: msg.senderId === adminEmail,
              senderName: msg.senderId === adminEmail ? 'Admin' : msg.senderId.split('@')[0],
              avatar: msg.senderId === adminEmail ? 'AD' : msg.senderId.charAt(0).toUpperCase()
            }));
            setMessages(formattedMessages);
          } else if (data.type === 'newMessage') {
            const isAdminMsg = data.senderId === adminEmail;
            const otherUserEmail = isAdminMsg ? data.recipientId : data.senderId;

            // 1. Update User List (Sidebar)
            setUsers(prevUsers => {
              const existingUserIndex = prevUsers.findIndex(u => u.email === otherUserEmail);

              if (existingUserIndex !== -1) {
                // User exist -> Move to top & Update last message
                const updatedUsers = [...prevUsers];
                const user = updatedUsers[existingUserIndex];
                updatedUsers.splice(existingUserIndex, 1);
                updatedUsers.unshift({
                  ...user,
                  lastMessage: data.message,
                  unread: isAdminMsg ? 0 : (user.unread || 0) + 1
                });
                return updatedUsers;
              } else {
                // User does NOT exist -> Add new user to top
                const newUser = {
                  id: otherUserEmail,
                  name: otherUserEmail.split('@')[0],
                  email: otherUserEmail,
                  avatar: otherUserEmail.charAt(0).toUpperCase(),
                  status: 'Online',
                  unread: isAdminMsg ? 0 : 1,
                  lastMessage: data.message
                };
                return [newUser, ...prevUsers];
              }
            });

            // 2. Update Messages (Chat Area) if we are chatting with this user
            // Check for duplicates by messageId before adding
            setMessages(prev => {
              // Check if message already exists
              const exists = prev.some(m => m.id === data.messageId);
              if (exists) return prev;

              return [...prev, {
                id: data.messageId,
                text: data.message,
                sender: isAdminMsg ? 'You' : 'User',
                timestamp: data.timestamp,
                isAdmin: isAdminMsg,
                senderName: isAdminMsg ? 'Admin' : (data.senderId.split('@')[0]),
                avatar: isAdminMsg ? 'AD' : data.senderId.charAt(0).toUpperCase()
              }];
            });

            if (!isAdminMsg) {
              showNotification(`New message from ${data.senderId}`);
            }
          }
        };

        socket.onclose = () => {
          setIsConnected(false);
        };
      } catch (error) {
        console.error("Connection failed:", error);
        setLoading(false);
      }
    };

    connectWebSocket();

    return () => {
      if (ws) {
        ws.close();
      }
    };
  }, [adminEmail]); // Re-run when adminEmail changes

  // Filter users
  const filteredUsers = users.filter(user =>
    user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user?.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleUserSelect = (user) => {
    setSelectedUser(user);
    // Fetch history
    if (ws && isConnected) {
      console.log(`Fetching history for ${user.email}`);
      ws.send(JSON.stringify({
        action: 'getMessages',
        user1: adminEmail,
        user2: user.email
      }));
    }
  };

  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedUser || !ws) return;

    const messageData = {
      action: 'sendMessage',
      senderId: adminEmail,
      recipientId: selectedUser.email,
      message: newMessage
    };

    ws.send(JSON.stringify(messageData));
    setNewMessage("");
    // Message will be added when server broadcasts back via newMessage event
  };

  // Scroll to bottom only when user sends a message or first load
  const messagesContainerRef = useRef(null);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);

  // Check if user is at bottom of chat
  const handleScroll = () => {
    if (messagesContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
      const isAtBottom = scrollHeight - scrollTop - clientHeight < 50;
      setShouldAutoScroll(isAtBottom);
    }
  };

  // Scroll to bottom only if user was at bottom
  useEffect(() => {
    if (shouldAutoScroll) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, shouldAutoScroll]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <AdminHeader />

      {/* Notification Toast */}
      {notification && (
        <Notification message={notification} onClose={() => setNotification(null)} />
      )}

      {/* Navigation */}
      <div className="max-w-7xl w-full mx-auto px-6 pt-6 pb-2">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/admin')}
            className="flex items-center gap-2 text-gray-600 hover:text-teal-600 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Dashboard
          </button>
          <span className="text-gray-400">|</span>
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-gray-600 hover:text-teal-600 transition-colors"
          >
            <Home className="w-5 h-5" />
            Home
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-6 pt-2">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden h-[calc(100vh-140px)] flex">

          {/* Sidebar - Users List */}
          <div className="w-80 bg-gray-50 border-r border-gray-200 flex flex-col">
            <div className="p-4 border-b border-gray-200 bg-white">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-lg text-gray-800 flex items-center gap-2">
                  Users ({filteredUsers.length})
                </h2>
                <span className={`text-xs px-2 py-1 rounded-full ${isConnected ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {isConnected ? 'Connected' : 'Offline'}
                </span>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-gray-100 border-none rounded-lg text-sm focus:ring-2 focus:ring-teal-500/20 text-gray-600 outline-none"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="p-4 text-center text-gray-400 text-sm">Loading users...</div>
              ) : filteredUsers.length === 0 ? (
                <div className="p-4 text-center text-gray-400 text-sm">No online users found</div>
              ) : (
                filteredUsers.map((user) => (
                  <div
                    key={user.id}
                    onClick={() => handleUserSelect(user)}
                    className={`p-4 border-b border-gray-100 cursor-pointer transition-all hover:bg-white hover:shadow-sm ${selectedUser?.id === user.id ? "bg-white border-l-4 border-l-teal-500 shadow-sm" : "border-l-4 border-l-transparent"
                      }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="relative">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shadow-sm ${selectedUser?.id === user.id ? 'bg-teal-500' : 'bg-teal-200'
                          }`}>
                          {user.avatar}
                        </div>
                        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start mb-0.5">
                          <h3 className={`font-semibold text-sm truncate ${selectedUser?.id === user.id ? "text-gray-900" : "text-gray-700"
                            }`}>
                            {user.email}
                          </h3>
                        </div>
                        <p className="text-xs text-gray-500 truncate">{user.lastMessage}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Chat Area */}
          <div className="flex-1 flex flex-col bg-white">
            {selectedUser ? (
              <>
                {/* Chat Header */}
                <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-white shadow-sm z-10">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-teal-100 text-teal-600 flex items-center justify-center font-bold">
                      {selectedUser.avatar}
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-800">{selectedUser.email}</h3>
                      <span className="text-xs text-green-500 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                        Customer
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="p-2 hover:bg-gray-100 rounded-full text-gray-400 hover:text-teal-600 transition">
                      <Phone size={20} />
                    </button>
                    <button className="p-2 hover:bg-gray-100 rounded-full text-gray-400 hover:text-teal-600 transition">
                      <Video size={20} />
                    </button>
                    <button className="p-2 hover:bg-gray-100 rounded-full text-gray-400 hover:text-red-500 transition">
                      <Trash2 size={20} />
                    </button>
                    <button className="p-2 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-600 transition">
                      <MoreVertical size={20} />
                    </button>
                  </div>
                </div>

                {/* Messages */}
                <div
                  ref={messagesContainerRef}
                  onScroll={handleScroll}
                  className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50/50"
                >
                  {messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-gray-400">
                      <p className="text-sm">No messages yet. Start the conversation!</p>
                    </div>
                  ) : (
                    messages.map((msg, index) => (
                      <div
                        key={msg.id || index}
                        className={`flex items-end gap-3 ${msg.isAdmin ? "justify-end" : "justify-start"}`}
                      >
                        {/* Customer Avatar (Left) */}
                        {!msg.isAdmin && (
                          <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center text-xs font-bold text-teal-700 flex-shrink-0 shadow-sm border border-teal-200">
                            {msg.avatar}
                          </div>
                        )}

                        <div className={`flex flex-col max-w-[70%] ${msg.isAdmin ? "items-end" : "items-start"}`}>
                          <div className={`flex items-baseline gap-2 mb-1 px-1 ${msg.isAdmin ? "flex-row-reverse" : "flex-row"}`}>
                            <span className="text-xs font-medium text-gray-600">
                              {msg.senderName}
                            </span>
                            <span className="text-[10px] text-gray-400">
                              {formatTimestamp(msg.timestamp)}
                            </span>
                          </div>

                          <div
                            className={`px-5 py-3 rounded-2xl shadow-sm text-sm leading-relaxed ${msg.isAdmin
                              ? "bg-teal-600 text-white rounded-br-none"
                              : "bg-white text-gray-700 border border-gray-100 rounded-bl-none"
                              }`}
                          >
                            {msg.text}
                          </div>
                        </div>

                        {/* Admin Avatar (Right) */}
                        {msg.isAdmin && (
                          <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center text-xs font-bold text-white flex-shrink-0 shadow-sm">
                            AD
                          </div>
                        )}
                      </div>
                    ))
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="p-4 bg-white border-t border-gray-100">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                      placeholder="Type your message..."
                      className="flex-1 bg-gray-50 text-gray-800 placeholder-gray-400 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all font-medium"
                    />
                    <button
                      onClick={handleSendMessage}
                      disabled={!newMessage.trim()}
                      className="bg-teal-600 hover:bg-teal-700 text-white p-3 rounded-xl transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-50 disabled:shadow-none transform hover:-translate-y-0.5 active:translate-y-0"
                    >
                      <Send size={20} />
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-gray-50/30">
                <div className="w-24 h-24 bg-teal-50 rounded-full flex items-center justify-center mb-6">
                  <UsersIconPlaceholder className="w-12 h-12 text-teal-200" />
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">
                  Select a User to Chat
                </h3>
                <p className="text-gray-500 max-w-sm">
                  Choose a user from the list on the left to view conversation history and send messages.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Simple placeholder icon
const UsersIconPlaceholder = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
  </svg>
)

export default AdminChatWithUsers;