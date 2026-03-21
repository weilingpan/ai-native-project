import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Plus, Search, ChevronLeft, ChevronRight, X, Send, Square,
    Database, FileText, Upload, Trash2, RefreshCw, Check,
    AlertCircle, Copy, CheckCheck, MoreVertical, Zap, Bot,
    Info
} from 'lucide-react';
import classNames from 'classnames';
import { useNavigate, useParams } from 'react-router-dom';

// ── Source citation pill ────────────────────────────────────────────────────
const SourcePill = ({ source, onClick }) => (
    <button
        onClick={() => onClick(source)}
        className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-300 bg-emerald-950/40 border border-emerald-500/20 rounded-full px-2 py-0.5 hover:bg-emerald-900/50 hover:border-emerald-500/40 transition-colors"
    >
        <FileText size={10} className="shrink-0" />
        <span className="max-w-[140px] truncate">{source.filename}</span>
        {source.page != null && (
            <span className="text-emerald-500/70">· p.{source.page}</span>
        )}
    </button>
);

// ── Markdown-ish message renderer (simple version) ─────────────────────────
const renderMessageContent = (content) => {
    if (!content) return null;
    const lines = content.split('\n');
    return lines.map((line, i) => {
        if (line.startsWith('### ')) return <h3 key={i} className="text-base font-semibold mt-3 mb-1 text-slate-100">{line.slice(4)}</h3>;
        if (line.startsWith('## '))  return <h2 key={i} className="text-lg font-bold mt-3 mb-1 text-slate-100">{line.slice(3)}</h2>;
        if (line.startsWith('# '))   return <h1 key={i} className="text-xl font-bold mt-3 mb-1 text-slate-100">{line.slice(2)}</h1>;
        if (line.startsWith('- ') || line.startsWith('* '))
            return <li key={i} className="ml-4 list-disc text-slate-300">{line.slice(2)}</li>;
        if (line.trim() === '') return <br key={i} />;
        // inline bold
        const parts = line.split(/(\*\*.*?\*\*)/g);
        return (
            <p key={i} className="text-slate-300 leading-relaxed">
                {parts.map((part, j) =>
                    part.startsWith('**') && part.endsWith('**')
                        ? <strong key={j} className="text-slate-100 font-semibold">{part.slice(2, -2)}</strong>
                        : part
                )}
            </p>
        );
    });
};

// ── Main component ──────────────────────────────────────────────────────────
const RagInterface = () => {
    const navigate = useNavigate();
    const { session_id: urlSessionId } = useParams();

    // Sessions
    const [sessions, setSessions] = useState([]);
    const [activeSessionId, setActiveSessionId] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [hoveredSession, setHoveredSession] = useState(null);
    const [sessionTitleOverflow, setSessionTitleOverflow] = useState(0);

    // Layout
    const [isSessionListOpen, setIsSessionListOpen] = useState(true);
    const [isKBPanelOpen, setIsKBPanelOpen] = useState(true);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
    const [mobileView, setMobileView] = useState('list');

    // Chat
    const [inputValue, setInputValue] = useState('');
    const [isStreaming, setIsStreaming] = useState(false);
    const abortControllerRef = useRef(null);
    const messagesEndRef = useRef(null);
    const textareaRef = useRef(null);

    // Knowledge Base
    const [files, setFiles] = useState([]);
    const [isDragOver, setIsDragOver] = useState(false);
    const fileInputRef = useRef(null);

    // Source Viewer
    const [selectedSource, setSelectedSource] = useState(null);

    // Modals
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [newSessionTitle, setNewSessionTitle] = useState('');
    const [newSessionDesc, setNewSessionDesc] = useState('');
    const [newSessionModel, setNewSessionModel] = useState('');
    const [availableModels, setAvailableModels] = useState([]);
    const [loadingModels, setLoadingModels] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [sessionToDelete, setSessionToDelete] = useState(null);
    const [isCreating, setIsCreating] = useState(false);

    // Copy
    const [copiedMessageId, setCopiedMessageId] = useState(null);

    // ── Derived ──────────────────────────────────────────────────────────────
    const showSessionList = isMobile ? mobileView === 'list' : isSessionListOpen;
    const showChatArea = !isMobile || mobileView === 'chat';
    const activeSession = sessions.find(s => s.id === activeSessionId) || null;
    const messages = activeSession?.messages || [];
    const filteredSessions = sessions.filter(s =>
        s.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // ── Effects ──────────────────────────────────────────────────────────────
    useEffect(() => {
        fetchSessions();
        fetchModels();
    }, []);

    useEffect(() => {
        if (sessions.length === 0) return;
        if (urlSessionId) {
            const match = sessions.find(s => s.id === urlSessionId);
            if (match) {
                setActiveSessionId(urlSessionId);
            } else {
                navigate(`/rag/${sessions[0].id}`, { replace: true });
            }
        } else if (!activeSessionId) {
            setActiveSessionId(sessions[0].id);
            navigate(`/rag/${sessions[0].id}`, { replace: true });
        }
    }, [sessions, urlSessionId]);

    useEffect(() => {
        if (activeSessionId) {
            fetchFiles();
        }
    }, [activeSessionId]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    useEffect(() => {
        const handleResize = () => {
            const mobile = window.innerWidth < 768;
            setIsMobile(mobile);
            if (mobile && isSessionListOpen) setIsSessionListOpen(false);
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [isSessionListOpen]);

    // ── API helpers ───────────────────────────────────────────────────────────
    const fetchSessions = async () => {
        try {
            const username = localStorage.getItem('username') || 'regina';
            const res = await fetch(`/chat_session/?owner=${username}&mode=rag`);
            if (!res.ok) throw new Error();
            const data = await res.json();
            const ragSessions = (Array.isArray(data) ? data : [])
                .filter(s => s.mode === 'rag')
                .map(s => ({
                    ...s,
                    messages: s.messages || [],
                    timestamp: s.created_at || new Date().toISOString(),
                }))
                .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
            setSessions(ragSessions);
        } catch {
            setSessions([]);
        }
    };

    const fetchModels = async () => {
        setLoadingModels(true);
        try {
            const res = await fetch('/llm_openai/models');
            if (!res.ok) throw new Error();
            const data = await res.json();
            const models = data.models || [];
            setAvailableModels(models);
            if (models.length > 0) setNewSessionModel(models[0].name);
        } catch {
            const fallback = [{ name: 'gpt-4o' }, { name: 'gpt-4o-mini' }];
            setAvailableModels(fallback);
            setNewSessionModel(fallback[0].name);
        } finally {
            setLoadingModels(false);
        }
    };

    const fetchFiles = async () => {
        try {
            const owner = localStorage.getItem('username') || 'regina';
            const res = await fetch(`/documents?collection=documents&owner=${owner}`, {
                headers: { accept: 'application/json' },
            });
            if (!res.ok) throw new Error();
            const data = await res.json();
            // Deduplicate by filename — API returns one entry per chunk
            const seen = new Set();
            const unique = (Array.isArray(data) ? data : []).filter(d => {
                if (seen.has(d.filename)) return false;
                seen.add(d.filename);
                return true;
            });
            setFiles(unique.map(d => ({ id: d.doc_id, name: d.filename, status: 'ready' })));
        } catch {
            setFiles([]);
        }
    };

    const handleCreateSession = async () => {
        if (!newSessionTitle.trim() || isCreating) return;
        setIsCreating(true);
        try {
            const username = localStorage.getItem('username') || 'regina';
            const res = await fetch('/chat_session/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    owner: username,
                    mode: 'rag',
                    session_type: 'text',
                    title: newSessionTitle.trim(),
                    description: newSessionDesc.trim(),
                    model: newSessionModel,
                }),
            });
            if (!res.ok) throw new Error();
            const created = await res.json();
            const newSession = { ...created, messages: [] };
            setSessions(prev => [newSession, ...prev]);
            setActiveSessionId(newSession.id);
            navigate(`/rag/${newSession.id}`);
            setIsCreateModalOpen(false);
            setNewSessionTitle('');
            setNewSessionDesc('');
            setNewSessionModel(availableModels[0]?.name || '');
            if (isMobile) setMobileView('chat');
        } catch (err) {
            console.error('Failed to create session:', err);
        } finally {
            setIsCreating(false);
        }
    };

    const handleDeleteSession = async () => {
        if (!sessionToDelete) return;
        try {
            await fetch(`/chat_session/${sessionToDelete}`, { method: 'DELETE' });
        } catch { /* ignore */ }
        const remaining = sessions.filter(s => s.id !== sessionToDelete);
        setSessions(remaining);
        if (activeSessionId === sessionToDelete) {
            const next = remaining[0];
            setActiveSessionId(next?.id || null);
            if (next) navigate(`/rag/${next.id}`);
            else navigate('/rag');
        }
        setIsDeleteModalOpen(false);
        setSessionToDelete(null);
    };

    const handleSelectSession = (sessionId) => {
        setActiveSessionId(sessionId);
        navigate(`/rag/${sessionId}`);
        if (isMobile) setMobileView('chat');
    };

    // ── Chat ─────────────────────────────────────────────────────────────────
    const handleSend = async () => {
        const text = inputValue.trim();
        if (!text || isStreaming || !activeSessionId) return;

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
            sources: [],
            timestamp: new Date().toISOString(),
            isStreaming: true,
        };

        setSessions(prev => prev.map(s =>
            s.id === activeSessionId
                ? { ...s, messages: [...s.messages, userMsg, botMsg] }
                : s
        ));
        setInputValue('');
        setIsStreaming(true);

        const controller = new AbortController();
        abortControllerRef.current = controller;

        try {
            const docId = files.find(f => f.status === 'ready')?.id;
            const res = await fetch('/documents/query', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', accept: 'application/json' },
                body: JSON.stringify({
                    human_message: text,
                    doc_id: docId,
                    chat_session_id: activeSessionId,
                }),
                signal: controller.signal,
            });
            if (!res.ok) throw new Error('Request failed');

            const data = await res.json();
            const botText = data.answer || data.response || data.content || JSON.stringify(data);
            const sources = data.sources || [];

            setSessions(prev => prev.map(s =>
                s.id === activeSessionId
                    ? {
                        ...s, messages: s.messages.map(m =>
                            m.id === botMsgId
                                ? { ...m, content: botText, sources, isStreaming: false }
                                : m
                        )
                    }
                    : s
            ));
        } catch (err) {
            if (err.name !== 'AbortError') {
                setSessions(prev => prev.map(s =>
                    s.id === activeSessionId
                        ? {
                            ...s, messages: s.messages.map(m =>
                                m.id === botMsgId
                                    ? { ...m, content: 'Something went wrong. Please try again.', isStreaming: false }
                                    : m
                            )
                        }
                        : s
                ));
            }
        } finally {
            setIsStreaming(false);
            abortControllerRef.current = null;
        }
    };

    const handleStop = () => {
        abortControllerRef.current?.abort();
        setSessions(prev => prev.map(s =>
            s.id === activeSessionId
                ? { ...s, messages: s.messages.map(m => m.isStreaming ? { ...m, isStreaming: false } : m) }
                : s
        ));
        setIsStreaming(false);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    // ── File upload ───────────────────────────────────────────────────────────
    const handleFileUpload = useCallback(async (file) => {
        if (!activeSessionId) return;
        const allowed = ['.pdf', '.txt', '.docx', '.md'];
        if (!allowed.some(ext => file.name.toLowerCase().endsWith(ext))) return;

        const tempId = `f-${Date.now()}-${Math.random()}`;
        setFiles(prev => [...prev, { id: tempId, name: file.name, status: 'uploading', progress: 0 }]);

        const progressInterval = setInterval(() => {
            setFiles(prev => prev.map(f =>
                f.id === tempId && f.progress < 90 ? { ...f, progress: f.progress + 15 } : f
            ));
        }, 150);

        try {
            const owner = localStorage.getItem('username') || 'regina';
            const formData = new FormData();
            formData.append('file', file);
            formData.append('collection', 'documents');
            formData.append('owner', owner);
            formData.append('chunk_size', '500');
            formData.append('chunk_overlap', '50');

            const res = await fetch('/documents/upload', {
                method: 'POST',
                headers: { accept: 'application/json' },
                body: formData,
            });
            clearInterval(progressInterval);
            if (!res.ok) throw new Error();
            // Upload is synchronous — file is indexed immediately
            setFiles(prev => prev.map(f =>
                f.id === tempId ? { ...f, id: file.name, status: 'ready', progress: 100 } : f
            ));
        } catch {
            clearInterval(progressInterval);
            setFiles(prev => prev.map(f =>
                f.id === tempId ? { ...f, status: 'error', progress: 0 } : f
            ));
        }
    }, [activeSessionId]);

    const handleDeleteFile = (fileId) => {
        setFiles(prev => prev.filter(f => f.id !== fileId));
    };

    const handleCopyMessage = (text, id) => {
        navigator.clipboard.writeText(text);
        setCopiedMessageId(id);
        setTimeout(() => setCopiedMessageId(null), 2000);
    };

    const formatFileSize = (bytes) => {
        if (!bytes) return '';
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <div className="flex h-full w-full bg-slate-900 text-slate-100 overflow-hidden relative">

            {/* ── Left: Session List ──────────────────────────────────────── */}
            <AnimatePresence initial={false}>
                {showSessionList && (
                    <motion.div
                        initial={isMobile ? false : { width: 0, opacity: 0 }}
                        animate={isMobile ? {} : { width: 200, opacity: 1 }}
                        exit={isMobile ? {} : { width: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: 'easeInOut' }}
                        className={`${isMobile ? 'w-full pt-16' : ''} bg-slate-900/90 border-r border-slate-700/50 flex flex-col flex-shrink-0 backdrop-blur-xl overflow-hidden`}
                    >
                        {/* Header */}
                        <div className="p-2.5 space-y-2">
                            <div className="flex items-center justify-between gap-2">
                                <button
                                    onClick={() => setIsCreateModalOpen(true)}
                                    className="flex-1 flex items-center justify-center gap-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white py-2 px-3 rounded-lg transition-all shadow-md shadow-emerald-900/30 group"
                                >
                                    <Plus size={14} className="group-hover:rotate-90 transition-transform duration-300 shrink-0" />
                                    <span className="font-medium text-xs whitespace-nowrap">New Session</span>
                                </button>
                                {!isMobile && (
                                    <button
                                        onClick={() => setIsSessionListOpen(false)}
                                        className="p-1.5 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition-colors shrink-0"
                                        title="Collapse session list"
                                    >
                                        <ChevronLeft size={14} />
                                    </button>
                                )}
                            </div>
                            <div className="relative">
                                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" size={12} />
                                <input
                                    type="text"
                                    placeholder="Search..."
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    className="w-full bg-slate-800/50 border border-slate-700/50 rounded-lg py-1.5 pl-7 pr-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
                                />
                            </div>
                        </div>

                        {/* Session list */}
                        <div className="flex-1 overflow-y-auto px-1.5 space-y-0.5 custom-scrollbar pb-3">
                            {filteredSessions.length === 0 && (
                                <div className="flex flex-col items-center justify-center py-10 text-slate-600 gap-2">
                                    <Database size={24} className="opacity-40" />
                                    <p className="text-[11px] text-center">No sessions yet.</p>
                                </div>
                            )}
                            {filteredSessions.map(session => (
                                <div
                                    key={session.id}
                                    onClick={() => handleSelectSession(session.id)}
                                    onMouseEnter={e => {
                                        const span = e.currentTarget.querySelector('[data-title-span]');
                                        if (span) setSessionTitleOverflow(Math.max(0, span.scrollWidth - span.offsetWidth));
                                        setHoveredSession(session.id);
                                    }}
                                    onMouseLeave={() => { setHoveredSession(null); setSessionTitleOverflow(0); }}
                                    className={`group flex items-center justify-between px-2 py-1.5 rounded-lg cursor-pointer transition-all border ${activeSessionId === session.id
                                        ? 'bg-emerald-900/30 border-emerald-700/50 text-white'
                                        : 'border-transparent text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                                        }`}
                                >
                                    <div className="flex items-center gap-2 overflow-hidden flex-1">
                                        <div className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 ${activeSessionId === session.id ? 'bg-emerald-500/20' : 'bg-slate-800'}`}>
                                            <Database size={11} className={activeSessionId === session.id ? 'text-emerald-400' : 'text-slate-600'} />
                                        </div>
                                        <span
                                            data-title-span
                                            className="text-xs font-medium whitespace-nowrap"
                                            style={hoveredSession === session.id && sessionTitleOverflow > 0 ? {
                                                display: 'inline-block',
                                                animation: `marquee-session ${Math.max(1.5, sessionTitleOverflow / 40)}s ease-in-out infinite alternate`,
                                                '--marquee-dist': `-${sessionTitleOverflow}px`,
                                            } : {
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                display: 'block',
                                            }}
                                        >{session.title}</span>
                                    </div>
                                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                                        <button
                                            onClick={e => { e.stopPropagation(); setSessionToDelete(session.id); setIsDeleteModalOpen(true); }}
                                            className="p-1 rounded hover:bg-red-500/10 hover:text-red-400 transition-colors"
                                            title="Delete"
                                        ><Trash2 size={11} /></button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Center: Chat Area ───────────────────────────────────────── */}
            {showChatArea && (
                <div className="flex-1 flex flex-col min-w-0 h-full">
                    {/* Chat Header */}
                    <div className="h-12 border-b border-slate-700/50 bg-slate-900/80 backdrop-blur-sm flex items-center px-3 gap-2 shrink-0">
                        {/* Session list reopen */}
                        {!isMobile && !isSessionListOpen && (
                            <button
                                onClick={() => setIsSessionListOpen(true)}
                                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition-colors shrink-0"
                                title="Open session list"
                            >
                                <ChevronRight size={15} />
                            </button>
                        )}
                        {isMobile && (
                            <button onClick={() => setMobileView('list')} className="p-1.5 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition-colors">
                                <ChevronLeft size={15} />
                            </button>
                        )}

                        {/* Title */}
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                            <div className="w-6 h-6 rounded-md bg-emerald-500/20 flex items-center justify-center shrink-0">
                                <Database size={13} className="text-emerald-400" />
                            </div>
                            <span className="text-sm font-semibold truncate text-slate-200">
                                {activeSession?.title || 'RAG Session'}
                            </span>
                        </div>

                        {/* KB panel reopen */}
                        {!isMobile && !isKBPanelOpen && (
                            <button
                                onClick={() => setIsKBPanelOpen(true)}
                                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition-colors shrink-0"
                                title="Open knowledge base"
                            >
                                <ChevronLeft size={15} />
                            </button>
                        )}
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col px-4 py-4">
                        {!activeSession ? (
                            // Empty state — no session selected
                            <div className="flex-1 flex flex-col items-center justify-center gap-4 text-slate-600">
                                <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                                    <Database size={28} className="text-emerald-500/60" />
                                </div>
                                <div className="text-center">
                                    <p className="text-slate-400 font-medium mb-1">No session selected</p>
                                    <p className="text-sm text-slate-600">Create a new session to get started</p>
                                </div>
                                <button
                                    onClick={() => setIsCreateModalOpen(true)}
                                    className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                                >
                                    <Plus size={15} />
                                    New RAG Session
                                </button>
                            </div>
                        ) : messages.length === 0 ? (
                            // Session exists but no messages yet
                            <div className="flex-1 flex flex-col items-center justify-center gap-3 text-slate-600">
                                <div className="w-14 h-14 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                                    <Zap size={22} className="text-emerald-500/60" />
                                </div>
                                <div className="text-center">
                                    <p className="text-slate-400 font-medium mb-1">Ask about your documents</p>
                                    <p className="text-sm text-slate-600">Upload files to the knowledge base, then start asking questions</p>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-4">
                            {messages.map(msg => (
                                <div
                                    key={msg.id}
                                    className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                >
                                    {msg.role === 'assistant' && (
                                        <div className="w-7 h-7 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center shrink-0 mt-1">
                                            <Bot size={13} className="text-emerald-400" />
                                        </div>
                                    )}
                                    <div className={`max-w-[75%] ${msg.role === 'user' ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                                        <div className={`relative group rounded-2xl px-4 py-3 shadow-md text-sm ${msg.role === 'user'
                                            ? 'bg-gradient-to-br from-emerald-600 to-teal-600 text-white rounded-tr-none'
                                            : 'bg-slate-800/80 border border-slate-700/50 rounded-tl-none'
                                            }`}>
                                            {msg.isStreaming && msg.content === '' ? (
                                                <div className="flex gap-1 py-1">
                                                    {[0, 1, 2].map(i => (
                                                        <motion.div key={i} className="w-1.5 h-1.5 bg-emerald-400 rounded-full"
                                                            animate={{ y: [0, -4, 0] }}
                                                            transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }} />
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="prose prose-invert prose-sm max-w-none">
                                                    {renderMessageContent(msg.content)}
                                                </div>
                                            )}
                                            {/* Copy button */}
                                            {!msg.isStreaming && (
                                                <button
                                                    onClick={() => handleCopyMessage(msg.content, msg.id)}
                                                    className="absolute top-2 right-2 p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity text-slate-500 hover:text-slate-300 hover:bg-slate-700/50"
                                                >
                                                    {copiedMessageId === msg.id
                                                        ? <CheckCheck size={11} className="text-emerald-400" />
                                                        : <Copy size={11} />}
                                                </button>
                                            )}
                                        </div>
                                        {/* Sources */}
                                        {msg.role === 'assistant' && msg.sources?.length > 0 && (
                                            <div className="flex flex-wrap gap-1.5 max-w-full pl-1">
                                                <span className="text-[10px] text-slate-500 uppercase tracking-wider w-full">Sources</span>
                                                {msg.sources.map((src, i) => (
                                                    <SourcePill key={i} source={src} onClick={setSelectedSource} />
                                                ))}
                                            </div>
                                        )}
                                        <span className="text-[10px] text-slate-600 px-1">
                                            {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                </div>
                            ))}
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input Bar */}
                    <div className="border-t border-slate-700/50 bg-slate-900/80 backdrop-blur-sm px-4 py-3">
                        <div className="flex items-end gap-2">
                            <textarea
                                ref={textareaRef}
                                value={inputValue}
                                onChange={e => setInputValue(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder={activeSession ? 'Ask about your documents...' : 'Select a session to start'}
                                disabled={!activeSession || isStreaming}
                                rows={1}
                                className="flex-1 bg-slate-800/60 border border-slate-700/50 rounded-xl px-4 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 resize-none transition-all disabled:opacity-40 custom-scrollbar"
                                style={{ maxHeight: '120px', overflowY: 'auto' }}
                            />
                            {isStreaming ? (
                                <button
                                    onClick={handleStop}
                                    className="p-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-300 transition-colors shrink-0"
                                    title="Stop"
                                >
                                    <Square size={16} />
                                </button>
                            ) : (
                                <button
                                    onClick={handleSend}
                                    disabled={!inputValue.trim() || !activeSession}
                                    className="p-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white transition-colors shrink-0"
                                    title="Send (Enter)"
                                >
                                    <Send size={16} />
                                </button>
                            )}
                        </div>
                        <p className="text-[10px] text-slate-600 mt-1.5 pl-1">Enter to send · Shift+Enter for new line</p>
                    </div>
                </div>
            )}

            {/* ── Right: Knowledge Base Panel ─────────────────────────────── */}
            <AnimatePresence>
                {isKBPanelOpen && !isMobile && (
                    <motion.div
                        initial={{ width: 0, opacity: 0 }}
                        animate={{ width: 260, opacity: 1 }}
                        exit={{ width: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: 'easeInOut' }}
                        className="bg-slate-900/90 border-l border-slate-700/50 flex flex-col flex-shrink-0 backdrop-blur-xl overflow-hidden"
                    >
                        {/* KB Header */}
                        <div className="h-12 border-b border-slate-700/50 flex items-center justify-between px-3 shrink-0">
                            <div className="flex items-center gap-2">
                                <Upload size={13} className="text-emerald-400" />
                                <span className="text-xs font-semibold text-slate-300">Knowledge Base</span>
                            </div>
                            <button
                                onClick={() => setIsKBPanelOpen(false)}
                                className="p-1 rounded text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition-colors"
                                title="Collapse"
                            >
                                <ChevronRight size={14} />
                            </button>
                        </div>

                        {/* Upload Zone */}
                        <div
                            onDragOver={e => { e.preventDefault(); setIsDragOver(true); }}
                            onDragLeave={() => setIsDragOver(false)}
                            onDrop={e => {
                                e.preventDefault();
                                setIsDragOver(false);
                                if (!activeSession) return;
                                Array.from(e.dataTransfer.files).forEach(handleFileUpload);
                            }}
                            onClick={() => activeSession && fileInputRef.current?.click()}
                            className={classNames(
                                'mx-3 my-3 border-2 border-dashed rounded-xl p-4 text-center transition-all',
                                activeSession ? 'cursor-pointer' : 'opacity-40 cursor-not-allowed',
                                isDragOver && activeSession
                                    ? 'border-emerald-500/60 bg-emerald-900/20'
                                    : 'border-slate-700/50 hover:border-emerald-600/40 hover:bg-slate-800/30'
                            )}
                        >
                            <Upload size={18} className="mx-auto text-slate-500 mb-1.5" />
                            <p className="text-[11px] text-slate-500">
                                Drop files or <span className="text-emerald-400">browse</span>
                            </p>
                            <p className="text-[10px] text-slate-600 mt-0.5">PDF · TXT · DOCX · MD</p>
                        </div>
                        <input
                            ref={fileInputRef}
                            type="file"
                            multiple
                            accept=".pdf,.txt,.docx,.md"
                            className="hidden"
                            onChange={e => Array.from(e.target.files).forEach(handleFileUpload)}
                        />

                        {/* File List */}
                        <div className="flex-1 overflow-y-auto custom-scrollbar px-2 space-y-1 pb-2">
                            {files.length === 0 && (
                                <div className="flex flex-col items-center justify-center py-8 text-slate-600 gap-2">
                                    <FileText size={20} className="opacity-40" />
                                    <p className="text-[11px] text-center">No files uploaded yet</p>
                                </div>
                            )}
                            {files.map(file => (
                                <div key={file.id} className="group px-2.5 py-2 rounded-lg bg-slate-800/40 border border-slate-700/30 hover:border-slate-600/50 transition-colors">
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex items-start gap-2 min-w-0 flex-1">
                                            <FileText size={13} className={classNames('shrink-0 mt-0.5', {
                                                'text-emerald-400': file.status === 'ready',
                                                'text-slate-500': file.status === 'uploading' || file.status === 'indexing',
                                                'text-red-400': file.status === 'error',
                                            })} />
                                            <div className="min-w-0 flex-1">
                                                <p className="text-[11px] font-medium text-slate-300 truncate">{file.name}</p>
                                                <p className="text-[10px] text-slate-600">{formatFileSize(file.size)}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1 shrink-0">
                                            {/* Status icon */}
                                            {file.status === 'ready' && <Check size={12} className="text-emerald-400" />}
                                            {file.status === 'indexing' && <RefreshCw size={12} className="text-emerald-400 animate-spin" />}
                                            {file.status === 'error' && <AlertCircle size={12} className="text-red-400" />}
                                            {/* Delete */}
                                            <button
                                                onClick={() => handleDeleteFile(file.id)}
                                                className="p-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500/10 hover:text-red-400 text-slate-500"
                                                title="Delete file"
                                            >
                                                <Trash2 size={11} />
                                            </button>
                                        </div>
                                    </div>
                                    {/* Upload progress bar */}
                                    {file.status === 'uploading' && (
                                        <div className="mt-2 h-1 bg-slate-700 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-emerald-500 rounded-full transition-all duration-150"
                                                style={{ width: `${file.progress}%` }}
                                            />
                                        </div>
                                    )}
                                    {file.status === 'indexing' && (
                                        <p className="text-[10px] text-emerald-500/70 mt-1">Indexing...</p>
                                    )}
                                    {file.status === 'error' && (
                                        <p className="text-[10px] text-red-400/70 mt-1">Upload failed</p>
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* KB Footer */}
                        <div className="px-3 py-2 border-t border-slate-700/50 text-[10px] text-slate-500">
                            {files.length} file{files.length !== 1 ? 's' : ''} · {files.filter(f => f.status === 'ready').length} ready
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Source Viewer Overlay ───────────────────────────────────── */}
            {createPortal(
                <AnimatePresence>
                    {selectedSource && (
                        <>
                            <motion.div
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                onClick={() => setSelectedSource(null)}
                                className="fixed inset-0 bg-black/50 z-[300]"
                            />
                            <motion.div
                                initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
                                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                                className="fixed right-0 top-0 h-full w-full max-w-md bg-slate-900 border-l border-slate-700/50 z-[301] flex flex-col shadow-2xl"
                            >
                                <div className="h-14 border-b border-slate-700/50 flex items-center justify-between px-4 shrink-0">
                                    <div className="flex items-center gap-2 min-w-0">
                                        <FileText size={15} className="text-emerald-400 shrink-0" />
                                        <span className="text-sm font-semibold text-slate-200 truncate">{selectedSource.filename}</span>
                                        {selectedSource.page != null && (
                                            <span className="text-xs text-slate-500 shrink-0">· p.{selectedSource.page}</span>
                                        )}
                                    </div>
                                    <button
                                        onClick={() => setSelectedSource(null)}
                                        className="p-1.5 rounded-lg text-slate-500 hover:text-slate-200 hover:bg-slate-800 transition-colors shrink-0 ml-2"
                                    >
                                        <X size={15} />
                                    </button>
                                </div>
                                <div className="flex-1 overflow-y-auto p-5 custom-scrollbar">
                                    <div className="text-[11px] text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                                        <Info size={11} />
                                        Source Chunk
                                    </div>
                                    <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">
                                        {selectedSource.chunk_text}
                                    </p>
                                </div>
                            </motion.div>
                        </>
                    )}
                </AnimatePresence>,
                document.body
            )}

            {/* ── Create Session Modal ────────────────────────────────────── */}
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
                                        <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                                            <Database size={18} className="text-emerald-400" />
                                        </div>
                                        <h3 className="text-base font-semibold text-slate-100">New RAG Session</h3>
                                    </div>
                                    <button onClick={() => setIsCreateModalOpen(false)} className="p-1.5 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition-colors">
                                        <X size={16} />
                                    </button>
                                </div>
                                <div className="p-6 space-y-4">
                                    <div>
                                        <label className="block text-xs font-medium text-slate-400 mb-1.5">Session Name *</label>
                                        <input
                                            type="text"
                                            value={newSessionTitle}
                                            onChange={e => setNewSessionTitle(e.target.value)}
                                            onKeyDown={e => e.key === 'Enter' && handleCreateSession()}
                                            placeholder="e.g. Product Documentation Q&A"
                                            autoFocus
                                            className="w-full bg-slate-800/60 border border-slate-700/50 rounded-xl px-4 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-slate-400 mb-1.5">LLM Model *</label>
                                        {loadingModels ? (
                                            <div className="flex items-center gap-2 text-xs text-slate-500 py-2.5">
                                                <RefreshCw size={12} className="animate-spin" />
                                                Loading models...
                                            </div>
                                        ) : (
                                            <select
                                                value={newSessionModel}
                                                onChange={e => setNewSessionModel(e.target.value)}
                                                className="w-full bg-slate-800/60 border border-slate-700/50 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all appearance-none cursor-pointer"
                                            >
                                                {availableModels.map(m => (
                                                    <option key={m.name} value={m.name}>{m.name}</option>
                                                ))}
                                            </select>
                                        )}
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-slate-400 mb-1.5">Description</label>
                                        <textarea
                                            value={newSessionDesc}
                                            onChange={e => setNewSessionDesc(e.target.value)}
                                            placeholder="What documents will you upload? (optional)"
                                            rows={2}
                                            className="w-full bg-slate-800/60 border border-slate-700/50 rounded-xl px-4 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all resize-none"
                                        />
                                    </div>
                                </div>
                                <div className="flex justify-end gap-3 px-6 pb-6">
                                    <button
                                        onClick={() => setIsCreateModalOpen(false)}
                                        className="px-4 py-2 text-sm text-slate-400 hover:text-slate-200 rounded-xl hover:bg-slate-800 transition-colors"
                                    >Cancel</button>
                                    <button
                                        onClick={handleCreateSession}
                                        disabled={!newSessionTitle.trim() || isCreating}
                                        className="px-4 py-2 text-sm font-medium bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl transition-colors flex items-center gap-2"
                                    >
                                        {isCreating && <RefreshCw size={13} className="animate-spin" />}
                                        Create
                                    </button>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>,
                document.body
            )}

            {/* ── Delete Session Modal ────────────────────────────────────── */}
            {createPortal(
                <AnimatePresence>
                    {isDeleteModalOpen && (
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4"
                            onClick={() => setIsDeleteModalOpen(false)}
                        >
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: 16 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: 16 }}
                                onClick={e => e.stopPropagation()}
                                className="w-full max-w-sm bg-slate-900 border border-slate-700/50 rounded-2xl shadow-2xl"
                            >
                                <div className="p-6">
                                    <h2 className="text-base font-bold text-slate-100 mb-2">Delete Session?</h2>
                                    <p className="text-sm text-slate-400">
                                        This will permanently delete the session, all messages, and all uploaded files.
                                    </p>
                                </div>
                                <div className="flex justify-end gap-3 px-6 pb-6">
                                    <button
                                        onClick={() => setIsDeleteModalOpen(false)}
                                        className="px-4 py-2 text-sm text-slate-400 hover:text-slate-200 rounded-xl hover:bg-slate-800 transition-colors"
                                    >Cancel</button>
                                    <button
                                        onClick={handleDeleteSession}
                                        className="px-4 py-2 text-sm font-medium bg-red-600 hover:bg-red-500 text-white rounded-xl transition-colors"
                                    >Delete</button>
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

export default RagInterface;
