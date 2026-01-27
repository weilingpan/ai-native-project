import React, { useState, useRef, useEffect } from 'react';
import { Send, Paperclip, MoreVertical, Bot, User } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

const ChatInterface = () => {
    const [messages, setMessages] = useState([]);
    const [inputValue, setInputValue] = useState('');
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSendMessage = () => {
        if (!inputValue.trim()) return;

        const userMessage = {
            id: Date.now(),
            text: inputValue,
            sender: 'user',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };

        setMessages(prev => [...prev, userMessage]);
        setInputValue('');

        // Simulate AI Echo with a slight delay
        setTimeout(() => {
            const botMessage = {
                id: Date.now() + 1,
                text: inputValue, // Echoing the user's input
                sender: 'bot',
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            };
            setMessages(prev => [...prev, botMessage]);
        }, 600);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    return (
        <div className="flex-1 flex flex-col h-full bg-slate-900/50 relative overflow-hidden">
            {/* Chat Header */}
            <div className="h-20 border-b border-slate-700/50 flex items-center justify-between px-6 bg-slate-900/80 backdrop-blur-md sticky top-0 z-10">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400">
                        <Bot size={24} />
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold text-white">AI Assistant</h2>
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                            <span className="text-xs text-slate-400">Always active</span>
                        </div>
                    </div>
                </div>
                <button className="p-2 hover:bg-slate-800 rounded-full text-slate-400 transition-colors">
                    <MoreVertical size={20} />
                </button>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-500 opacity-50">
                        <Bot size={48} className="mb-4 text-slate-600" />
                        <p>Start a new conversation...</p>
                    </div>
                ) : (
                    <AnimatePresence initial={false}>
                        {messages.map((message) => (
                            <motion.div
                                key={message.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={`flex gap-4 max-w-3xl ${message.sender === 'user' ? 'ml-auto flex-row-reverse' : ''}`}
                            >
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-1 ${message.sender === 'user'
                                        ? 'bg-purple-500/20 text-purple-400'
                                        : 'bg-blue-500/20 text-blue-400'
                                    }`}>
                                    {message.sender === 'user' ? <User size={18} /> : <Bot size={18} />}
                                </div>
                                <div className={`space-y-2 max-w-[80%]`}>
                                    <div className={`p-4 rounded-2xl shadow-md ${message.sender === 'user'
                                            ? 'bg-gradient-to-br from-blue-600 to-purple-600 text-white rounded-tr-none'
                                            : 'bg-slate-800/50 text-slate-200 border border-slate-700/50 rounded-tl-none'
                                        }`}>
                                        <p className="whitespace-pre-wrap">{message.text}</p>
                                    </div>
                                    <span className={`text-xs text-slate-500 px-1 block ${message.sender === 'user' ? 'text-right' : ''}`}>
                                        {message.timestamp}
                                    </span>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-6 bg-slate-900/80 backdrop-blur-md border-t border-slate-700/50">
                <div className="max-w-4xl mx-auto relative group">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-xl blur transition-opacity opacity-0 group-hover:opacity-100 duration-500"></div>
                    <div className="relative flex items-end gap-2 bg-slate-800/50 border border-slate-700/50 rounded-xl p-2 shadow-inner focus-within:ring-2 focus-within:ring-blue-500/50 focus-within:border-blue-500/50 transition-all">
                        <button className="p-3 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors">
                            <Paperclip size={20} />
                        </button>
                        <textarea
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Type your message..."
                            className="flex-1 bg-transparent border-none focus:ring-0 text-slate-200 placeholder-slate-500 resize-none h-12 py-3 max-h-32"
                        />
                        <button
                            onClick={handleSendMessage}
                            disabled={!inputValue.trim()}
                            className={`p-3 rounded-lg shadow-lg transition-all ${inputValue.trim()
                                    ? 'bg-blue-600 hover:bg-blue-500 text-white hover:shadow-blue-500/25'
                                    : 'bg-slate-700 text-slate-500 cursor-not-allowed'
                                }`}
                        >
                            <Send size={18} />
                        </button>
                    </div>
                    <div className="text-center mt-2">
                        <span className="text-xs text-slate-500">AI can make mistakes. Consider checking important information.</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ChatInterface;
