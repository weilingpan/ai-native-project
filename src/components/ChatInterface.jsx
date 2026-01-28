import React, { useState, useRef, useEffect } from 'react';
import { Send, Paperclip, MoreVertical, Bot, User, Plus, MessageSquare, Trash2, Eraser, ChevronLeft, Menu, X, Calendar, Tag, Info, Cpu, Pencil, Settings, Copy, Check } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { createPortal } from 'react-dom';

const ChatInterface = () => {
    const [sessions, setSessions] = useState([
        {
            id: 1,
            title: 'New Chat',
            description: 'New conversation started',
            model: 'gpt-5-nano',
            messages: [],
            timestamp: new Date()
        }
    ]);
    const [activeSessionId, setActiveSessionId] = useState(1);
    const [inputValue, setInputValue] = useState('');
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
    const [mobileView, setMobileView] = useState('list'); // 'list' | 'chat'
    const [isHeaderMenuOpen, setIsHeaderMenuOpen] = useState(false);
    const messagesEndRef = useRef(null);
    const buttonRef = useRef(null);
    const [menuPos, setMenuPos] = useState({ top: 0, right: 0 });

    // New State for Features
    const [isModelModalOpen, setIsModelModalOpen] = useState(false);
    const [selectedModel, setSelectedModel] = useState('gpt-5-nano');
    const [newSessionTitle, setNewSessionTitle] = useState('');
    const [newSessionDescription, setNewSessionDescription] = useState('');
    const [hoveredSessionId, setHoveredSessionId] = useState(null);
    const [tooltipPos, setTooltipPos] = useState({ top: 0, left: 0 });

    // Rename State
    const [editingSessionId, setEditingSessionId] = useState(null);
    const [editTitleValue, setEditTitleValue] = useState('');

    // Modal Mode State
    const [modalMode, setModalMode] = useState('create'); // 'create' | 'edit'
    const [targetSessionId, setTargetSessionId] = useState(null);
    const [availableModels, setAvailableModels] = useState([]); // State for API models
    const [loadingModels, setLoadingModels] = useState(true);
    const [copiedMessageId, setCopiedMessageId] = useState(null);

    // Fetch Models on Component Mount
    useEffect(() => {
        const fetchModels = async () => {
            try {
                setLoadingModels(true);
                const response = await fetch('/llm_openai/models');
                if (!response.ok) {
                    throw new Error('Failed to fetch models');
                }
                const data = await response.json();
                setAvailableModels(data.models);

                // Set default model if current selection is not in list (optional)
                if (data.models.length > 0 && !selectedModel) {
                    setSelectedModel(data.models[0].name);
                }
            } catch (error) {
                console.error("Error fetching models:", error);
                // Fallback static models in case of error
                setAvailableModels([
                    { name: 'gpt-5-nano', pricing: { input: '$?', output: '$?' } },
                    { name: 'gpt-4o', pricing: { input: '$?', output: '$?' } }
                ]);
            } finally {
                setLoadingModels(false);
            }
        };

        fetchModels();
    }, []);

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

    const handleOpenCreateModal = () => {
        setModalMode('create');
        setNewSessionTitle('');
        setNewSessionDescription('');
        setSelectedModel('gpt-5-nano');
        setIsModelModalOpen(true);
    };

    const handleOpenEditModal = (e, session) => {
        if (e) e.stopPropagation();
        setModalMode('edit');
        setTargetSessionId(session.id);
        setNewSessionTitle(session.title);
        setNewSessionDescription(session.description);
        setSelectedModel(session.model || 'gpt-5-nano');
        setIsModelModalOpen(true);
    };

    const handleSaveSession = () => {
        if (modalMode === 'create') {
            const newId = Date.now();
            const newSession = {
                id: newId,
                title: newSessionTitle || 'New Chat',
                description: newSessionDescription || 'New conversation started',
                model: selectedModel,
                messages: [],
                timestamp: new Date()
            };
            setSessions(prev => [newSession, ...prev]);
            setActiveSessionId(newId);
            if (isMobile) {
                setMobileView('chat');
            }
        } else {
            // Edit Mode
            setSessions(prev => prev.map(s =>
                s.id === targetSessionId
                    ? {
                        ...s,
                        title: newSessionTitle || s.title,
                        description: newSessionDescription || s.description,
                        model: selectedModel
                    }
                    : s
            ));
        }
        setIsModelModalOpen(false);
    };

    const handleSessionHover = (e, sessionId) => {
        const rect = e.currentTarget.getBoundingClientRect();
        setTooltipPos({
            top: rect.top,
            left: rect.right + 10
        });
        setHoveredSessionId(sessionId);
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
            const newSession = { id: Date.now(), title: 'New Chat', description: 'New conversation started', model: 'gpt-5-nano', messages: [], timestamp: new Date() };
            setSessions([newSession]);
            setActiveSessionId(newSession.id);
        } else {
            setSessions(newSessions);
            if (activeSessionId === sessionId) {
                setActiveSessionId(newSessions[0].id);
            }
        }
    };

    const handleStartRename = (e, session) => {
        e.stopPropagation();
        setEditingSessionId(session.id);
        setEditTitleValue(session.title);
    };

    const handleSaveRename = (e) => {
        e.stopPropagation(); // prevent triggering parent click
        if (editingSessionId) {
            setSessions(prev => prev.map(s =>
                s.id === editingSessionId
                    ? { ...s, title: editTitleValue || 'Untitled' }
                    : s
            ));
            setEditingSessionId(null);
        }
    };

    const handleCancelRename = () => {
        setEditingSessionId(null);
    };

    const handleRenameKeyDown = (e) => {
        if (e.key === 'Enter') {
            handleSaveRename(e);
        } else if (e.key === 'Escape') {
            handleCancelRename();
        }
    };

    const handleCopyMessage = (text, id) => {
        navigator.clipboard.writeText(text);
        setCopiedMessageId(id);
        setTimeout(() => setCopiedMessageId(null), 2000);
    };

    const handleSendMessage = async () => {
        if (!inputValue.trim()) return;

        const currentInput = inputValue; // Capture current input
        setInputValue(''); // Clear input immediately

        const userMessage = {
            id: Date.now(),
            text: currentInput,
            sender: 'user',
            timestamp: new Date().toLocaleString([], { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })
        };

        const botMsgId = Date.now() + 1;
        const initialBotMessage = {
            id: botMsgId,
            text: '', // Start empty
            sender: 'bot',
            timestamp: new Date().toLocaleString([], { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
            model: activeSession?.model || "gpt-5-nano",
            startTime: Date.now(),
            isStreaming: true // Optional flag for UI loading state if desired
        };

        // 1. Add User Message and Initial Bot Message to State
        setSessions(prevSessions => prevSessions.map(session => {
            if (session.id === activeSessionId) {
                const newTitle = session.messages.length === 0
                    ? (currentInput.length > 20 ? currentInput.substring(0, 20) + '...' : currentInput)
                    : session.title;
                return {
                    ...session,
                    messages: [...session.messages, userMessage, initialBotMessage],
                    title: newTitle
                };
            }
            return session;
        }));

        try {
            // 2. Call API (Using proxy: /api -> http://127.0.0.1:8000)
            const response = await fetch('/llm_openai/runs/completions', {
                method: 'POST',
                headers: {
                    'accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    human_message: currentInput,
                    model: activeSession?.model || "gpt-5-nano",
                    stream: true
                })
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`API Error ${response.status}: ${errorText}`);
            }

            // 3. Handle Streaming Response
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let botText = '';
            let buffer = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) {
                    const duration = ((Date.now() - initialBotMessage.startTime) / 1000).toFixed(2);
                    setSessions(prev => prev.map(s => {
                        if (s.id === activeSessionId) {
                            return {
                                ...s,
                                messages: s.messages.map(m =>
                                    m.id === botMsgId
                                        ? { ...m, duration: duration, isStreaming: false }
                                        : m
                                )
                            };
                        }
                        return s;
                    }));
                    break;
                }

                const chunk = decoder.decode(value, { stream: true });
                buffer += chunk;

                // Process complete lines from buffer
                const lines = buffer.split('\n');
                buffer = lines.pop() || ''; // Keep the incomplete line in buffer

                for (const line of lines) {
                    const trimmed = line.trim();
                    if (!trimmed) continue;

                    try {
                        // Check for NDJSON format: {"data": "..."}
                        if (trimmed.startsWith('{')) {
                            const json = JSON.parse(trimmed);
                            const content = json.data || json.content || json.text;
                            if (content) botText += content;
                        }
                        // Check for standard SSE format: data: {...}
                        else if (trimmed.startsWith('data: ')) {
                            const dataStr = trimmed.slice(6);
                            if (dataStr === '[DONE]') continue;

                            const json = JSON.parse(dataStr);
                            const content = json.choices?.[0]?.delta?.content
                                || json.content
                                || json.text
                                || (typeof json === 'string' ? json : '');

                            if (content) botText += content;
                        }
                    } catch (e) {
                        console.warn('Error parsing stream line:', trimmed, e);
                    }
                }

                // Update State with new text
                setSessions(prev => prev.map(s => {
                    if (s.id === activeSessionId) {
                        return {
                            ...s,
                            messages: s.messages.map(m =>
                                m.id === botMsgId
                                    ? { ...m, text: botText }
                                    : m
                            )
                        };
                    }
                    return s;
                }));
            }

        } catch (error) {
            console.error("Failed to fetch bot response:", error);
            // Optionally update the bot message to show an error
            setSessions(prev => prev.map(s => {
                if (s.id === activeSessionId) {
                    return {
                        ...s,
                        messages: s.messages.map(m =>
                            m.id === botMsgId
                                ? { ...m, text: `Error: ${error.message}` }
                                : m
                        )
                    };
                }
                return s;
            }));
        }
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
                        onClick={handleOpenCreateModal}
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
                            onMouseEnter={(e) => handleSessionHover(e, session.id)}
                            onMouseLeave={() => setHoveredSessionId(null)}
                            className={`group flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all border border-transparent relative ${activeSessionId === session.id
                                ? 'bg-slate-800 text-white border-slate-700/50 shadow-md'
                                : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                                }`}
                        >
                            <div className="flex items-center gap-3 overflow-hidden flex-1">
                                <MessageSquare size={18} className={`shrink-0 ${activeSessionId === session.id ? 'text-blue-400' : 'text-slate-600'}`} />
                                {editingSessionId === session.id ? (
                                    <input
                                        type="text"
                                        value={editTitleValue}
                                        onChange={(e) => setEditTitleValue(e.target.value)}
                                        onKeyDown={handleRenameKeyDown}
                                        onClick={(e) => e.stopPropagation()} // Prevent selecting session while clicking input
                                        onBlur={handleSaveRename}
                                        autoFocus
                                        className="bg-slate-900 border border-blue-500/50 rounded px-1.5 py-0.5 text-sm w-full focus:outline-none text-white"
                                    />
                                ) : (
                                    <span className="truncate text-sm font-medium">{session.title}</span>
                                )}
                            </div>
                            {editingSessionId !== session.id && (
                                <div className="flex items-center gap-1 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={(e) => handleStartRename(e, session)}
                                        className="p-1.5 rounded-md hover:bg-blue-500/10 hover:text-blue-400 transition-colors"
                                        title="Rename"
                                    >
                                        <Pencil size={14} />
                                    </button>
                                    <button
                                        onClick={(e) => handleOpenEditModal(e, session)}
                                        className="p-1.5 rounded-md hover:bg-slate-700 hover:text-slate-200 transition-colors"
                                        title="Settings"
                                    >
                                        <Settings size={14} />
                                    </button>
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
                            )}
                        </div>
                    ))}
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
                            ref={buttonRef}
                            onClick={() => {
                                if (!isHeaderMenuOpen && buttonRef.current) {
                                    const rect = buttonRef.current.getBoundingClientRect();
                                    setMenuPos({
                                        top: rect.bottom + 8,
                                        right: window.innerWidth - rect.right
                                    });
                                }
                                setIsHeaderMenuOpen(!isHeaderMenuOpen);
                            }}
                            className="p-2 hover:bg-slate-800 rounded-full text-slate-400 transition-colors"
                        >
                            <MoreVertical size={20} />
                        </button>

                        {createPortal(
                            <AnimatePresence>
                                {isHeaderMenuOpen && (
                                    <>
                                        <div
                                            className="fixed inset-0 z-[100]"
                                            onClick={() => setIsHeaderMenuOpen(false)}
                                        />
                                        <motion.div
                                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                            animate={{ opacity: 1, scale: 1, y: 0 }}
                                            exit={{ opacity: 0, scale: 0.95, y: 10 }}
                                            style={{ top: menuPos.top, right: menuPos.right }}
                                            className="fixed w-48 bg-slate-800 border border-slate-700 rounded-xl shadow-xl z-[101] overflow-hidden origin-top-right"
                                        >
                                            <button
                                                onClick={() => {
                                                    handleOpenCreateModal();
                                                    setIsHeaderMenuOpen(false);
                                                }}
                                                className="w-full text-left px-4 py-3 text-sm text-slate-200 hover:bg-slate-700/50 flex items-center gap-2"
                                            >
                                                <Plus size={16} />
                                                New Chat
                                            </button>
                                            <button
                                                onClick={(e) => {
                                                    handleOpenEditModal(null, activeSession);
                                                    setIsHeaderMenuOpen(false);
                                                }}
                                                className="w-full text-left px-4 py-3 text-sm text-slate-200 hover:bg-slate-700/50 flex items-center gap-2"
                                            >
                                                <Settings size={16} />
                                                Chat Settings
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
                            </AnimatePresence>,
                            document.body
                        )}
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
                                    <div className="flex flex-col items-center gap-1 shrink-0 mt-1">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${message.sender === 'user'
                                            ? 'bg-purple-500/20 text-purple-400'
                                            : 'bg-blue-500/20 text-blue-400'
                                            }`}>
                                            {message.sender === 'user' ? <User size={18} /> : <Bot size={18} />}
                                        </div>
                                        {message.sender === 'bot' && message.model && (
                                            <span className="text-[10px] text-slate-500 font-medium tracking-tight uppercase text-center max-w-[6rem] leading-none">
                                                {message.model}
                                            </span>
                                        )}
                                    </div>
                                    <div className={`space-y-2 max-w-[80%] md:max-w-[80%] group relative`}>
                                        <div className={`p-3 md:p-4 rounded-2xl shadow-md text-sm md:text-base ${message.sender === 'user'
                                            ? 'bg-gradient-to-br from-blue-600 to-purple-600 text-white rounded-tr-none'
                                            : 'bg-slate-800/50 text-slate-200 border border-slate-700/50 rounded-tl-none'
                                            }`}>
                                            {message.sender === 'user' || message.text ? (
                                                <div className="relative">
                                                    <p className="whitespace-pre-wrap break-words">{message.text}</p>
                                                    <button
                                                        onClick={() => handleCopyMessage(message.text, message.id)}
                                                        className={`absolute top-0 p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-all opacity-0 group-hover:opacity-100 shadow-sm border border-slate-700/50 ${message.sender === 'user'
                                                                ? 'left-0 -translate-x-[calc(100%+8px)]'
                                                                : 'right-0 translate-x-[calc(100%+8px)]'
                                                            }`}
                                                    >
                                                        {copiedMessageId === message.id ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="flex gap-1 h-5 items-center px-1">
                                                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                                                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                                                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></span>
                                                </div>
                                            )}
                                        </div>
                                        <div className={`flex items-center gap-2 text-xs text-slate-500 px-1 ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                                            <span>{message.timestamp}</span>
                                            {message.duration && (
                                                <span className="text-slate-600 bg-slate-800/50 px-1.5 rounded border border-slate-700/50">
                                                    {message.duration}s
                                                </span>
                                            )}
                                        </div>
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
            {/* Model Selection Modal */}
            <AnimatePresence>
                {isModelModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden"
                        >
                            <div className="p-6 border-b border-slate-800 flex justify-between items-center">
                                <h3 className="text-xl font-semibold text-white">
                                    {modalMode === 'create' ? 'New Chat' : 'Edit Chat'}
                                </h3>
                                <button
                                    onClick={() => setIsModelModalOpen(false)}
                                    className="text-slate-400 hover:text-white transition-colors"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="p-6 space-y-6">
                                <div className="space-y-4">
                                    <label className="text-sm font-medium text-slate-400 uppercase tracking-wider">Title (Optional)</label>
                                    <input
                                        type="text"
                                        value={newSessionTitle}
                                        onChange={(e) => setNewSessionTitle(e.target.value)}
                                        placeholder="e.g. My Awesome Project"
                                        className="w-full bg-slate-800/50 border border-slate-700/50 rounded-xl px-4 py-3 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                                    />
                                </div>

                                <div className="space-y-4">
                                    <label className="text-sm font-medium text-slate-400 uppercase tracking-wider">Description (Optional)</label>
                                    <input
                                        type="text"
                                        value={newSessionDescription}
                                        onChange={(e) => setNewSessionDescription(e.target.value)}
                                        placeholder="e.g. Python Script Debugging"
                                        className="w-full bg-slate-800/50 border border-slate-700/50 rounded-xl px-4 py-3 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                                    />
                                </div>

                                <div className="space-y-4">
                                    <label className="text-sm font-medium text-slate-400 uppercase tracking-wider">Select Model</label>
                                    <div className="grid gap-3 max-h-60 overflow-y-auto custom-scrollbar pr-1">
                                        {loadingModels ? (
                                            <div className="text-slate-400 text-center py-4">Loading models...</div>
                                        ) : availableModels.length === 0 ? (
                                            <div className="text-slate-400 text-center py-4">No models available.</div>
                                        ) : (
                                            availableModels.map((model) => (
                                                <div
                                                    key={model.name}
                                                    onClick={() => setSelectedModel(model.name)}
                                                    className={`p-4 rounded-xl border cursor-pointer transition-all flex items-center gap-4 ${selectedModel === model.name
                                                        ? 'bg-blue-600/10 border-blue-500/50 shadow-inner'
                                                        : 'bg-slate-800/50 border-slate-700/50 hover:bg-slate-800 hover:border-slate-600'
                                                        }`}
                                                >
                                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${selectedModel === model.name ? 'border-blue-500' : 'border-slate-500'
                                                        }`}>
                                                        {selectedModel === model.name && <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <div className={`font-medium truncate ${selectedModel === model.name ? 'text-blue-400' : 'text-slate-200'}`}>
                                                            {model.name}
                                                        </div>
                                                        <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                                                            <span className="bg-slate-700/50 px-1.5 py-0.5 rounded text-[10px] text-slate-400 border border-slate-700">
                                                                In: {model.pricing?.input}
                                                            </span>
                                                            <span className="bg-slate-700/50 px-1.5 py-0.5 rounded text-[10px] text-slate-400 border border-slate-700">
                                                                Out: {model.pricing?.output}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="p-6 border-t border-slate-800 flex justify-end gap-3 bg-slate-800/20">
                                <button
                                    onClick={() => setIsModelModalOpen(false)}
                                    className="px-4 py-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors font-medium"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSaveSession}
                                    className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-all shadow-lg shadow-blue-900/20 font-medium"
                                >
                                    {modalMode === 'create' ? 'Start Chat' : 'Save Changes'}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Session Info Tooltip */}
            {
                hoveredSessionId && !isMobile && createPortal(
                    <div
                        className="fixed z-[100] p-4 bg-slate-900/90 backdrop-blur-xl border border-slate-700 rounded-xl shadow-xl w-64 pointer-events-none animate-in fade-in zoom-in-95 duration-200"
                        style={{
                            top: tooltipPos.top,
                            left: tooltipPos.left
                        }}
                    >
                        {sessions.find(s => s.id === hoveredSessionId) && (
                            <div className="space-y-3">
                                <div>
                                    <h4 className="text-slate-200 font-medium border-b border-slate-700/50 pb-2 mb-2">
                                        {sessions.find(s => s.id === hoveredSessionId).title}
                                    </h4>
                                    <div className="flex items-start gap-2 text-xs text-slate-400 mb-1">
                                        <Info size={14} className="mt-0.5 shrink-0 text-blue-400" />
                                        <span className="leading-tight">{sessions.find(s => s.id === hoveredSessionId).description}</span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 text-xs text-slate-400">
                                    <Calendar size={14} className="shrink-0 text-purple-400" />
                                    <span>{new Date(sessions.find(s => s.id === hoveredSessionId).timestamp).toLocaleString()}</span>
                                </div>

                                <div className="flex items-center gap-2 text-xs text-slate-400">
                                    <Cpu size={14} className="shrink-0 text-green-400" />
                                    <span className="uppercase tracking-wider font-semibold text-slate-300">
                                        {sessions.find(s => s.id === hoveredSessionId).model || 'Unknown Model'}
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>,
                    document.body
                )
            }
        </div >
    );
};

export default ChatInterface;
