import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { MessageCircle, Send, ArrowLeft, Home, Bell } from "lucide-react";

// Helper for notifications
const Notification = ({ message, onClose }) => (
    <div className="fixed top-4 right-4 bg-white border-l-4 border-teal-500 shadow-lg rounded-lg p-4 max-w-sm animate-in slide-in-from-right z-50 flex items-start gap-3">
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

const UserChatPage = () => {
    const navigate = useNavigate();
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [ws, setWs] = useState(null);
    const [isConnected, setIsConnected] = useState(false);
    const [adminEmail, setAdminEmail] = useState(null); // Dynamic admin email
    const [notification, setNotification] = useState(null);
    const [userEmail, setUserEmail] = useState(null); // Dynamic user email from cookie

    const messagesEndRef = useRef(null);
    const WS_URL = "wss://3w3qjyvvl9.execute-api.us-east-1.amazonaws.com/production";

    // Show notification helper
    const showNotification = (msg) => {
        setNotification(msg);
        setTimeout(() => setNotification(null), 3000);
    };

    // Fetch current user info from cookie
    useEffect(() => {
        const fetchUserInfo = async () => {
            try {
                const response = await fetch("/api/me");
                if (response.ok) {
                    const data = await response.json();
                    setUserEmail(data.userInfo.email || data.userInfo.username);
                } else {
                    console.error("Not authenticated");
                    navigate('/login');
                }
            } catch (error) {
                console.error("Error fetching user info:", error);
                navigate('/login');
            }
        };
        fetchUserInfo();
    }, [navigate]);

    // Connect to WebSocket when chat opens AND user is loaded
    useEffect(() => {
        if (!userEmail) return; // Wait for user email to be fetched

        const socket = new WebSocket(`${WS_URL}?userId=${userEmail}&role=customer`);

        socket.onopen = () => {
            setIsConnected(true);
            setWs(socket);

            // Ask for online admins immediately
            socket.send(JSON.stringify({
                action: 'getUsers',
                role: 'admin'
            }));
        };

        socket.onmessage = (event) => {
            const data = JSON.parse(event.data);

            if (data.type === 'userList' && data.roleFilter === 'admin') {
                const admins = data.users;
                if (admins && admins.length > 0) {
                    setAdminEmail(admins[0].userId);
                }
            } else if (data.type === 'messageHistory') {
                const formattedMessages = data.messages.map(msg => ({
                    id: msg.messageId,
                    text: msg.message,
                    sender: msg.senderId === userEmail ? 'You' : 'Admin',
                    senderId: msg.senderId,
                    timestamp: msg.timestamp,
                    isUser: msg.senderId === userEmail
                }));
                setMessages(formattedMessages);
            } else if (data.type === 'newMessage') {
                const isMyMessage = data.senderId === userEmail;
                const newMsg = {
                    id: data.messageId,
                    text: data.message,
                    sender: isMyMessage ? 'You' : 'Admin',
                    senderId: data.senderId,
                    timestamp: data.timestamp,
                    isUser: isMyMessage
                };
                setMessages(prev => [...prev, newMsg]);

                // Show notification if it's from Admin
                if (!isMyMessage) {
                    showNotification(`New message from Admin`);
                }
            }
        };

        socket.onclose = () => {
            setIsConnected(false);
        };

        return () => {
            socket.close();
        };
    }, [userEmail]); // Re-run when userEmail changes

    // Fetch history when admin is found
    useEffect(() => {
        if (ws && isConnected && adminEmail) {
            ws.send(JSON.stringify({
                action: 'getMessages',
                user1: userEmail,
                user2: adminEmail
            }));
        }
    }, [ws, isConnected, adminEmail]);

    const sendMessage = () => {
        if (!newMessage.trim() || !ws || !isConnected) return;

        if (!adminEmail) {
            alert("No online admin found yet. Trying to find...");
            ws.send(JSON.stringify({ action: 'getUsers', role: 'admin' }));
            return;
        }

        const messageData = {
            action: 'sendMessage',
            senderId: userEmail,
            recipientId: adminEmail,
            message: newMessage
        };

        ws.send(JSON.stringify(messageData));

        // Optimistic update: Show message immediately
        setMessages(prev => [...prev, {
            id: Date.now().toString(),
            text: newMessage,
            sender: 'You',
            senderId: userEmail,
            timestamp: new Date().toISOString(),
            isUser: true
        }]);

        setNewMessage('');
    };

    // Auto-scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    return (
        <div className="flex flex-col h-screen bg-gray-50">
            {/* Notification Toast */}
            {notification && (
                <Notification message={notification} onClose={() => setNotification(null)} />
            )}

            {/* Header */}
            <header className="bg-white shadow-sm p-4 flex justify-between items-center z-10">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center gap-2 text-gray-600 hover:text-teal-600 transition"
                    >
                        <ArrowLeft size={20} /> Back
                    </button>
                    <div className="h-6 w-px bg-gray-300"></div>
                    <Link to="/" className="flex items-center gap-2 text-gray-600 hover:text-teal-600 transition">
                        <Home size={20} /> Home
                    </Link>
                </div>

                <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    <span className="text-sm text-gray-500 font-medium">
                        {isConnected ? (adminEmail ? `Connected to ${adminEmail}` : 'Finding Admin...') : 'Disconnected'}
                    </span>
                </div>
            </header>

            <div className="flex-1 max-w-5xl mx-auto w-full p-6 flex flex-col h-[calc(100vh-80px)]">

                {/* Chat Header Card */}
                <div className="bg-white rounded-t-xl shadow-sm border-b p-4 flex items-center gap-4">
                    <div className="bg-teal-100 p-3 rounded-full">
                        <MessageCircle className="text-teal-600 w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="font-bold text-gray-800 text-lg">Chat with Admin</h1>
                        <p className="text-sm text-gray-500">Brewcraft Restaurant Support</p>
                    </div>
                </div>

                {/* Messages Area */}
                <div className="flex-1 bg-white border-x border-b shadow-sm overflow-y-auto p-6 space-y-4">
                    {messages.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-gray-400">
                            <MessageCircle className="w-16 h-16 mb-4 opacity-20" />
                            <p>No messages yet</p>
                            <p className="text-sm">Start the conversation with admin!</p>
                        </div>
                    ) : (
                        messages.map((msg, idx) => (
                            <div
                                key={msg.id || idx}
                                className={`flex items-end gap-2 ${msg.isUser ? 'justify-end' : 'justify-start'}`}
                            >
                                {/* Admin Avatar (Left) */}
                                {!msg.isUser && (
                                    <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600 flex-shrink-0">
                                        AD
                                    </div>
                                )}

                                <div className={`max-w-[70%] flex flex-col ${msg.isUser ? 'items-end' : 'items-start'}`}>
                                    <span className="text-xs text-gray-400 mb-1 ml-1">{msg.sender}</span>
                                    <div
                                        className={`p-3 rounded-2xl shadow-sm ${msg.isUser
                                            ? 'bg-teal-600 text-white rounded-br-none'
                                            : 'bg-gray-100 text-gray-800 rounded-bl-none'
                                            }`}
                                    >
                                        <p className="text-sm">{msg.text}</p>
                                    </div>
                                    <span className="text-[10px] text-gray-400 mt-1 mx-1">
                                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>

                                {/* User Avatar (Right) */}
                                {msg.isUser && (
                                    <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center text-xs font-bold text-teal-800 flex-shrink-0">
                                        You
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="bg-white rounded-b-xl shadow-sm border-x border-b p-4">
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                            placeholder={adminEmail ? "Type your message..." : "Waiting for admin..."}
                            className="flex-1 border-gray-200 rounded-lg focus:ring-teal-500 focus:border-teal-500 px-4 py-2 border outline-none transition"
                            disabled={!adminEmail}
                        />
                        <button
                            onClick={sendMessage}
                            disabled={!adminEmail || !newMessage.trim()}
                            className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-2 rounded-lg font-medium transition flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Send size={18} /> Send
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UserChatPage;
