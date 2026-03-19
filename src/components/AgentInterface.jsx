import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
    Send, Bot, User, Plus, Trash2, Eraser, ChevronLeft, MoreVertical,
    Copy, Check, Search, Settings, Wrench, Zap, ChevronDown, ChevronRight,
    Terminal, Play, Square, RefreshCw, Info, Cpu, X, AlertCircle
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { createPortal } from 'react-dom';

// ── Code Block ────────────────────────────────────────────────────────────────
const CodeBlock = ({ lang, code }) => {
    const [isCopied, setIsCopied] = useState(false);
    return (
        <div className="rounded-lg overflow-hidden border border-slate-700/50 bg-[#1e1e1e] shadow-lg my-2 group/code">
            <div className="flex items-center justify-between px-3 py-1.5 bg-white/5 border-b border-white/5">
                <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">{lang || 'text'}</span>
                <button
                    onClick={() => { navigator.clipboard.writeText(code); setIsCopied(true); setTimeout(() => setIsCopied(false), 2000); }}
                    className="flex items-center gap-1.5 text-[10px] text-slate-400 hover:text-white transition-colors"
                >
                    {isCopied ? <Check size={12} className="text-green-400" /> : <Copy size={12} />}
                    {isCopied ? 'Copied!' : 'Copy'}
                </button>
            </div>
            <div className="p-3 overflow-x-auto custom-scrollbar">
                <pre className="font-mono text-sm text-slate-300 leading-relaxed font-normal"><code>{code}</code></pre>
            </div>
        </div>
    );
};

// ── Message Renderer ──────────────────────────────────────────────────────────
const renderMessageContent = (text) => {
    if (!text) return null;
    const parts = text.split(/```(\w*)\n([\s\S]*?)```/g);
    return (
        <div className="space-y-2">
            {parts.map((part, index) => {
                if (index % 3 === 0) {
                    if (!part) return null;
                    return <div key={index} className="whitespace-pre-wrap">{part}</div>;
                } else if (index % 3 === 2) {
                    const lang = parts[index - 1] || 'text';
                    return <CodeBlock key={index} lang={lang} code={part} />;
                }
                return null;
            })}
        </div>
    );
};

// ── Tool Badge ────────────────────────────────────────────────────────────────
const ToolBadge = ({ tool, variant = 'system' }) => {
    const isSystem = variant === 'system';
    const colors = isSystem
        ? { border: 'hover:border-emerald-500/30', icon: 'bg-emerald-500/10 group-hover:bg-emerald-500/20', iconText: 'text-emerald-400', dot: 'bg-emerald-500' }
        : { border: 'hover:border-violet-500/30', icon: 'bg-violet-500/10 group-hover:bg-violet-500/20', iconText: 'text-violet-400', dot: 'bg-violet-400' };

    return (
        <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex items-start gap-3 p-3 rounded-xl bg-slate-800/60 border border-slate-700/40 ${colors.border} hover:bg-slate-800/80 transition-all group cursor-default`}
        >
            <div className={`mt-0.5 w-7 h-7 rounded-lg ${colors.icon} flex items-center justify-center shrink-0 transition-colors`}>
                <Wrench size={14} className={colors.iconText} />
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                    <p className="text-xs font-semibold text-slate-200 font-mono truncate">{tool.name}</p>
                    {tool.has_implementation && (
                        <span className={`w-1.5 h-1.5 rounded-full ${colors.dot} shrink-0`} title="Has implementation" />
                    )}
                </div>
                {tool.description && (
                    <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed line-clamp-2">{tool.description}</p>
                )}
            </div>
        </motion.div>
    );
};


// ── Tool Call Block (shown inside messages when agent uses a tool) ─────────────
const ToolCallBlock = ({ toolName, args, result }) => {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <div className="my-2 rounded-lg border border-violet-500/20 bg-violet-950/20 overflow-hidden">
            <button
                onClick={() => setIsOpen(v => !v)}
                className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-violet-500/5 transition-colors"
            >
                <Terminal size={13} className="text-violet-400 shrink-0" />
                <span className="text-xs font-mono text-violet-300 flex-1 truncate">Tool: {toolName}</span>
                {isOpen ? <ChevronDown size={13} className="text-violet-500" /> : <ChevronRight size={13} className="text-violet-500" />}
            </button>
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="px-3 pb-3 space-y-2 border-t border-violet-500/10">
                            {args && (
                                <div>
                                    <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1 mt-2">Input</p>
                                    <pre className="font-mono text-[11px] text-slate-300 bg-slate-900/60 rounded-lg p-2 overflow-x-auto">
                                        {typeof args === 'string' ? args : JSON.stringify(args, null, 2)}
                                    </pre>
                                </div>
                            )}
                            {result && (
                                <div>
                                    <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Output</p>
                                    <pre className="font-mono text-[11px] text-emerald-300/80 bg-slate-900/60 rounded-lg p-2 overflow-x-auto">
                                        {typeof result === 'string' ? result : JSON.stringify(result, null, 2)}
                                    </pre>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

// ── Main Component ─────────────────────────────────────────────────────────────
const AgentInterface = () => {
    const navigate = useNavigate();
    const { session_id: urlSessionId } = useParams();

    // Sessions
    const [sessions, setSessions] = useState([]);
    const [activeSessionId, setActiveSessionId] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');

    // Chat
    const [inputValue, setInputValue] = useState('');
    const [isStreaming, setIsStreaming] = useState(false);
    const abortControllerRef = useRef(null);
    const messagesEndRef = useRef(null);

    // Tools panel
    const [systemTools, setSystemTools] = useState([]);
    const [ownerTools, setOwnerTools] = useState([]);
    const [loadingTools, setLoadingTools] = useState(true);
    const [showToolsPanel, setShowToolsPanel] = useState(true);

    // Mobile
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
    const [mobileView, setMobileView] = useState('list'); // 'list' | 'chat'

    // Modals
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [newSessionTitle, setNewSessionTitle] = useState('');
    const [newSessionDesc, setNewSessionDesc] = useState('');
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [sessionToDelete, setSessionToDelete] = useState(null);
    const [isClearModalOpen, setIsClearModalOpen] = useState(false);
    const [sessionToClear, setSessionToClear] = useState(null);

    // Header menu
    const [isHeaderMenuOpen, setIsHeaderMenuOpen] = useState(false);
    const [menuPos, setMenuPos] = useState({ top: 0, right: 0 });
    const buttonRef = useRef(null);

    // Copy
    const [copiedMessageId, setCopiedMessageId] = useState(null);

    const activeSession = sessions.find(s => s.id === activeSessionId) || sessions[0] || null;

    // ── Init ──────────────────────────────────────────────────────────────────
    useEffect(() => {
        fetchTools();
        fetchSessions();
    }, []);

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth < 768);
            if (window.innerWidth >= 768) setMobileView('chat');
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Auto-scroll
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [activeSession?.messages]);

    // ── Fetch Tools ───────────────────────────────────────────────────────────
    const fetchTools = async () => {
        try {
            setLoadingTools(true);
            const username = localStorage.getItem('username') || '';
            const [sysRes, ownerRes] = await Promise.all([
                fetch('/agent/tools'),
                username ? fetch(`/agent/tools?owner=${username}`) : Promise.resolve(null),
            ]);

            if (!sysRes.ok) throw new Error('Failed to fetch system tools');
            const sysData = await sysRes.json();
            setSystemTools(Array.isArray(sysData) ? sysData : (sysData.tools || []));

            if (ownerRes && ownerRes.ok) {
                const ownerData = await ownerRes.json();
                // Exclude any that are already system-owned (owner === 'system')
                const ownerList = Array.isArray(ownerData) ? ownerData : (ownerData.tools || []);
                setOwnerTools(ownerList.filter(t => t.owner !== 'system'));
            } else {
                setOwnerTools([]);
            }
        } catch (err) {
            console.error('Error fetching tools:', err);
            setSystemTools([]);
            setOwnerTools([]);
        } finally {
            setLoadingTools(false);
        }
    };

    // ── Fetch Sessions (local storage only for now) ───────────────────────────
    const fetchSessions = () => {
        try {
            const stored = localStorage.getItem('agentSessions');
            if (stored) {
                const parsed = JSON.parse(stored);
                setSessions(parsed);
                const initial = urlSessionId && parsed.find(s => s.id === urlSessionId)
                    ? urlSessionId
                    : (parsed[0]?.id || null);
                setActiveSessionId(initial);
                if (initial && urlSessionId !== initial) {
                    navigate(`/agents/${initial}`, { replace: true });
                }
            }
        } catch (e) {
            console.error('Error loading agent sessions:', e);
        }
    };

    const persistSessions = (updated) => {
        localStorage.setItem('agentSessions', JSON.stringify(updated));
    };

    // ── Session CRUD ──────────────────────────────────────────────────────────
    const handleCreateSession = () => {
        const id = `agent-${Date.now()}`;
        const newSession = {
            id,
            title: newSessionTitle.trim() || 'New Agent Session',
            description: newSessionDesc.trim() || '',
            messages: [],
            createdAt: new Date().toISOString(),
        };
        const updated = [newSession, ...sessions];
        setSessions(updated);
        persistSessions(updated);
        setActiveSessionId(id);
        navigate(`/agents/${id}`);
        setIsCreateModalOpen(false);
        setNewSessionTitle('');
        setNewSessionDesc('');
        if (isMobile) setMobileView('chat');
    };

    const handleDeleteSession = () => {
        if (!sessionToDelete) return;
        const updated = sessions.filter(s => s.id !== sessionToDelete);
        setSessions(updated);
        persistSessions(updated);
        if (activeSessionId === sessionToDelete) {
            const next = updated[0]?.id || null;
            setActiveSessionId(next);
            if (next) navigate(`/agents/${next}`); else navigate('/agents');
        }
        setIsDeleteModalOpen(false);
        setSessionToDelete(null);
    };

    const handleClearSession = () => {
        if (!sessionToClear) return;
        const updated = sessions.map(s =>
            s.id === sessionToClear ? { ...s, messages: [] } : s
        );
        setSessions(updated);
        persistSessions(updated);
        setIsClearModalOpen(false);
        setSessionToClear(null);
    };

    const handleSelectSession = (id) => {
        setActiveSessionId(id);
        navigate(`/agents/${id}`);
        if (isMobile) setMobileView('chat');
    };

    // ── Send Message ──────────────────────────────────────────────────────────
    const handleSend = async () => {
        const text = inputValue.trim();
        if (!text || isStreaming || !activeSession) return;

        setInputValue('');
        setIsStreaming(true);

        const userMsg = {
            id: `u-${Date.now()}`,
            role: 'user',
            content: text,
            timestamp: new Date().toISOString(),
        };
        const botMsgId = `b-${Date.now()}`;
        const botMsg = {
            id: botMsgId,
            role: 'assistant',
            content: '',
            timestamp: new Date().toISOString(),
            isStreaming: true,
            toolCalls: [],
        };

        const addMessages = (prev) => prev.map(s =>
            s.id === activeSessionId
                ? { ...s, messages: [...s.messages, userMsg, botMsg] }
                : s
        );
        setSessions(addMessages);

        const controller = new AbortController();
        abortControllerRef.current = controller;

        try {
            const res = await fetch('/agent/runs/completions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'accept': 'application/json' },
                body: JSON.stringify({
                    human_message: text,
                    stream: true,
                }),
                signal: controller.signal,
            });

            if (!res.ok) {
                const errText = await res.text();
                throw new Error(`API Error ${res.status}: ${errText}`);
            }

            const reader = res.body.getReader();
            const decoder = new TextDecoder();
            let botText = '';
            let toolCalls = [];
            let buffer = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop() || '';

                for (const line of lines) {
                    const trimmed = line.trim();
                    if (!trimmed) continue;
                    try {
                        let json = null;
                        if (trimmed.startsWith('{')) {
                            json = JSON.parse(trimmed);
                        } else if (trimmed.startsWith('data: ')) {
                            const dataStr = trimmed.slice(6);
                            if (dataStr === '[DONE]') continue;
                            json = JSON.parse(dataStr);
                        }
                        if (json) {
                            if (json.tool_start) {
                                toolCalls.push({
                                    name: json.tool_start,
                                    args: typeof json.input === 'string' ? json.input : JSON.stringify(json.input || {}),
                                    result: null
                                });
                            }
                            if (json.tool_end) {
                                for (let i = toolCalls.length - 1; i >= 0; i--) {
                                    if (toolCalls[i].name === json.tool_end && toolCalls[i].result === null) {
                                        toolCalls[i].result = typeof json.output === 'string' ? json.output : JSON.stringify(json.output);
                                        break;
                                    }
                                }
                            }
                            
                            const content = json.data ?? json.content ?? json.text 
                                ?? json.choices?.[0]?.delta?.content ?? '';
                            if (content) botText += content;
                        }
                    } catch (e) {
                        // ignore parse errors on individual lines
                    }
                }

                const captured = botText;
                setSessions(prev => prev.map(s =>
                    s.id === activeSessionId
                        ? {
                            ...s,
                            messages: s.messages.map(m =>
                                m.id === botMsgId ? { ...m, content: captured, toolCalls: [...toolCalls] } : m
                            )
                        }
                        : s
                ));
            }

            // Finalise
            setSessions(prev => {
                const updated = prev.map(s =>
                    s.id === activeSessionId
                        ? {
                            ...s,
                            messages: s.messages.map(m =>
                                m.id === botMsgId ? { ...m, content: botText, toolCalls: [...toolCalls], isStreaming: false } : m
                            )
                        }
                        : s
                );
                persistSessions(updated);
                return updated;
            });

        } catch (err) {
            if (err.name === 'AbortError') {
                setSessions(prev => {
                    const updated = prev.map(s =>
                        s.id === activeSessionId
                            ? {
                                ...s, messages: s.messages.map(m =>
                                    m.id === botMsgId ? { ...m, content: m.content + '\n\n_[Stopped]_', isStreaming: false } : m
                                )
                            }
                            : s
                    );
                    persistSessions(updated);
                    return updated;
                });
            } else {
                setSessions(prev => {
                    const updated = prev.map(s =>
                        s.id === activeSessionId
                            ? {
                                ...s, messages: s.messages.map(m =>
                                    m.id === botMsgId ? { ...m, content: `Error: ${err.message}`, isStreaming: false } : m
                                )
                            }
                            : s
                    );
                    persistSessions(updated);
                    return updated;
                });
            }
        } finally {
            setIsStreaming(false);
            abortControllerRef.current = null;
        }
    };

    const handleStop = () => {
        abortControllerRef.current?.abort();
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const handleCopyMessage = (text, id) => {
        navigator.clipboard.writeText(text);
        setCopiedMessageId(id);
        setTimeout(() => setCopiedMessageId(null), 2000);
    };

    // ── Render ─────────────────────────────────────────────────────────────────
    const showSessionList = !isMobile || mobileView === 'list';
    const showChatArea = !isMobile || mobileView === 'chat';
    const filteredSessions = sessions.filter(s =>
        s.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="flex h-full w-full bg-slate-900 text-slate-100 overflow-hidden relative">

            {/* ── Left: Session List ──────────────────────────────────────────── */}
            <div className={`${showSessionList ? 'flex' : 'hidden'} ${isMobile ? 'w-full pt-16' : 'w-64'} bg-slate-900/90 border-r border-slate-700/50 flex-col flex-shrink-0 backdrop-blur-xl`}>
                <div className="p-4 space-y-3">
                    <button
                        id="agent-new-session-btn"
                        onClick={() => setIsCreateModalOpen(true)}
                        className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white p-3 rounded-xl transition-all shadow-lg shadow-violet-900/30 group"
                    >
                        <Plus size={18} className="group-hover:rotate-90 transition-transform duration-300" />
                        <span className="font-medium text-sm">New Agent Session</span>
                    </button>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
                        <input
                            type="text"
                            placeholder="Search sessions..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="w-full bg-slate-800/50 border border-slate-700/50 rounded-xl py-2 pl-8 pr-3 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-all"
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto px-2 space-y-1 custom-scrollbar pb-4">
                    {filteredSessions.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-12 text-slate-600 gap-3">
                            <Bot size={32} className="opacity-40" />
                            <p className="text-xs text-center">No sessions yet.<br />Create one to get started.</p>
                        </div>
                    )}
                    {filteredSessions.map(session => (
                        <div
                            key={session.id}
                            onClick={() => handleSelectSession(session.id)}
                            className={`group flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all border ${activeSessionId === session.id
                                ? 'bg-violet-900/30 border-violet-700/50 text-white shadow-md'
                                : 'border-transparent text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                                }`}
                        >
                            <div className="flex items-center gap-2.5 overflow-hidden flex-1">
                                <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${activeSessionId === session.id ? 'bg-violet-500/20' : 'bg-slate-800'}`}>
                                    <Zap size={14} className={activeSessionId === session.id ? 'text-violet-400' : 'text-slate-600'} />
                                </div>
                                <span className="truncate text-sm font-medium">{session.title}</span>
                            </div>
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                    onClick={e => { e.stopPropagation(); setSessionToClear(session.id); setIsClearModalOpen(true); }}
                                    className="p-1.5 rounded-md hover:bg-yellow-500/10 hover:text-yellow-400 transition-colors"
                                    title="Clear History"
                                ><Eraser size={12} /></button>
                                <button
                                    onClick={e => { e.stopPropagation(); setSessionToDelete(session.id); setIsDeleteModalOpen(true); }}
                                    className="p-1.5 rounded-md hover:bg-red-500/10 hover:text-red-400 transition-colors"
                                    title="Delete Session"
                                ><Trash2 size={12} /></button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* ── Middle: Chat Area ───────────────────────────────────────────── */}
            <div className={`${showChatArea ? 'flex' : 'hidden'} flex-1 flex-col h-full relative overflow-hidden`}>
                {/* Header */}
                <div className={`h-16 border-b border-slate-700/50 flex items-center justify-between px-4 md:px-6 bg-slate-900/80 backdrop-blur-md sticky top-0 z-10 ${isMobile ? 'pl-16' : ''}`}>
                    <div className="flex items-center gap-3">
                        {isMobile && (
                            <button onClick={() => setMobileView('list')} className="p-1 hover:bg-slate-800 rounded-lg text-slate-400">
                                <ChevronLeft size={22} />
                            </button>
                        )}
                        <div className="w-9 h-9 rounded-full bg-violet-500/20 flex items-center justify-center">
                            <Zap size={20} className="text-violet-400" />
                        </div>
                        <div>
                            <h2 className="text-base font-semibold text-white leading-tight">
                                {activeSession?.title || 'Agent'}
                            </h2>
                            <div className="flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                <span className="text-[11px] text-slate-400">{systemTools.length + ownerTools.length} tools available</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Tools Panel Toggle */}
                        {!isMobile && (
                            <button
                                onClick={() => setShowToolsPanel(v => !v)}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${showToolsPanel
                                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                    : 'bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-700/50'
                                    }`}
                                title="Toggle tools panel"
                            >
                                <Wrench size={13} />
                                Tools
                            </button>
                        )}

                        {/* Header Menu */}
                        <div className="relative">
                            <button
                                ref={buttonRef}
                                onClick={() => {
                                    if (!isHeaderMenuOpen && buttonRef.current) {
                                        const rect = buttonRef.current.getBoundingClientRect();
                                        setMenuPos({ top: rect.bottom + 8, right: window.innerWidth - rect.right });
                                    }
                                    setIsHeaderMenuOpen(v => !v);
                                }}
                                className="p-2 hover:bg-slate-800 rounded-full text-slate-400 transition-colors"
                            >
                                <MoreVertical size={18} />
                            </button>
                            {createPortal(
                                <AnimatePresence>
                                    {isHeaderMenuOpen && (
                                        <>
                                            <div className="fixed inset-0 z-[100]" onClick={() => setIsHeaderMenuOpen(false)} />
                                            <motion.div
                                                initial={{ opacity: 0, scale: 0.95, y: 8 }}
                                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                                exit={{ opacity: 0, scale: 0.95, y: 8 }}
                                                style={{ top: menuPos.top, right: menuPos.right }}
                                                className="fixed w-48 bg-slate-800 border border-slate-700 rounded-xl shadow-xl z-[101] overflow-hidden"
                                            >
                                                <button
                                                    onClick={() => { setIsCreateModalOpen(true); setIsHeaderMenuOpen(false); }}
                                                    className="w-full text-left px-4 py-3 text-sm text-slate-200 hover:bg-slate-700/50 flex items-center gap-2"
                                                ><Plus size={15} />New Session</button>
                                                <button
                                                    onClick={() => { if (activeSession) { setSessionToClear(activeSession.id); setIsClearModalOpen(true); } setIsHeaderMenuOpen(false); }}
                                                    className="w-full text-left px-4 py-3 text-sm text-slate-200 hover:bg-slate-700/50 flex items-center gap-2"
                                                ><Eraser size={15} />Clear History</button>
                                                <div className="h-px bg-slate-700/50 mx-2" />
                                                <button
                                                    onClick={() => { fetchTools(); setIsHeaderMenuOpen(false); }}
                                                    className="w-full text-left px-4 py-3 text-sm text-slate-200 hover:bg-slate-700/50 flex items-center gap-2"
                                                ><RefreshCw size={15} />Refresh Tools</button>
                                            </motion.div>
                                        </>
                                    )}
                                </AnimatePresence>,
                                document.body
                            )}
                        </div>
                    </div>
                </div>

                {/* Messages */}
                {!activeSession ? (
                    <div className="flex-1 flex flex-col items-center justify-center gap-6 p-8">
                        <div className="w-20 h-20 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
                            <Zap size={40} className="text-violet-400" />
                        </div>
                        <div className="text-center space-y-2">
                            <h3 className="text-xl font-semibold text-slate-200">Agent Sessions</h3>
                            <p className="text-sm text-slate-500 max-w-sm">
                                Create a new session to start interacting with the AI agent. The agent has access to {systemTools.length + ownerTools.length} registered tool{(systemTools.length + ownerTools.length) !== 1 ? 's' : ''}.
                            </p>
                        </div>
                        <button
                            onClick={() => setIsCreateModalOpen(true)}
                            className="flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white px-5 py-2.5 rounded-xl font-medium text-sm transition-all shadow-lg shadow-violet-900/30"
                        >
                            <Plus size={16} /> New Agent Session
                        </button>
                    </div>
                ) : (
                    <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 custom-scrollbar">
                        {activeSession.messages.length === 0 && (
                            <div className="flex flex-col items-center justify-center py-20 gap-4 text-slate-600">
                                <Bot size={40} className="opacity-30" />
                                <p className="text-sm">Send a message to start the conversation.</p>
                            </div>
                        )}
                        {activeSession.messages.map(msg => (
                            <motion.div
                                key={msg.id}
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.2 }}
                                className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
                            >
                                {/* Avatar */}
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-1 ${msg.role === 'user'
                                    ? 'bg-blue-600/20 text-blue-400'
                                    : 'bg-violet-500/20 text-violet-400'
                                    }`}>
                                    {msg.role === 'user' ? <User size={16} /> : <Zap size={16} />}
                                </div>

                                {/* Bubble */}
                                <div className={`group max-w-[75%] flex flex-col gap-1 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                                    <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed relative ${msg.role === 'user'
                                        ? 'bg-blue-600/20 border border-blue-500/20 text-slate-100 rounded-tr-sm'
                                        : 'bg-slate-800/70 border border-slate-700/50 text-slate-200 rounded-tl-sm'
                                        }`}>
                                        {msg.toolCalls?.map((tc, i) => (
                                            <ToolCallBlock key={i} toolName={tc.name} args={tc.args} result={tc.result} />
                                        ))}
                                        {msg.isStreaming && (!msg.content || !msg.content.trim()) ? (
                                            <div className="flex gap-1 h-5 items-center px-1">
                                                <span className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                                                <span className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                                                <span className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce"></span>
                                            </div>
                                        ) : (
                                            renderMessageContent(msg.content)
                                        )}
                                    </div>
                                    {/* Actions */}
                                    <div className={`flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                                        <button
                                            onClick={() => handleCopyMessage(msg.content, msg.id)}
                                            className="p-1 rounded hover:bg-slate-700/50 text-slate-500 hover:text-slate-300 transition-colors"
                                            title="Copy"
                                        >
                                            {copiedMessageId === msg.id ? <Check size={12} className="text-green-400" /> : <Copy size={12} />}
                                        </button>
                                        <span className="text-[10px] text-slate-600 px-1">
                                            {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                        <div ref={messagesEndRef} />
                    </div>
                )}

                {/* Input Bar */}
                {activeSession && (
                    <div className="border-t border-slate-700/50 p-4 bg-slate-900/80 backdrop-blur-md">
                        <div className="flex items-end gap-3 bg-slate-800/60 border border-slate-700/50 rounded-2xl px-4 py-3 focus-within:border-violet-500/50 focus-within:ring-1 focus-within:ring-violet-500/20 transition-all">
                            <textarea
                                value={inputValue}
                                onChange={e => setInputValue(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Message the agent..."
                                rows={1}
                                className="flex-1 bg-transparent text-sm text-slate-200 placeholder-slate-500 resize-none outline-none max-h-32 custom-scrollbar leading-relaxed"
                                style={{ overflowY: inputValue.split('\n').length > 4 ? 'auto' : 'hidden' }}
                                disabled={isStreaming}
                            />
                            {isStreaming ? (
                                <button
                                    onClick={handleStop}
                                    className="w-9 h-9 flex items-center justify-center rounded-xl bg-red-600/20 hover:bg-red-600/30 text-red-400 transition-all border border-red-500/20 shrink-0"
                                    title="Stop"
                                >
                                    <Square size={15} fill="currentColor" />
                                </button>
                            ) : (
                                <button
                                    onClick={handleSend}
                                    disabled={!inputValue.trim()}
                                    className="w-9 h-9 flex items-center justify-center rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-30 disabled:cursor-not-allowed text-white transition-all shadow-md shrink-0"
                                    title="Send"
                                >
                                    <Send size={15} />
                                </button>
                            )}
                        </div>
                        <p className="text-[10px] text-slate-600 mt-2 text-center">
                            Enter to send · Shift+Enter for new line
                        </p>
                    </div>
                )}
            </div>

            {/* ── Right: Tools Panel ──────────────────────────────────────────── */}
            <AnimatePresence>
                {showToolsPanel && !isMobile && (
                    <motion.div
                        initial={{ width: 0, opacity: 0 }}
                        animate={{ width: 280, opacity: 1 }}
                        exit={{ width: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: 'easeInOut' }}
                        className="border-l border-slate-700/50 bg-slate-900/70 flex flex-col overflow-hidden shrink-0"
                    >
                        <div className="h-16 border-b border-slate-700/50 flex items-center justify-between px-4">
                            <div className="flex items-center gap-2">
                                <Wrench size={15} className="text-emerald-400" />
                                <span className="text-sm font-semibold text-slate-200">Available Tools</span>
                                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
                                    {systemTools.length + ownerTools.length}
                                </span>
                            </div>
                            <button
                                onClick={fetchTools}
                                className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-400 hover:bg-slate-800 transition-colors"
                                title="Refresh tools"
                            >
                                <RefreshCw size={13} className={loadingTools ? 'animate-spin' : ''} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-3 space-y-4 custom-scrollbar">
                            {loadingTools ? (
                                <div className="flex flex-col gap-2 mt-4">
                                    {[1, 2, 3].map(i => (
                                        <div key={i} className="h-14 rounded-xl bg-slate-800/50 animate-pulse" />
                                    ))}
                                </div>
                            ) : systemTools.length === 0 && ownerTools.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-12 text-slate-600 gap-3">
                                    <Wrench size={28} className="opacity-30" />
                                    <p className="text-xs text-center">No tools registered.<br />Check backend.</p>
                                </div>
                            ) : (
                                <>
                                    {/* System Tools */}
                                    {systemTools.length > 0 && (
                                        <div>
                                            <div className="flex items-center gap-2 mb-2 px-1">
                                                <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">System</span>
                                                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-800 text-slate-500 font-mono border border-slate-700/50">{systemTools.length}</span>
                                            </div>
                                            <div className="space-y-2">
                                                {systemTools.map((tool, i) => <ToolBadge key={tool.name || i} tool={tool} variant="system" />)}
                                            </div>
                                        </div>
                                    )}

                                    {/* Owner Tools */}
                                    {ownerTools.length > 0 && (
                                        <div>
                                            <div className="flex items-center gap-2 mb-2 px-1">
                                                <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">My Tools</span>
                                                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-800 text-slate-500 font-mono border border-slate-700/50">{ownerTools.length}</span>
                                            </div>
                                            <div className="space-y-2">
                                                {ownerTools.map((tool, i) => <ToolBadge key={tool.name || i} tool={tool} variant="owner" />)}
                                            </div>
                                        </div>
                                    )}

                                    {/* Empty owner section hint */}
                                    {ownerTools.length === 0 && (
                                        <div className="px-1">
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">My Tools</span>
                                                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-800 text-slate-600 font-mono border border-slate-700/50">0</span>
                                            </div>
                                            <p className="text-[11px] text-slate-600 pl-1">No custom tools yet.</p>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>

                        {/* Future: Create Tool Button */}
                        <div className="p-3 border-t border-slate-700/50">
                            <button
                                disabled
                                className="w-full flex items-center justify-center gap-2 p-2.5 rounded-xl border border-dashed border-slate-700/50 text-slate-600 text-xs cursor-not-allowed hover:border-slate-600 transition-colors"
                                title="Coming soon"
                            >
                                <Plus size={13} />
                                Create Tool <span className="text-[10px] text-slate-700">(coming soon)</span>
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Create Session Modal ─────────────────────────────────────────── */}
            {createPortal(
                <AnimatePresence>
                    {isCreateModalOpen && (
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4"
                            onClick={() => setIsCreateModalOpen(false)}
                        >
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: 16 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: 16 }}
                                onClick={e => e.stopPropagation()}
                                className="w-full max-w-md max-h-[90vh] bg-slate-900 border border-slate-700/50 rounded-2xl shadow-2xl overflow-y-auto"
                            >
                                <div className="flex items-center justify-between p-6 border-b border-slate-700/50">
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-xl bg-violet-500/10 flex items-center justify-center">
                                            <Zap size={18} className="text-violet-400" />
                                        </div>
                                        <h3 className="text-base font-semibold text-slate-100">New Agent Session</h3>
                                    </div>
                                    <button onClick={() => setIsCreateModalOpen(false)} className="p-1.5 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition-colors">
                                        <X size={16} />
                                    </button>
                                </div>
                                <div className="p-6 space-y-4">
                                    <div>
                                        <label className="block text-xs font-medium text-slate-400 mb-1.5">Session Title</label>
                                        <input
                                            type="text"
                                            value={newSessionTitle}
                                            onChange={e => setNewSessionTitle(e.target.value)}
                                            onKeyDown={e => e.key === 'Enter' && handleCreateSession()}
                                            placeholder="e.g. Research Assistant"
                                            autoFocus
                                            className="w-full bg-slate-800/60 border border-slate-700/50 rounded-xl px-4 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-all"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-slate-400 mb-1.5">Description <span className="text-slate-600">(optional)</span></label>
                                        <textarea
                                            value={newSessionDesc}
                                            onChange={e => setNewSessionDesc(e.target.value)}
                                            placeholder="What will this agent help you with?"
                                            rows={2}
                                            className="w-full bg-slate-800/60 border border-slate-700/50 rounded-xl px-4 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-all resize-none"
                                        />
                                    </div>
                                    {/* Future: Agent selection, tool pinning, etc. */}
                                    <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-800/40 border border-slate-700/30">
                                        <Info size={13} className="text-slate-500 shrink-0" />
                                        <p className="text-[11px] text-slate-500">{systemTools.length + ownerTools.length} tool{(systemTools.length + ownerTools.length) !== 1 ? 's' : ''} will be available in this session.</p>
                                    </div>
                                </div>
                                <div className="flex gap-3 p-6 pt-0">
                                    <button
                                        onClick={() => setIsCreateModalOpen(false)}
                                        className="flex-1 py-2.5 rounded-xl border border-slate-700/50 text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 text-sm font-medium transition-all"
                                    >Cancel</button>
                                    <button
                                        onClick={handleCreateSession}
                                        className="flex-1 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium transition-all shadow-lg shadow-violet-900/30"
                                    >Create Session</button>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>,
                document.body
            )}

            {/* ── Delete Confirm Modal ─────────────────────────────────────────── */}
            {createPortal(
                <AnimatePresence>
                    {isDeleteModalOpen && (
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4"
                            onClick={() => setIsDeleteModalOpen(false)}
                        >
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                onClick={e => e.stopPropagation()}
                                className="w-full max-w-sm bg-slate-900 border border-slate-700/50 rounded-2xl shadow-2xl p-6 space-y-4"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
                                        <Trash2 size={18} className="text-red-400" />
                                    </div>
                                    <div>
                                        <h3 className="text-base font-semibold text-slate-100">Delete Session</h3>
                                        <p className="text-xs text-slate-500">This action cannot be undone.</p>
                                    </div>
                                </div>
                                <div className="flex gap-3">
                                    <button onClick={() => setIsDeleteModalOpen(false)} className="flex-1 py-2.5 rounded-xl border border-slate-700/50 text-slate-400 hover:text-slate-200 text-sm font-medium transition-all">Cancel</button>
                                    <button onClick={handleDeleteSession} className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-sm font-medium transition-all">Delete</button>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>,
                document.body
            )}


            {/* ── Clear Confirm Modal ──────────────────────────────────────────── */}
            {createPortal(
                <AnimatePresence>
                    {isClearModalOpen && (
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4"
                            onClick={() => setIsClearModalOpen(false)}
                        >
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                onClick={e => e.stopPropagation()}
                                className="w-full max-w-sm bg-slate-900 border border-slate-700/50 rounded-2xl shadow-2xl p-6 space-y-4"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-yellow-500/10 flex items-center justify-center">
                                        <Eraser size={18} className="text-yellow-400" />
                                    </div>
                                    <div>
                                        <h3 className="text-base font-semibold text-slate-100">Clear History</h3>
                                        <p className="text-xs text-slate-500">All messages will be removed.</p>
                                    </div>
                                </div>
                                <div className="flex gap-3">
                                    <button onClick={() => setIsClearModalOpen(false)} className="flex-1 py-2.5 rounded-xl border border-slate-700/50 text-slate-400 hover:text-slate-200 text-sm font-medium transition-all">Cancel</button>
                                    <button onClick={handleClearSession} className="flex-1 py-2.5 rounded-xl bg-yellow-600 hover:bg-yellow-500 text-white text-sm font-medium transition-all">Clear</button>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>,
                document.body
            )}
        </div>
    );
};

export default AgentInterface;
