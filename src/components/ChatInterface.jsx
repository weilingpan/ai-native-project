import React, { useState, useRef, useEffect } from 'react';
import { Send, Paperclip, MoreVertical, Bot, User, Plus, MessageSquare, Trash2, Eraser, ChevronLeft, Menu } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

const ChatInterface = () => {
    const [sessions, setSessions] = useState([
        { id: 1, title: 'New Chat', messages: [], timestamp: new Date() }
    ]);
    const [activeSessionId, setActiveSessionId] = useState(1);
    const [inputValue, setInputValue] = useState('');
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
    const [mobileView, setMobileView] = useState('list'); // 'list' | 'chat'
    const [isHeaderMenuOpen, setIsHeaderMenuOpen] = useState(false);
    const messagesEndRef = useRef(null);

    const activeSession = sessions.find(s => s.id === activeSessionId) || sessions[0];

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth < 768);
            if (window.innerWidth >= 768) {
                setMobileView('chat'); // Reset to default split view on desktop
            }
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [activeSession?.messages, mobileView]);

    const handleCreateSession = () => {
        const newId = Date.now();
        const newSession = {
            id: newId,
            title: 'New Chat',
            messages: [],
            timestamp: new Date()
        };
        setSessions(prev => [newSession, ...prev]);
        setActiveSessionId(newId);
        if (isMobile) {
            setMobileView('chat');
        }
    };

    const handleSessionSelect = (sessionId) => {
        setActiveSessionId(sessionId);
        if (isMobile) {
            setMobileView('chat');
        }
    };

    const handleClearSession = (e, sessionId) => {
        e.stopPropagation();
        setSessions(prev => prev.map(s => {
            if (s.id === sessionId) {
                return { ...s, messages: [] };
            }
            return s;
        }));
    };

    const handleDeleteSession = (e, sessionId) => {
        e.stopPropagation();
        const newSessions = sessions.filter(s => s.id !== sessionId);
        if (newSessions.length === 0) {
            // Keep at least one session
            const newSession = { id: Date.now(), title: 'New Chat', messages: [], timestamp: new Date() };
            setSessions([newSession]);
            setActiveSessionId(newSession.id);
        } else {
            setSessions(newSessions);
            if (activeSessionId === sessionId) {
                setActiveSessionId(newSessions[0].id);
            }
        }
    };

    const handleSendMessage = () => {
        if (!inputValue.trim()) return;

        const userMessage = {
            id: Date.now(),
            text: inputValue,
            sender: 'user',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };

        setSessions(prevSessions => prevSessions.map(session => {
            if (session.id === activeSessionId) {
                // Auto-update title based on first message
                const newTitle = session.messages.length === 0
                    ? (inputValue.length > 20 ? inputValue.substring(0, 20) + '...' : inputValue)
                    : session.title;

                return {
                    ...session,
                    messages: [...session.messages, userMessage],
                    title: newTitle
                };
            }
            return session;
        }));

        setInputValue('');

        // Simulate AI Echo with a slight delay
        setTimeout(() => {
            const botMessage = {
                id: Date.now() + 1,
                text: inputValue, // Echoing the user's input
                sender: 'bot',
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            };

            setSessions(prevSessions => prevSessions.map(session => {
                if (session.id === activeSessionId) {
                    return { ...session, messages: [...session.messages, botMessage] };
                }
                return session;
            }));
        }, 600);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    // Render Logic
    const showSessionList = !isMobile || (isMobile && mobileView === 'list');
    const showChatArea = !isMobile || (isMobile && mobileView === 'chat');

    return (
        <div className="flex h-full w-full bg-slate-900 text-text overflow-hidden relative">
            {/* Sessions Sidebar / List View */}
            <div className={`${showSessionList ? 'flex' : 'hidden'} ${isMobile ? 'w-full pt-16' : 'w-64'} bg-slate-900/90 border-r border-slate-700/50 flex flex-col flex-shrink-0 backdrop-blur-xl transition-all duration-300`}>
                <div className="p-4">
                    <button
                        onClick={handleCreateSession}
                        className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white p-3 rounded-xl transition-all shadow-lg shadow-blue-900/20 group"
                    >
                        <Plus size={20} className="group-hover:rotate-90 transition-transform duration-300" />
                        <span className="font-medium">New Chat</span>
                    </button>
                    {isMobile && (
                        <p className="text-center text-xs text-slate-500 mt-4">Select a chat to start messaging</p>
                    )}
                </div>

                <div className="flex-1 overflow-y-auto px-2 space-y-1 custom-scrollbar">
                    {sessions.map(session => (
                        <div
                            key={session.id}
                            onClick={() => handleSessionSelect(session.id)}
                            className={`group flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all border border-transparent ${activeSessionId === session.id
                                ? 'bg-slate-800 text-white border-slate-700/50 shadow-md'
                                : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                                }`}
                        >
                            <div className="flex items-center gap-3 overflow-hidden flex-1">
                                <MessageSquare size={18} className={`shrink-0 ${activeSessionId === session.id ? 'text-blue-400' : 'text-slate-600'}`} />
                                <span className="truncate text-sm font-medium">{session.title}</span>
                            </div>
                            <div className="flex items-center gap-1 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                    onClick={(e) => handleClearSession(e, session.id)}
                                    className="p-1.5 rounded-md hover:bg-yellow-500/10 hover:text-yellow-400 transition-colors"
                                    title="Clear Chat History"
                                >
                                    <Eraser size={14} />
                                </button>
                                <button
                                    onClick={(e) => handleDeleteSession(e, session.id)}
                                    className={`p-1.5 rounded-md hover:bg-red-500/10 hover:text-red-400 transition-colors ${sessions.length === 1 ? 'hidden' : ''
                                        }`}
                                    title="Delete Chat"
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="p-4 border-t border-slate-700/50">
                    <div className="flex items-center gap-3 p-2 rounded-lg bg-slate-800/30 border border-slate-700/30">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold">
                            U
                        </div>
                        <div className="flex-1 overflow-hidden">
                            <p className="text-sm font-medium text-slate-200 truncate">User Account</p>
                            <p className="text-xs text-slate-500 truncate">Pro Plan</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Chat Area */}
            <div className={`${showChatArea ? 'flex' : 'hidden'} flex-1 flex flex-col h-full relative overflow-hidden bg-slate-900/50`}>
                {/* Chat Header */}
                <div className={`h-16 border-b border-slate-700/50 flex items-center justify-between px-4 md:px-6 bg-slate-900/80 backdrop-blur-md sticky top-0 z-10 ${isMobile ? 'pl-16' : ''}`}>
                    <div className="flex items-center gap-3 overflow-hidden">
                        {isMobile && (
                            <button
                                onClick={() => setMobileView('list')}
                                className="mr-1 p-1 hover:bg-slate-800 rounded-lg text-slate-400 shrink-0"
                            >
                                <ChevronLeft size={24} />
                            </button>
                        )}
                        <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
                            <Bot size={24} />
                        </div>
                        <div className="min-w-0 flex-1">
                            <h2 className="text-lg font-semibold text-white truncate">{activeSession?.title}</h2>
                            <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse shrink-0"></span>
                                <span className="text-xs text-slate-400 whitespace-nowrap">Always active</span>
                            </div>
                        </div>
                    </div>

                    {/* Header Actions Menu */}
                    <div className="relative">
                        <button
                            onClick={() => setIsHeaderMenuOpen(!isHeaderMenuOpen)}
                            className="p-2 hover:bg-slate-800 rounded-full text-slate-400 transition-colors"
                        >
                            <MoreVertical size={20} />
                        </button>

                        <AnimatePresence>
                            {isHeaderMenuOpen && (
                                <>
                                    <div
                                        className="fixed inset-0 z-10"
                                        onClick={() => setIsHeaderMenuOpen(false)}
                                    />
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                                        className="absolute right-0 top-full mt-2 w-48 bg-slate-800 border border-slate-700 rounded-xl shadow-xl z-20 overflow-hidden"
                                    >
                                        <button
                                            onClick={() => {
                                                handleCreateSession();
                                                setIsHeaderMenuOpen(false);
                                            }}
                                            className="w-full text-left px-4 py-3 text-sm text-slate-200 hover:bg-slate-700/50 flex items-center gap-2"
                                        >
                                            <Plus size={16} />
                                            New Chat
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                handleClearSession(e, activeSessionId);
                                                setIsHeaderMenuOpen(false);
                                            }}
                                            className="w-full text-left px-4 py-3 text-sm text-slate-200 hover:bg-slate-700/50 flex items-center gap-2 border-t border-slate-700/50"
                                        >
                                            <Eraser size={16} />
                                            Clear History
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                handleDeleteSession(e, activeSessionId);
                                                setIsHeaderMenuOpen(false);
                                            }}
                                            className="w-full text-left px-4 py-3 text-sm text-red-400 hover:bg-red-500/10 flex items-center gap-2 border-t border-slate-700/50"
                                        >
                                            <Trash2 size={16} />
                                            Delete Chat
                                        </button>
                                    </motion.div>
                                </>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
                    {activeSession?.messages.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-slate-500 opacity-50">
                            <div className="w-20 h-20 bg-slate-800/50 rounded-full flex items-center justify-center mb-6 ring-1 ring-slate-700">
                                <Bot size={40} className="text-blue-500" />
                            </div>
                            <h3 className="text-xl font-medium text-slate-300 mb-2">How can I help you?</h3>
                            <p className="text-sm text-slate-500">I can help you create, design, and code.</p>
                        </div>
                    ) : (
                        <AnimatePresence initial={false}>
                            {activeSession?.messages.map((message) => (
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
                                    <div className={`space-y-2 max-w-[80%] md:max-w-[80%]`}>
                                        <div className={`p-3 md:p-4 rounded-2xl shadow-md text-sm md:text-base ${message.sender === 'user'
                                            ? 'bg-gradient-to-br from-blue-600 to-purple-600 text-white rounded-tr-none'
                                            : 'bg-slate-800/50 text-slate-200 border border-slate-700/50 rounded-tl-none'
                                            }`}>
                                            <p className="whitespace-pre-wrap break-words">{message.text}</p>
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
                <div className="p-4 md:p-6 bg-slate-900/80 backdrop-blur-md border-t border-slate-700/50">
                    <div className="max-w-4xl mx-auto relative group">
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-xl blur transition-opacity opacity-0 group-hover:opacity-100 duration-500"></div>
                        <div className="relative flex items-end gap-2 bg-slate-800/50 border border-slate-700/50 rounded-xl p-2 shadow-inner focus-within:ring-2 focus-within:ring-blue-500/50 focus-within:border-blue-500/50 transition-all">
                            <button className="p-2 md:p-3 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors">
                                <Paperclip size={20} />
                            </button>
                            <textarea
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Message..."
                                className="flex-1 bg-transparent border-none focus:ring-0 text-slate-200 placeholder-slate-500 resize-none h-10 md:h-12 py-2 md:py-3 max-h-32 focus:outline-none"
                            />
                            <button
                                onClick={handleSendMessage}
                                disabled={!inputValue.trim()}
                                className={`p-2 md:p-3 rounded-lg shadow-lg transition-all ${inputValue.trim()
                                    ? 'bg-blue-600 hover:bg-blue-500 text-white hover:shadow-blue-500/25'
                                    : 'bg-slate-700 text-slate-500 cursor-not-allowed'
                                    }`}
                            >
                                <Send size={18} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ChatInterface;
