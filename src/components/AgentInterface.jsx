import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
    Send, Bot, User, Plus, Trash2, Eraser, ChevronLeft, ChevronRight, MoreVertical,
    Copy, Check, Search, Settings, Wrench, Zap,
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
    const [isSessionListOpen, setIsSessionListOpen] = useState(true);
    const [hoveredSession, setHoveredSession] = useState(null);
    const [sessionTitleOverflow, setSessionTitleOverflow] = useState(0);

    // Mobile
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
    const [mobileView, setMobileView] = useState('list'); // 'list' | 'chat'

    // Modals
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState('create');
    const [editingSessionId, setEditingSessionId] = useState(null);
    const [newSessionTitle, setNewSessionTitle] = useState('');
    const [newSessionDesc, setNewSessionDesc] = useState('');
    const [newSessionModel, setNewSessionModel] = useState('');
    const [newSessionTools, setNewSessionTools] = useState([]);
    const [availableModels, setAvailableModels] = useState([]);
    const [loadingModels, setLoadingModels] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [sessionToDelete, setSessionToDelete] = useState(null);
    const [isClearModalOpen, setIsClearModalOpen] = useState(false);
    const [sessionToClear, setSessionToClear] = useState(null);

    // Create Tool modal
    const [isCreateToolModalOpen, setIsCreateToolModalOpen] = useState(false);
    const [newToolName, setNewToolName] = useState('');
    const [newToolDesc, setNewToolDesc] = useState('');
    const [newToolWebhookUrl, setNewToolWebhookUrl] = useState('');
    const [isCreatingTool, setIsCreatingTool] = useState(false);

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
        fetchModels();
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
                fetch('/agent/tools?owner=system'),
                (username && username !== 'system') ? fetch(`/agent/tools?owner=${username}`) : Promise.resolve(null),
            ]);

            if (!sysRes.ok) throw new Error('Failed to fetch system tools');
            const sysData = await sysRes.json();
            setSystemTools(Array.isArray(sysData) ? sysData : (sysData.tools || []));

            if (ownerRes && ownerRes.ok) {
                const ownerData = await ownerRes.json();
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

    // ── Fetch Models ──────────────────────────────────────────────────────────
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

    // ── Fetch Sessions from Backend ──────────────────────────────────────────
    const fetchSessions = async () => {
        try {
            const username = localStorage.getItem('username') || 'regina';
            const response = await fetch(`/chat_session/?owner=${username}&mode=agent`);
            if (!response.ok) throw new Error('Failed to fetch sessions');

            const data = await response.json();
            const agentSessions = data
                .filter(s => s.mode === 'agent')
                .map(s => ({
                    ...s,
                    messages: s.messages || [],
                    timestamp: s.created_at || new Date().toISOString(),
                    tools: s.metadata?.tools || []
                }))
                .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

            setSessions(agentSessions);
            if (agentSessions.length > 0) {
                const initial = urlSessionId && agentSessions.find(s => s.id === urlSessionId)
                    ? urlSessionId
                    : agentSessions[0].id;
                setActiveSessionId(initial);
                if (initial && urlSessionId !== initial) {
                    navigate(`/agent/${initial}`, { replace: true });
                }
            }
        } catch (e) {
            console.error('Error loading agent sessions:', e);
        }
    };

    useEffect(() => {
        if (!activeSessionId) return;
        const loadHistory = async () => {
            try {
                const response = await fetch(`/chat_session/${activeSessionId}/history`);
                if (!response.ok) throw new Error('Failed to fetch history');
                const data = await response.json();
                const items = Array.isArray(data) ? data : (data.messages || []);
                const sorted = [...items]
                    .sort((a, b) => (a.message_order || 0) - (b.message_order || 0))
                    .map(({ used_tools, created_at, ...item }) => ({
                        ...item,
                        timestamp: created_at || new Date().toISOString(),
                        toolCalls: item.role === 'assistant'
                            ? (used_tools || []).map(name => ({ name, args: null, result: null }))
                            : [],
                    }));

                setSessions(prev => prev.map(s =>
                    s.id === activeSessionId ? { ...s, messages: sorted } : s
                ));
            } catch (error) {
                console.error("Error fetching run history:", error);
            }
        };
        loadHistory();
    }, [activeSessionId]);

    // ── Session CRUD ──────────────────────────────────────────────────────────
    const handleOpenCreateModal = () => {
        setModalMode('create');
        setEditingSessionId(null);
        setNewSessionTitle('');
        setNewSessionDesc('');
        setNewSessionTools([...systemTools, ...ownerTools].map(t => t.name));
        setIsCreateModalOpen(true);
    };

    const handleOpenEditModal = (session) => {
        setModalMode('edit');
        setEditingSessionId(session.id);
        setNewSessionTitle(session.title);
        setNewSessionDesc(session.description || '');
        setNewSessionModel(session.model_name || session.model || availableModels[0]?.name || '');
        setNewSessionTools(session.tools || []);
        setIsCreateModalOpen(true);
    };

    const handleSaveSession = async () => {
        const username = localStorage.getItem('username') || 'regina';
        const payload = {
            owner: username,
            mode: 'agent',
            session_type: 'text',
            title: newSessionTitle.trim() || 'New Agent Session',
            description: newSessionDesc.trim() || '',
            model_name: newSessionModel,
            metadata: { tools: newSessionTools }
        };

        try {
            if (modalMode === 'create') {
                const response = await fetch('/chat_session/', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                if (!response.ok) throw new Error('Failed to create session');
                const createdSession = await response.json();

                const newSession = {
                    ...createdSession,
                    messages: createdSession.messages || [],
                    timestamp: createdSession.created_at || new Date().toISOString(),
                    tools: newSessionTools,
                };

                setSessions(prev => [newSession, ...prev]);
                setActiveSessionId(newSession.id);
                navigate(`/agent/${newSession.id}`);
                if (isMobile) setMobileView('chat');
            } else {
                const response = await fetch(`/chat_session/${editingSessionId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                if (!response.ok) throw new Error('Failed to update session');

                setSessions(prev => prev.map(s => {
                    if (s.id === editingSessionId) {
                        return {
                            ...s,
                            title: payload.title,
                            description: payload.description,
                            model_name: payload.model_name,
                            tools: newSessionTools
                        };
                    }
                    return s;
                }));
            }
            setIsCreateModalOpen(false);
            setNewSessionTitle('');
            setNewSessionDesc('');
            setNewSessionModel(availableModels[0]?.name || '');
            setEditingSessionId(null);
            setModalMode('create');
        } catch (error) {
            console.error('Error saving session:', error);
        }
    };

    const handleDeleteSession = async () => {
        if (!sessionToDelete) return;
        try {
            const response = await fetch(`/chat_session/${sessionToDelete}`, { method: 'DELETE' });
            if (!response.ok) throw new Error('Failed to delete session');

            const updated = sessions.filter(s => s.id !== sessionToDelete);
            setSessions(updated);
            if (activeSessionId === sessionToDelete) {
                const next = updated[0]?.id || null;
                setActiveSessionId(next);
                if (next) navigate(`/agent/${next}`); else navigate('/agent');
            }
        } catch (e) { console.error('Error deleting:', e); }

        setIsDeleteModalOpen(false);
        setSessionToDelete(null);
    };

    const handleClearSession = async () => {
        if (!sessionToClear) return;
        try {
            const response = await fetch(`/chat_session/${sessionToClear}/history`, { method: 'DELETE' });
            if (!response.ok) throw new Error('Failed to clear history');

            setSessions(prev => prev.map(s => s.id === sessionToClear ? { ...s, messages: [] } : s));
        } catch (e) { console.error('Error clearing:', e); }

        setIsClearModalOpen(false);
        setSessionToClear(null);
    };

    const handleCreateTool = async () => {
        const name = newToolName.trim();
        const webhookUrl = newToolWebhookUrl.trim();
        if (!name || !webhookUrl) return;

        const username = localStorage.getItem('username') || '';
        setIsCreatingTool(true);
        try {
            const response = await fetch('/agent/tools', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name,
                    owner: username,
                    description: newToolDesc.trim(),
                    metadata: { webhook_url: webhookUrl },
                }),
            });
            if (!response.ok) throw new Error('Failed to create tool');
            setIsCreateToolModalOpen(false);
            setNewToolName('');
            setNewToolDesc('');
            setNewToolWebhookUrl('');
            fetchTools();
        } catch (err) {
            console.error('Error creating tool:', err);
        } finally {
            setIsCreatingTool(false);
        }
    };

    const handleSelectSession = (id) => {
        setActiveSessionId(id);
        navigate(`/agent/${id}`);
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
                    chat_session_id: activeSessionId,
                    human_message: text,
                    stream: true
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
                return updated;
            });

            if (botText.trim()) {
                fetch(`/chat_session/${activeSessionId}/history`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ user_content: text, ai_content: botText })
                }).catch(e => console.error('Failed to save agent history:', e));
            }

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
    const showSessionList = isMobile ? mobileView === 'list' : isSessionListOpen;
    const showChatArea = !isMobile || mobileView === 'chat';
    const filteredSessions = sessions.filter(s =>
        s.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="flex h-full w-full bg-slate-900 text-slate-100 overflow-hidden relative">

            {/* ── Left: Session List ──────────────────────────────────────────── */}
            <AnimatePresence initial={false}>
                {showSessionList && (
                    <motion.div
                        initial={isMobile ? false : { width: 0, opacity: 0 }}
                        animate={isMobile ? {} : { width: 200, opacity: 1 }}
                        exit={isMobile ? {} : { width: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: 'easeInOut' }}
                        className={`${isMobile ? 'w-full pt-16' : ''} bg-slate-900/90 border-r border-slate-700/50 flex flex-col flex-shrink-0 backdrop-blur-xl overflow-hidden`}
                    >
                        <div className="p-2.5 space-y-2">
                            <div className="flex items-center justify-between gap-2">
                                <button
                                    id="agent-new-session-btn"
                                    onClick={handleOpenCreateModal}
                                    className="flex-1 flex items-center justify-center gap-1.5 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white py-2 px-3 rounded-lg transition-all shadow-md shadow-violet-900/30 group"
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
                                    className="w-full bg-slate-800/50 border border-slate-700/50 rounded-lg py-1.5 pl-7 pr-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-all"
                                />
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto px-1.5 space-y-0.5 custom-scrollbar pb-3">
                            {filteredSessions.length === 0 && (
                                <div className="flex flex-col items-center justify-center py-10 text-slate-600 gap-2">
                                    <Bot size={24} className="opacity-40" />
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
                                        ? 'bg-violet-900/30 border-violet-700/50 text-white'
                                        : 'border-transparent text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                                        }`}
                                >
                                    <div className="flex items-center gap-2 overflow-hidden flex-1">
                                        <div className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 ${activeSessionId === session.id ? 'bg-violet-500/20' : 'bg-slate-800'}`}>
                                            <Zap size={11} className={activeSessionId === session.id ? 'text-violet-400' : 'text-slate-600'} />
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
                                            onClick={e => { e.stopPropagation(); handleOpenEditModal(session); }}
                                            className="p-1 rounded hover:bg-violet-500/10 hover:text-violet-400 transition-colors"
                                            title="Edit"
                                        ><Settings size={11} /></button>
                                        <button
                                            onClick={e => { e.stopPropagation(); setSessionToClear(session.id); setIsClearModalOpen(true); }}
                                            className="p-1 rounded hover:bg-yellow-500/10 hover:text-yellow-400 transition-colors"
                                            title="Clear"
                                        ><Eraser size={11} /></button>
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

            {/* ── Middle: Chat Area ───────────────────────────────────────────── */}
            <div className={`${showChatArea ? 'flex' : 'hidden'} flex-1 flex-col h-full relative overflow-hidden`}>
                {/* Header */}
                <div className={`h-16 border-b border-slate-700/50 flex items-center justify-between px-4 md:px-6 bg-slate-900/80 backdrop-blur-md sticky top-0 z-10 ${isMobile ? 'pl-16' : ''}`}>
                    <div className="flex items-center gap-3">
                        {isMobile ? (
                            <button onClick={() => setMobileView('list')} className="p-1 hover:bg-slate-800 rounded-lg text-slate-400">
                                <ChevronLeft size={22} />
                            </button>
                        ) : !isSessionListOpen && (
                            <button
                                onClick={() => setIsSessionListOpen(true)}
                                className="p-1.5 rounded-lg text-slate-500 hover:text-violet-400 hover:bg-slate-800 transition-colors"
                                title="Open session list"
                            >
                                <ChevronRight size={15} />
                            </button>
                        )}
                        <div className="w-9 h-9 rounded-full bg-violet-500/20 flex items-center justify-center">
                            <Zap size={20} className="text-violet-400" />
                        </div>
                        <div className="group relative cursor-default flex flex-col justify-center">
                            <h2 className="text-base font-semibold text-white leading-tight">
                                {activeSession?.title || 'Agent'}
                            </h2>
                            <div className="flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                <span className="text-[11px] text-slate-400">{activeSession?.tools?.length || 0} tools available</span>
                            </div>

                            {/* Hover Tools Popover */}
                            <div className="absolute top-10 left-0 mt-1 opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-200 z-[120]">
                                <div className="bg-slate-800 border border-slate-700/50 rounded-xl shadow-xl p-3 w-max min-w-[140px]">
                                    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Selected Tools</p>
                                    {activeSession?.tools?.length > 0 ? (
                                        <ul className="space-y-1.5">
                                            {activeSession.tools.map(t => (
                                                <li key={t} className="flex items-center gap-2 text-xs text-emerald-400 font-mono">
                                                    <div className="w-1 h-1 rounded-full bg-emerald-500" />
                                                    {t}
                                                </li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <p className="text-[11px] text-slate-500">No tools configured</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {!isMobile && !showToolsPanel && (
                            <button
                                onClick={() => setShowToolsPanel(true)}
                                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition-colors"
                                title="Open tool store"
                            >
                                <ChevronLeft size={15} />
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
                                                    onClick={() => { handleOpenCreateModal(); setIsHeaderMenuOpen(false); }}
                                                    className="w-full text-left px-4 py-3 text-sm text-slate-200 hover:bg-slate-700/50 flex items-center gap-2"
                                                ><Plus size={15} />New Session</button>
                                                <button
                                                    onClick={() => { if (activeSession) { handleOpenEditModal(activeSession); } setIsHeaderMenuOpen(false); }}
                                                    className="w-full text-left px-4 py-3 text-sm text-slate-200 hover:bg-slate-700/50 flex items-center gap-2"
                                                ><Settings size={15} />Edit Session</button>
                                                <button
                                                    onClick={() => { if (activeSession) { setSessionToClear(activeSession.id); setIsClearModalOpen(true); } setIsHeaderMenuOpen(false); }}
                                                    className="w-full text-left px-4 py-3 text-sm text-slate-200 hover:bg-slate-700/50 flex items-center gap-2"
                                                ><Eraser size={15} />Clear History</button>
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
                            onClick={handleOpenCreateModal}
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
                        {activeSession.messages.map((msg, index) => {
                            const currentDate = new Date(msg.timestamp);
                            const prevMsg = activeSession.messages[index - 1];
                            const prevDate = prevMsg ? new Date(prevMsg.timestamp) : null;
                            const showDateSeparator = !prevDate || currentDate.toDateString() !== prevDate.toDateString();

                            return (
                                <React.Fragment key={msg.id}>
                                    {showDateSeparator && (
                                        <div className="flex justify-center my-6">
                                            <span className="bg-slate-800/80 backdrop-blur-sm border border-slate-700/50 text-slate-400 text-xs font-medium py-1 px-4 rounded-full shadow-sm">
                                                {currentDate.toLocaleDateString([], { month: 'long', day: 'numeric', year: currentDate.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined })}
                                            </span>
                                        </div>
                                    )}
                                    <motion.div
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
                                                {msg.toolCalls?.length > 0 && (
                                                    <div className="flex flex-wrap gap-1.5 mb-2">
                                                        {msg.toolCalls.map((tc, i) => (
                                                            <span key={i} className="inline-flex items-center gap-1 text-[11px] font-mono text-violet-300 bg-violet-950/40 border border-violet-500/20 rounded-full px-2 py-0.5">
                                                                <Terminal size={10} className="shrink-0" />
                                                                {tc.name}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}
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
                                </React.Fragment>
                            );
                        })}
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
                                className="flex-1 bg-transparent text-sm text-slate-200 placeholder-slate-500 resize-none outline-none min-h-[36px] py-[6px] max-h-32 custom-scrollbar leading-relaxed"
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
                                <span className="text-sm font-semibold text-slate-200">Tool store</span>
                                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
                                    {systemTools.length + ownerTools.length}
                                </span>
                            </div>
                            <div className="flex items-center gap-1">
                                <button
                                    onClick={fetchTools}
                                    className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-400 hover:bg-slate-800 transition-colors"
                                    title="Refresh tools"
                                >
                                    <RefreshCw size={13} className={loadingTools ? 'animate-spin' : ''} />
                                </button>
                                <button
                                    onClick={() => setShowToolsPanel(false)}
                                    className="p-1.5 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition-colors"
                                    title="Collapse tool store"
                                >
                                    <ChevronRight size={14} />
                                </button>
                            </div>
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

                        <div className="p-3 border-t border-slate-700/50">
                            <button
                                onClick={() => setIsCreateToolModalOpen(true)}
                                className="w-full flex items-center justify-center gap-2 p-2.5 rounded-xl border border-dashed border-violet-500/30 text-violet-400 text-xs hover:bg-violet-500/10 hover:border-violet-500/50 transition-colors"
                            >
                                <Plus size={13} />
                                Create Tool
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
                                        <h3 className="text-base font-semibold text-slate-100">
                                            {modalMode === 'create' ? 'New Agent Session' : 'Edit Agent Session'}
                                        </h3>
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
                                            onKeyDown={e => e.key === 'Enter' && handleSaveSession()}
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
                                    <div>
                                        <label className="block text-xs font-medium text-slate-400 mb-1.5">LLM Model</label>
                                        {loadingModels ? (
                                            <div className="flex items-center gap-2 text-xs text-slate-500 py-2.5">
                                                <RefreshCw size={12} className="animate-spin" />
                                                Loading models...
                                            </div>
                                        ) : (
                                            <select
                                                value={newSessionModel}
                                                onChange={e => setNewSessionModel(e.target.value)}
                                                className="w-full bg-slate-800/60 border border-slate-700/50 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-all appearance-none cursor-pointer"
                                            >
                                                {availableModels.map(m => (
                                                    <option key={m.name} value={m.name}>{m.name}</option>
                                                ))}
                                            </select>
                                        )}
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-slate-400 mb-1.5">Tool store</label>
                                        <div className="bg-slate-800/40 border border-slate-700/30 rounded-xl overflow-y-auto max-h-48 custom-scrollbar p-1">
                                            {systemTools.length === 0 && ownerTools.length === 0 ? (
                                                <div className="p-3 text-center text-[11px] text-slate-500">No tools found.</div>
                                            ) : (
                                                <>
                                                    {systemTools.length > 0 && (
                                                        <>
                                                            <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider px-2 pt-1.5 pb-1">System</p>
                                                            {systemTools.map(t => {
                                                                const isSelected = newSessionTools.includes(t.name);
                                                                return (
                                                                    <div
                                                                        key={t.name}
                                                                        onClick={() => setNewSessionTools(prev => prev.includes(t.name) ? prev.filter(n => n !== t.name) : [...prev, t.name])}
                                                                        className={`flex items-center gap-3 p-2 hover:bg-slate-800/60 rounded-lg cursor-pointer transition-colors group select-none ${isSelected ? 'bg-slate-800/30' : ''}`}
                                                                    >
                                                                        <div className={`w-4 h-4 rounded flex items-center justify-center shrink-0 border transition-all ${isSelected ? 'bg-violet-500 border-violet-500' : 'border-slate-600 group-hover:border-violet-400'}`}>
                                                                            {isSelected && <Check size={12} className="text-white" strokeWidth={3} />}
                                                                        </div>
                                                                        <p className="text-xs font-medium text-slate-300 font-mono truncate flex-1 min-w-0">{t.name}</p>
                                                                    </div>
                                                                );
                                                            })}
                                                        </>
                                                    )}
                                                    {ownerTools.length > 0 && (
                                                        <>
                                                            <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider px-2 pt-2 pb-1">
                                                                {localStorage.getItem('username') || 'User'}
                                                            </p>
                                                            {ownerTools.map(t => {
                                                                const isSelected = newSessionTools.includes(t.name);
                                                                return (
                                                                    <div
                                                                        key={t.name}
                                                                        onClick={() => setNewSessionTools(prev => prev.includes(t.name) ? prev.filter(n => n !== t.name) : [...prev, t.name])}
                                                                        className={`flex items-center gap-3 p-2 hover:bg-slate-800/60 rounded-lg cursor-pointer transition-colors group select-none ${isSelected ? 'bg-slate-800/30' : ''}`}
                                                                    >
                                                                        <div className={`w-4 h-4 rounded flex items-center justify-center shrink-0 border transition-all ${isSelected ? 'bg-violet-500 border-violet-500' : 'border-slate-600 group-hover:border-violet-400'}`}>
                                                                            {isSelected && <Check size={12} className="text-white" strokeWidth={3} />}
                                                                        </div>
                                                                        <p className="text-xs font-medium text-slate-300 font-mono truncate flex-1 min-w-0">{t.name}</p>
                                                                    </div>
                                                                );
                                                            })}
                                                        </>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                        <p className="text-[10px] text-slate-500 mt-2 px-1 text-right">
                                            {newSessionTools.length} tool{newSessionTools.length !== 1 ? 's' : ''} selected
                                        </p>
                                    </div>
                                </div>
                                <div className="flex gap-3 p-6 pt-0">
                                    <button
                                        onClick={() => setIsCreateModalOpen(false)}
                                        className="flex-1 py-2.5 rounded-xl border border-slate-700/50 text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 text-sm font-medium transition-all"
                                    >Cancel</button>
                                    <button
                                        onClick={handleSaveSession}
                                        className="flex-1 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium transition-all shadow-lg shadow-violet-900/30"
                                    >
                                        {modalMode === 'create' ? 'Create Session' : 'Save Changes'}
                                    </button>
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
            {/* ── Create Tool Modal ────────────────────────────────────────────── */}
            {createPortal(
                <AnimatePresence>
                    {isCreateToolModalOpen && (
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4"
                            onClick={() => setIsCreateToolModalOpen(false)}
                        >
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: 16 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: 16 }}
                                onClick={e => e.stopPropagation()}
                                className="w-full max-w-md bg-slate-900 border border-slate-700/50 rounded-2xl shadow-2xl"
                            >
                                <div className="flex items-center justify-between p-6 border-b border-slate-700/50">
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                                            <Wrench size={18} className="text-emerald-400" />
                                        </div>
                                        <h3 className="text-base font-semibold text-slate-100">Create Tool</h3>
                                    </div>
                                    <button onClick={() => setIsCreateToolModalOpen(false)} className="p-1.5 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition-colors">
                                        <X size={16} />
                                    </button>
                                </div>
                                <div className="p-6 space-y-4">
                                    <div>
                                        <label className="block text-xs font-medium text-slate-400 mb-1.5">Tool Name <span className="text-red-400">*</span></label>
                                        <input
                                            type="text"
                                            value={newToolName}
                                            onChange={e => setNewToolName(e.target.value)}
                                            placeholder="e.g. my_current_time"
                                            autoFocus
                                            className="w-full bg-slate-800/60 border border-slate-700/50 rounded-xl px-4 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all font-mono"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-slate-400 mb-1.5">Description <span className="text-slate-600">(optional)</span></label>
                                        <input
                                            type="text"
                                            value={newToolDesc}
                                            onChange={e => setNewToolDesc(e.target.value)}
                                            placeholder="What does this tool do?"
                                            className="w-full bg-slate-800/60 border border-slate-700/50 rounded-xl px-4 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-slate-400 mb-1.5">Webhook URL <span className="text-red-400">*</span></label>
                                        <input
                                            type="url"
                                            value={newToolWebhookUrl}
                                            onChange={e => setNewToolWebhookUrl(e.target.value)}
                                            placeholder="https://your-server/tools/endpoint"
                                            className="w-full bg-slate-800/60 border border-slate-700/50 rounded-xl px-4 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all font-mono"
                                        />
                                    </div>
                                </div>
                                <div className="flex gap-3 p-6 pt-0">
                                    <button
                                        onClick={() => setIsCreateToolModalOpen(false)}
                                        className="flex-1 py-2.5 rounded-xl border border-slate-700/50 text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 text-sm font-medium transition-all"
                                    >Cancel</button>
                                    <button
                                        onClick={handleCreateTool}
                                        disabled={!newToolName.trim() || !newToolWebhookUrl.trim() || isCreatingTool}
                                        className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium transition-all shadow-lg shadow-emerald-900/30"
                                    >
                                        {isCreatingTool ? 'Creating…' : 'Create Tool'}
                                    </button>
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
