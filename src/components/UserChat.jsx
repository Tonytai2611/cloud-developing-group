import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, Coffee, Sparkles } from 'lucide-react';

// WebSocket API Gateway URL
const WS_URL = 'wss://3w3qjyvvl9.execute-api.us-east-1.amazonaws.com/production';

export default function UserChat({ userEmail }) {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [ws, setWs] = useState(null);
    const [isConnected, setIsConnected] = useState(false);

    const messagesEndRef = useRef(null);
    const adminEmail = 'tonytai2611@gmail.com'; // Fixed admin email
    const prevUserEmailRef = useRef(userEmail);

    // Clear messages when user changes
    useEffect(() => {
        if (prevUserEmailRef.current && prevUserEmailRef.current !== userEmail) {
            console.log('User changed, clearing messages');
            setMessages([]);
            if (ws) {
                ws.close();
                setWs(null);
            }
        }
        prevUserEmailRef.current = userEmail;
    }, [userEmail]);

    // Connect to WebSocket when chat opens
    useEffect(() => {
        if (!isOpen || !userEmail) return;

        // Close existing connection and clear messages for fresh start
        if (ws) {
            ws.close();
        }
        setMessages([]);

        const connectWebSocket = () => {
            try {
                console.log('Connecting WebSocket for user:', userEmail);
                const websocket = new WebSocket(`${WS_URL}?userId=${encodeURIComponent(userEmail)}&role=customer`);

                websocket.onopen = () => {
                    console.log('✅ User WebSocket connected for:', userEmail);
                    setIsConnected(true);

                    // Load message history
                    websocket.send(JSON.stringify({
                        action: 'getMessages',
                        user1: userEmail,
                        user2: adminEmail
                    }));
                };

                websocket.onmessage = (event) => {
                    const data = JSON.parse(event.data);
                    console.log('📨 Received:', data);

                    if (data.type === 'newMessage') {
                        setMessages(prev => [...prev, {
                            messageId: data.messageId,
                            senderId: data.senderId,
                            message: data.message,
                            timestamp: data.timestamp
                        }]);
                    } else if (data.type === 'messageHistory') {
                        setMessages(data.messages);
                    }
                };

                websocket.onerror = (error) => {
                    console.error('❌ WebSocket error:', error);
                    setIsConnected(false);
                };

                websocket.onclose = () => {
                    console.log('🔌 WebSocket disconnected');
                    setIsConnected(false);
                };

                setWs(websocket);
            } catch (error) {
                console.error('Failed to connect:', error);
            }
        };

        connectWebSocket();

        return () => {
            if (ws) {
                ws.close();
            }
        };
    }, [isOpen, userEmail]);

    const sendMessage = () => {
        if (!newMessage.trim() || !ws || ws.readyState !== WebSocket.OPEN) {
            return;
        }

        const messageData = {
            action: 'sendMessage',
            senderId: userEmail,
            recipientId: adminEmail,
            message: newMessage.trim()
        };

        ws.send(JSON.stringify(messageData));

        // Add to local messages (optimistic update)
        setMessages(prev => [...prev, {
            senderId: userEmail,
            recipientId: adminEmail,
            message: newMessage.trim(),
            timestamp: new Date().toISOString()
        }]);

        setNewMessage('');
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    // Auto-scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    if (!userEmail) {
        return null; // Don't show chat if user not logged in
    }

    return (
        <>
            {/* Chat Button */}
            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-br from-[#14B8A6] to-[#0D9488] text-white rounded-full shadow-lg shadow-teal-500/30 hover:shadow-teal-500/50 hover:scale-110 transition-all duration-300 flex items-center justify-center z-50 group"
                >
                    <MessageCircle className="w-6 h-6 group-hover:scale-110 transition-transform" />
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-amber-400 rounded-full animate-pulse"></span>
                </button>
            )}

            {/* Chat Window */}
            {isOpen && (
                <div className="fixed bottom-6 right-6 w-[380px] h-[520px] bg-white rounded-2xl shadow-2xl flex flex-col z-50 border border-gray-100 overflow-hidden animate-in slide-in-from-bottom-5 duration-300">
                    {/* Header */}
                    <div className="p-4 bg-gradient-to-r from-[#14B8A6] to-[#0D9488] text-white flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="bg-white/20 backdrop-blur-sm p-2 rounded-xl">
                                <Coffee className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="font-bold text-base">Chat with Admin</h3>
                                <div className="flex items-center gap-1.5">
                                    <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`}></span>
                                    <p className="text-xs text-white/80">
                                        {isConnected ? 'Online' : 'Connecting...'}
                                    </p>
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="hover:bg-white/20 p-2 rounded-xl transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gradient-to-b from-gray-50/80 to-white">
                        {messages.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-gray-400">
                                <div className="bg-teal-50 p-4 rounded-full mb-3">
                                    <MessageCircle className="w-8 h-8 text-teal-300" />
                                </div>
                                <p className="font-medium text-gray-500">No messages yet</p>
                                <p className="text-sm">Say hello! 👋</p>
                            </div>
                        ) : (
                            messages.map((msg, idx) => {
                                const isUser = msg.senderId === userEmail;
                                const senderName = isUser ? 'You' : 'Admin';
                                const senderInitial = isUser ? userEmail.charAt(0).toUpperCase() : 'A';

                                return (
                                    <div
                                        key={msg.messageId || idx}
                                        className={`flex gap-2 ${isUser ? 'justify-end' : 'justify-start'}`}
                                    >
                                        {/* Avatar - Left side for admin */}
                                        {!isUser && (
                                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center flex-shrink-0 shadow-sm">
                                                <span className="text-white font-bold text-xs">
                                                    {senderInitial}
                                                </span>
                                            </div>
                                        )}

                                        {/* Message Bubble */}
                                        <div className="flex flex-col max-w-[75%]">
                                            {/* Sender Name */}
                                            <span className={`text-xs text-gray-400 mb-1 px-1 ${isUser ? 'text-right' : 'text-left'}`}>
                                                {senderName}
                                            </span>

                                            <div
                                                className={`px-3.5 py-2.5 rounded-2xl ${isUser
                                                        ? 'bg-gradient-to-br from-[#14B8A6] to-[#0D9488] text-white rounded-br-md'
                                                        : 'bg-white text-gray-800 rounded-bl-md shadow-sm border border-gray-100'
                                                    }`}
                                            >
                                                <p className="text-sm break-words leading-relaxed">{msg.message}</p>
                                                <p className={`text-[10px] mt-1 ${isUser ? 'text-white/70' : 'text-gray-400'}`}>
                                                    {new Date(msg.timestamp).toLocaleTimeString('en-US', {
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                    })}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Avatar - Right side for user */}
                                        {isUser && (
                                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center flex-shrink-0 shadow-sm">
                                                <span className="text-white font-bold text-xs">
                                                    {senderInitial}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                );
                            })

                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input */}
                    <div className="p-3 bg-white border-t border-gray-100">
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                onKeyPress={handleKeyPress}
                                placeholder="Type a message..."
                                disabled={!isConnected}
                                className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent focus:bg-white disabled:bg-gray-100 transition-all"
                            />
                            <button
                                onClick={sendMessage}
                                disabled={!newMessage.trim() || !isConnected}
                                className="px-4 py-2.5 bg-gradient-to-r from-[#14B8A6] to-[#0D9488] text-white rounded-xl hover:from-[#0D9488] hover:to-[#0F766E] transition-all disabled:from-gray-300 disabled:to-gray-300 disabled:cursor-not-allowed shadow-md shadow-teal-500/20 hover:shadow-teal-500/40"
                            >
                                <Send className="w-4 h-4" />
                            </button>
                        </div>
                        {!isConnected && (
                            <p className="text-xs text-amber-500 mt-2 flex items-center gap-1">
                                <Sparkles className="w-3 h-3" />
                                Connecting to support...
                            </p>
                        )}
                    </div>
                </div>
            )}
        </>
    );
}
