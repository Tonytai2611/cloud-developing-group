import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send } from 'lucide-react';

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

    // Connect to WebSocket when chat opens
    useEffect(() => {
        if (!isOpen || !userEmail) return;

        const connectWebSocket = () => {
            try {
                const websocket = new WebSocket(`${WS_URL}?userId=${encodeURIComponent(userEmail)}&role=customer`);

                websocket.onopen = () => {
                    console.log('✅ User WebSocket connected');
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
                    className="fixed bottom-6 right-6 w-14 h-14 bg-teal-600 text-white rounded-full shadow-lg hover:bg-teal-700 transition-all flex items-center justify-center z-50"
                >
                    <MessageCircle className="w-6 h-6" />
                </button>
            )}

            {/* Chat Window */}
            {isOpen && (
                <div className="fixed bottom-6 right-6 w-96 h-[500px] bg-white rounded-lg shadow-2xl flex flex-col z-50 border border-gray-200">
                    {/* Header */}
                    <div className="p-4 bg-teal-600 text-white rounded-t-lg flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <MessageCircle className="w-5 h-5" />
                            <div>
                                <h3 className="font-bold">Chat with Admin</h3>
                                <p className="text-xs text-teal-100">
                                    {isConnected ? 'Online' : 'Offline'}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="hover:bg-teal-700 p-1 rounded"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
                        {messages.length === 0 ? (
                            <div className="flex items-center justify-center h-full text-gray-400 text-sm">
                                No messages yet. Say hello!
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
                                            <div className="w-7 h-7 rounded-full bg-teal-100 flex items-center justify-center flex-shrink-0">
                                                <span className="text-teal-600 font-bold text-xs">
                                                    {senderInitial}
                                                </span>
                                            </div>
                                        )}

                                        {/* Message Bubble */}
                                        <div className="flex flex-col">
                                            {/* Sender Name */}
                                            <span className={`text-xs text-gray-500 mb-1 ${isUser ? 'text-right' : 'text-left'}`}>
                                                {senderName}
                                            </span>

                                            <div
                                                className={`max-w-[70%] px-3 py-2 rounded-lg ${isUser
                                                        ? 'bg-teal-600 text-white rounded-br-none'
                                                        : 'bg-white text-gray-900 rounded-bl-none shadow'
                                                    }`}
                                            >
                                                <p className="text-sm break-words">{msg.message}</p>
                                                <p className={`text-xs mt-1 ${isUser ? 'text-teal-100' : 'text-gray-500'}`}>
                                                    {new Date(msg.timestamp).toLocaleTimeString('en-US', {
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                    })}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Avatar - Right side for user */}
                                        {isUser && (
                                            <div className="w-7 h-7 rounded-full bg-gray-300 flex items-center justify-center flex-shrink-0">
                                                <span className="text-gray-700 font-bold text-xs">
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
                    <div className="p-3 bg-white border-t rounded-b-lg">
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                onKeyPress={handleKeyPress}
                                placeholder="Type a message..."
                                disabled={!isConnected}
                                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:bg-gray-100"
                            />
                            <button
                                onClick={sendMessage}
                                disabled={!newMessage.trim() || !isConnected}
                                className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                            >
                                <Send className="w-4 h-4" />
                            </button>
                        </div>
                        {!isConnected && (
                            <p className="text-xs text-red-500 mt-1">
                                Connecting...
                            </p>
                        )}
                    </div>
                </div>
            )}
        </>
    );
}
