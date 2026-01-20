import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { MessageCircle, Send, ArrowLeft, Home, Bell, Coffee, Sparkles } from "lucide-react";
import { useAuth } from '../hooks/useAuth';

// Helper for notifications
const Notification = ({ message, onClose }) => (
    <div className="fixed top-4 right-4 bg-white border-l-4 border-teal-500 shadow-lg rounded-xl p-4 max-w-sm animate-in slide-in-from-right z-50 flex items-start gap-3">
        <div className="bg-gradient-to-br from-teal-400 to-teal-600 p-2 rounded-full text-white">
            <Bell size={20} />
        </div>
        <div className="flex-1">
            <h4 className="font-bold text-gray-800 text-sm">New Message</h4>
            <p className="text-gray-600 text-sm mt-1">{message}</p>
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
    </div>
);

const UserChatPage = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [isConnected, setIsConnected] = useState(false);
    const [adminEmail, setAdminEmail] = useState(null); // Dynamic admin email
    const [notification, setNotification] = useState(null);
    const [userEmail, setUserEmail] = useState(null); // Dynamic user email from cookie

    const messagesEndRef = useRef(null);
    const wsRef = useRef(null); // Use ref instead of state
    const retryTimeoutRef = useRef(null); // For retry logic
    const WS_URL = "wss://dqgx0yvtpl.execute-api.us-east-1.amazonaws.com/production";

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

    // Get user email from AuthProvider
    useEffect(() => {
        if (user?.email || user?.username) {
            const newUserEmail = user.email || user.username;
            console.log('User email from AuthProvider:', newUserEmail);
            setUserEmail(newUserEmail);
        } else {
            console.error("Not authenticated");
            navigate('/');
        }
    }, [user, navigate]);

    // Manual connect function
    const connectToChat = () => {
        if (!userEmail) {
            console.error("No user email available");
            return;
        }

        // Close existing connection if any
        if (wsRef.current) {
            wsRef.current.close();
        }

        // Clear retry timeout
        if (retryTimeoutRef.current) {
            clearTimeout(retryTimeoutRef.current);
        }

        // Clear messages for new connection
        setMessages([]);
        setAdminEmail(null);

        const socket = new WebSocket(`${WS_URL}?userId=${userEmail}&role=customer`);
        wsRef.current = socket;

        socket.onopen = () => {
            console.log('WebSocket connected for user:', userEmail);
            setIsConnected(true);

            // Ask for online admins immediately
            console.log('🔍 Sending getUsers request...');
            socket.send(JSON.stringify({
                action: 'getUsers',
                role: 'admin'
            }));
        };

        socket.onmessage = (event) => {
            const data = JSON.parse(event.data);
            console.log('📨 Received:', data);

            if (data.type === 'userList') {
                console.log('✅ Admin list received:', data.users);

                // Filter for admins only (handle duplicates)
                const admins = (data.users || []).filter(u => u.role === 'admin');

                if (admins.length > 0) {
                    // Get unique admin (in case of duplicates)
                    const uniqueAdmins = [...new Map(admins.map(a => [a.userId, a])).values()];
                    setAdminEmail(uniqueAdmins[0].userId);
                    console.log('✅ Admin assigned:', uniqueAdmins[0].userId);
                } else {
                    console.warn('⚠️ No admins online, retrying in 2s...');
                    // Retry after 2 seconds
                    retryTimeoutRef.current = setTimeout(() => {
                        if (wsRef.current?.readyState === WebSocket.OPEN) {
                            console.log('🔄 Retrying getUsers...');
                            wsRef.current.send(JSON.stringify({
                                action: 'getUsers',
                                role: 'admin'
                            }));
                        }
                    }, 2000);
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

                // Check for duplicates before adding
                setMessages(prev => {
                    const exists = prev.some(m => m.id === data.messageId);
                    if (exists) return prev;
                    return [...prev, newMsg];
                });

                // Show notification if it's from Admin
                if (!isMyMessage) {
                    showNotification(`New message from Admin`);
                }
            }
        };

        socket.onclose = () => {
            console.log("❌ WebSocket closed");
            setIsConnected(false);
            setAdminEmail(null); // Reset admin email on disconnect
        };

        socket.onerror = (error) => {
            console.error('❌ WebSocket error:', error);
        };
    };

    // Manual disconnect function
    const disconnectFromChat = () => {
        if (retryTimeoutRef.current) {
            clearTimeout(retryTimeoutRef.current);
        }
        if (wsRef.current) {
            wsRef.current.close();
            wsRef.current = null;
        }
        setIsConnected(false);
        setAdminEmail(null);
        console.log('🔌 Disconnected from chat');
    };

    // Cleanup only retry timeout on unmount (keep socket alive)
    useEffect(() => {
        return () => {
            if (retryTimeoutRef.current) {
                clearTimeout(retryTimeoutRef.current);
            }
            // Don't close socket on unmount - only close via Disconnect button
        };
    }, []);

    // Fetch history when admin is found
    useEffect(() => {
        if (wsRef.current && isConnected && adminEmail) {
            wsRef.current.send(JSON.stringify({
                action: 'getMessages',
                user1: userEmail,
                user2: adminEmail
            }));
        }
    }, [isConnected, adminEmail, userEmail]);

    const sendMessage = () => {
        if (!newMessage.trim() || !wsRef.current || !isConnected) return;

        if (!adminEmail) {
            alert("No online admin found yet. Trying to find...");
            wsRef.current.send(JSON.stringify({ action: 'getUsers', role: 'admin' }));
            return;
        }

        const messageData = {
            action: 'sendMessage',
            senderId: userEmail,
            recipientId: adminEmail,
            message: newMessage
        };

        wsRef.current.send(JSON.stringify(messageData));
        setNewMessage('');
        // Message will be added when server broadcasts back via newMessage event
    };

    // Smart scroll - only auto-scroll if user is at bottom
    const messagesContainerRef = useRef(null);
    const [shouldAutoScroll, setShouldAutoScroll] = useState(true);

    const handleScroll = () => {
        if (messagesContainerRef.current) {
            const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
            const isAtBottom = scrollHeight - scrollTop - clientHeight < 50;
            setShouldAutoScroll(isAtBottom);
        }
    };

    // Scroll to bottom only on initial load, not on new messages
    const isInitialLoad = useRef(true);
    useEffect(() => {
        if (isInitialLoad.current && messages.length > 0) {
            messagesEndRef.current?.scrollIntoView({ behavior: "auto" });
            isInitialLoad.current = false;
        }
    }, [messages]);

    return (
        <div className="flex flex-col h-screen bg-gradient-to-br from-gray-50 to-teal-50/30">
            {/* Notification Toast */}
            {notification && (
                <Notification message={notification} onClose={() => setNotification(null)} />
            )}

            {/* Header */}
            <header className="bg-white/80 backdrop-blur-md shadow-sm p-4 flex justify-between items-center z-10 border-b border-gray-100">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center gap-2 text-gray-600 hover:text-teal-600 transition-all px-3 py-2 rounded-lg hover:bg-teal-50"
                    >
                        <ArrowLeft size={20} /> Back
                    </button>
                    <div className="h-6 w-px bg-gray-200"></div>
                    <Link to="/" className="flex items-center gap-2 text-gray-600 hover:text-teal-600 transition-all px-3 py-2 rounded-lg hover:bg-teal-50">
                        <Home size={20} /> Home
                    </Link>
                </div>

                <div className="flex items-center gap-4">
                    {/* Connection Status */}
                    <div className="flex items-center gap-3 bg-gray-50 px-4 py-2 rounded-full">
                        <div className={`w-2.5 h-2.5 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
                        <span className="text-sm text-gray-600 font-medium">
                            {isConnected ? (adminEmail ? `Connected` : 'Finding Admin...') : 'Disconnected'}
                        </span>
                    </div>

                    {/* Connect/Disconnect Button */}
                    {!isConnected ? (
                        <button
                            onClick={connectToChat}
                            disabled={!userEmail}
                            className="flex items-center gap-2 bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white px-5 py-2.5 rounded-full font-medium shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <MessageCircle size={18} />
                            Connect to Chat
                        </button>
                    ) : (
                        <button
                            onClick={disconnectFromChat}
                            className="flex items-center gap-2 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-5 py-2.5 rounded-full font-medium shadow-lg hover:shadow-xl transition-all"
                        >
                            <span className="w-2 h-2 bg-white rounded-full"></span>
                            Disconnect
                        </button>
                    )}
                </div>
            </header>

            <div className="flex-1 max-w-4xl mx-auto w-full p-4 md:p-6 flex flex-col h-[calc(100vh-80px)]">

                {/* Chat Container */}
                <div className="flex-1 bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col border border-gray-100">

                    {/* Chat Header */}
                    <div className="bg-gradient-to-r from-[#14B8A6] to-[#0D9488] p-5 flex items-center gap-4">
                        <div className="bg-white/20 backdrop-blur-sm p-3 rounded-xl">
                            <Coffee className="text-white w-6 h-6" />
                        </div>
                        <div className="flex-1">
                            <h1 className="font-bold text-white text-lg">Chat with Admin</h1>
                            <p className="text-sm text-white/70">BrewCraft Restaurant Support</p>
                        </div>
                        <div className="flex items-center gap-2 bg-white/20 px-3 py-1.5 rounded-full">
                            <Sparkles className="w-4 h-4 text-white/80" />
                            <span className="text-white/90 text-sm font-medium">Online</span>
                        </div>
                    </div>

                    {/* Messages Area */}
                    <div
                        ref={messagesContainerRef}
                        onScroll={handleScroll}
                        className="flex-1 overflow-y-auto p-6 space-y-4 bg-gradient-to-b from-gray-50/50 to-white"
                    >
                        {messages.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-gray-400">
                                <div className="bg-teal-50 p-6 rounded-full mb-4">
                                    <MessageCircle className="w-12 h-12 text-teal-300" />
                                </div>
                                <p className="font-medium text-gray-500">No messages yet</p>
                                <p className="text-sm text-gray-400">Start the conversation with admin!</p>
                            </div>
                        ) : (
                            messages.map((msg, idx) => (
                                <div
                                    key={msg.id || idx}
                                    className={`flex items-end gap-3 ${msg.isUser ? 'justify-end' : 'justify-start'}`}
                                >
                                    {/* Admin Avatar (Left) */}
                                    {!msg.isUser && (
                                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center text-xs font-bold text-white flex-shrink-0 shadow-md">
                                            AD
                                        </div>
                                    )}

                                    <div className={`max-w-[70%] flex flex-col ${msg.isUser ? 'items-end' : 'items-start'}`}>
                                        <span className="text-xs text-gray-400 mb-1 px-1">{msg.sender}</span>
                                        <div
                                            className={`px-4 py-3 rounded-2xl shadow-sm ${msg.isUser
                                                ? 'bg-gradient-to-br from-[#14B8A6] to-[#0D9488] text-white rounded-br-md'
                                                : 'bg-white text-gray-800 rounded-bl-md border border-gray-100'
                                                }`}
                                        >
                                            <p className="text-sm leading-relaxed">{msg.text}</p>
                                        </div>
                                        <span className="text-[10px] text-gray-400 mt-1.5 px-1">
                                            {formatTimestamp(msg.timestamp)}
                                        </span>
                                    </div>

                                    {/* User Avatar (Right) */}
                                    {msg.isUser && (
                                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-xs font-bold text-white flex-shrink-0 shadow-md">
                                            You
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input Area */}
                    <div className="p-4 bg-white border-t border-gray-100">
                        <div className="flex gap-3">
                            <input
                                type="text"
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                                placeholder={
                                    !isConnected
                                        ? "Click 'Connect to Chat' to start..."
                                        : adminEmail
                                            ? "Type your message..."
                                            : "Finding admin..."
                                }
                                className="flex-1 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent focus:bg-white px-4 py-3 outline-none transition-all"
                                disabled={!isConnected || !adminEmail}
                            />
                            <button
                                onClick={sendMessage}
                                disabled={!isConnected || !adminEmail || !newMessage.trim()}
                                className="bg-gradient-to-r from-[#14B8A6] to-[#0D9488] hover:from-[#0D9488] hover:to-[#0F766E] text-white px-6 py-3 rounded-xl font-medium transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-teal-500/25 hover:shadow-teal-500/40"
                            >
                                <Send size={18} />
                                <span className="hidden sm:inline">Send</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UserChatPage;