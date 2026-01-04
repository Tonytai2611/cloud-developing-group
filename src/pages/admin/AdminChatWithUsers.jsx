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
  const [selectedUser, setSelectedUser] = useState(null);
  const [users, setUsers] = useState([]); // Dynamic list of users
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [ws, setWs] = useState(null);
  const [adminEmail, setAdminEmail] = useState('tonytai2611@gmail.com'); // Default admin email
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [notification, setNotification] = useState(null);

  const messagesEndRef = useRef(null);
  const WS_URL = "wss://3w3qjyvvl9.execute-api.us-east-1.amazonaws.com/production";

  // Show notification helper
  const showNotification = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  useEffect(() => {
    // 1. Connect WebSocket
    const connectWebSocket = () => {
      try {
        const socket = new WebSocket(`${WS_URL}?userId=${adminEmail}&role=admin`);

        socket.onopen = () => {
          setIsConnected(true);
          setWs(socket);
          setLoading(false);

          // Fetch online customers immediately
          socket.send(JSON.stringify({
            action: 'getUsers',
            role: 'customer'
          }));
        };

        socket.onmessage = (event) => {
          const data = JSON.parse(event.data);

          if (data.type === 'userList') {
            // Update user list from server
            const mappedUsers = data.users.map(u => ({
              id: u.userId,
              name: u.userId.split('@')[0],
              email: u.userId,
              avatar: u.userId.charAt(0).toUpperCase(),
              status: 'Online',
              unread: 0,
              lastMessage: 'Online now'
            }));
            setUsers(mappedUsers);
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
            // Check against current 'selectedUser' state? 
            // Since we can't easily access the fresh 'selectedUser' state inside this callback without refs,
            // we will just append to 'messages'. 
            // Note: If the admin switches user, 'messages' will be cleared/reloaded by the useEffect anyway.
            setMessages(prev => [...prev, {
              id: data.messageId,
              text: data.message,
              sender: isAdminMsg ? 'You' : 'User',
              timestamp: data.timestamp,
              isAdmin: isAdminMsg,
              senderName: isAdminMsg ? 'Admin' : (data.senderId.split('@')[0]),
              avatar: isAdminMsg ? 'AD' : data.senderId.charAt(0).toUpperCase()
            }]);

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
      }
    };

    connectWebSocket();

    return () => {
      if (ws) {
        ws.close();
      }
    };
  }, []); // Run once on mount

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

    // Optimistic update: Show message immediately
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      text: newMessage,
      sender: 'You',
      timestamp: new Date().toISOString(),
      isAdmin: true,
      senderName: 'Admin',
      avatar: 'AD'
    }]);

    setNewMessage("");
  };

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <AdminHeader />

      {/* Notification Toast */}
      {notification && (
        <Notification message={notification} onClose={() => setNotification(null)} />
      )}

      {/* Main Content */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-6">
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
                <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50/50">
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
                              {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
