import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    MessageSquare,
    Menu,
    ChevronLeft,
    Settings,
    Home,
    User,
    LogOut,
    X,
    Bot,
    Database
} from 'lucide-react';
import classNames from 'classnames';
import { useNavigate, useLocation } from 'react-router-dom';

const Sidebar = () => {
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
    const [isOpen, setIsOpen] = useState(!isMobile); // Default closed on mobile, open on desktop
    const [hoveredItem, setHoveredItem] = useState(null);
    const [tooltipPos, setTooltipPos] = useState({ top: 0, left: 0 });
    const [openWidth, setOpenWidth] = useState(180);
    const measureRef = useRef(null);
    const navigate = useNavigate();
    const location = useLocation();

    const [userRole, setUserRole] = useState(() => localStorage.getItem('userRole') || 'User');
    const [username, setUsername] = useState('Guest');

    useEffect(() => {
        const storedUsername = localStorage.getItem('username');
        if (storedUsername) {
            setUsername(storedUsername);
            fetch(`/accounts/${storedUsername}`, {
                headers: { 'accept': 'application/json' }
            })
                .then(res => res.json())
                .then(data => {
                    if (data.role) {
                        setUserRole(data.role);
                        localStorage.setItem('userRole', data.role);
                    }
                })
                .catch(err => console.error('Failed to fetch user info:', err));
        }
    }, []);

    useEffect(() => {
        const handleResize = () => {
            const mobile = window.innerWidth < 768;
            setIsMobile(mobile);
            if (mobile && isOpen) {
                setIsOpen(false); // Auto-close when switching to mobile
            } else if (!mobile && !isOpen) {
                setIsOpen(true); // Auto-open when switching to desktop (optional, depends on UX preference)
            }
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const navItems = [
        { id: 'home', icon: Home, label: 'Dashboard', path: '/', restricted: true },
        { id: 'chat', icon: MessageSquare, label: 'Chat Session', path: '/chat' },
        { id: 'agent', icon: Bot, label: 'Agent Session', path: '/agent' },
        { id: 'rag', icon: Database, label: 'RAG Session', path: '/rag' },
        { id: 'profile', icon: User, label: 'Profile', path: '/profile' },
        { id: 'settings', icon: Settings, label: 'Settings', path: '/settings', restricted: true },
    ].filter(item => userRole === 'Admin' || !item.restricted);

    const getActiveItem = () => {
        const currentPath = location.pathname;
        if (currentPath === '/') return 'home';
        if (currentPath.startsWith('/chat')) return 'chat';
        if (currentPath.startsWith('/agent')) return 'agent';
        if (currentPath.startsWith('/rag')) return 'rag';
        const found = navItems.find(item => item.path !== '/' && currentPath.startsWith(item.path));
        return found ? found.id : '';
    };

    const activeItem = getActiveItem();

    const toggleSidebar = () => setIsOpen(!isOpen);

    const handleNavigation = (path) => {
        navigate(path);
        if (isMobile) setIsOpen(false); // Close sidebar on mobile navigation
    };

    const handleLogout = () => {
        if (window.confirm('Are you sure you want to log out?')) {
            localStorage.removeItem('isAuthenticated');
            localStorage.removeItem('token');
            localStorage.removeItem('userRole');
            navigate('/login');
        }
    };

    const handleItemHover = (e, itemId) => {
        const rect = e.currentTarget.getBoundingClientRect();
        setTooltipPos({
            top: rect.bottom,
            left: rect.left + rect.width / 2
        });
        setHoveredItem(itemId);
    };



    // Measure natural content width from hidden portal element
    useLayoutEffect(() => {
        if (measureRef.current) {
            setOpenWidth(measureRef.current.offsetWidth);
        }
    }, [userRole]);

    // Sidebar Width Logic — dynamic based on content
    const sidebarWidth = isOpen ? openWidth : (isMobile ? 0 : 56);

    return (
        <>
            {/* Hidden measurement element — renders nav at natural width to compute openWidth */}
            {createPortal(
                <div
                    ref={measureRef}
                    className="fixed opacity-0 pointer-events-none"
                    style={{ left: '-9999px', top: '-9999px' }}
                >
                    <div className="px-2">
                        {navItems.map(item => (
                            <div key={item.id} className="flex items-center gap-3 px-2 py-2">
                                <item.icon size={18} className="shrink-0" />
                                <span className="text-sm font-medium whitespace-nowrap">{item.label}</span>
                            </div>
                        ))}
                        <div className="flex items-center gap-3 px-2 py-2.5">
                            <ChevronLeft size={18} className="shrink-0" />
                            <span className="text-sm font-medium whitespace-nowrap">Collapse Sidebar</span>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* Mobile Backdrop */}
            <AnimatePresence>
                {isMobile && isOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsOpen(false)}
                        className="fixed inset-0 bg-black/50 z-30 backdrop-blur-sm"
                    />
                )}
            </AnimatePresence>

            {/* Mobile Toggle Button (Visible when sidebar is closed on mobile) */}
            {isMobile && !isOpen && (
                <button
                    onClick={toggleSidebar}
                    className="fixed top-4 left-4 p-2 rounded-lg bg-slate-800 text-white shadow-lg z-30 border border-slate-700 md:hidden"
                >
                    <Menu size={24} />
                </button>
            )}

            {/* Desktop Spacer */}
            {!isMobile && (
                <motion.div
                    animate={{ width: sidebarWidth }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className="shrink-0 h-screen"
                />
            )}

            <motion.div
                initial={{ width: sidebarWidth }}
                animate={{ width: sidebarWidth }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className={classNames(
                    "h-screen bg-sidebar border-r border-slate-700/50 flex flex-col shrink-0 shadow-xl z-40 overflow-hidden fixed left-0 top-0",
                    {
                        'border-none': isMobile && !isOpen // Remove border when hidden on mobile
                    }
                )}
            >
                <div className={classNames(
                    "h-14 border-b border-slate-700/50 overflow-hidden flex items-center transition-all",
                    {
                        'px-3 justify-between': isOpen || isMobile,
                        'justify-center': !isOpen && !isMobile
                    }
                )}>
                    <motion.div
                        className="font-bold text-base text-white tracking-wide flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => handleNavigation('/')}
                    >
                        <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-blue-500 to-purple-600 flex items-center justify-center shrink-0">
                            <span className="text-sm font-bold">A</span>
                        </div>
                        <AnimatePresence>
                            {isOpen && (
                                <motion.span
                                    initial={{ opacity: 0, width: 0 }}
                                    animate={{ opacity: 1, width: "auto" }}
                                    exit={{ opacity: 0, width: 0 }}
                                    className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400 whitespace-nowrap overflow-hidden flex items-center"
                                >
                                    Reg<span className="text-cyan-400 font-mono text-xl font-bold mx-0.5 drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]">I</span>na
                                </motion.span>
                            )}
                        </AnimatePresence>
                    </motion.div>

                    {/* Mobile Close Button (only visible on mobile) */}
                    {isMobile && isOpen && (
                        <button
                            onClick={toggleSidebar}
                            className="p-1 rounded-md text-slate-400 hover:text-white"
                        >
                            <ChevronLeft size={24} />
                        </button>
                    )}
                </div>

                {/* Navigation */}
                <nav className="flex-1 px-2 py-3 space-y-1 overflow-y-auto overflow-x-hidden">
                    {navItems.map((item) => (
                        <div
                            key={item.id}
                            onClick={() => handleNavigation(item.path)}
                            onMouseEnter={(e) => handleItemHover(e, item.id)}
                            onMouseLeave={() => setHoveredItem(null)}
                            className={classNames(
                                "flex items-center gap-3 px-2 py-2 rounded-lg cursor-pointer transition-all duration-200 group relative",
                                {
                                    'bg-slate-700/50 text-blue-400': activeItem === item.id,
                                    'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200': activeItem !== item.id,
                                    'justify-center': !isOpen && !isMobile
                                }
                            )}
                        >
                            <item.icon
                                size={18}
                                className={classNames(
                                    "transition-colors shrink-0",
                                    { 'text-blue-500': activeItem === item.id }
                                )}
                            />

                            <AnimatePresence>
                                {isOpen && (
                                    <motion.span
                                        initial={{ opacity: 0, width: 0 }}
                                        animate={{ opacity: 1, width: "auto" }}
                                        exit={{ opacity: 0, width: 0 }}
                                        className="text-sm font-medium whitespace-nowrap overflow-hidden"
                                    >
                                        {item.label}
                                    </motion.span>
                                )}
                            </AnimatePresence>

                            {/* Portal Tooltip for collapsed desktop state */}
                            {!isOpen && !isMobile && hoveredItem === item.id && createPortal(
                                <div
                                    className="fixed z-[100] -translate-x-1/2 mt-1 px-2 py-0.5 bg-slate-900/60 backdrop-blur-md text-slate-300 text-[10px] font-medium rounded-md border border-slate-700/30 whitespace-nowrap pointer-events-none animate-in fade-in zoom-in-95 duration-200 tracking-wide"
                                    style={{
                                        top: tooltipPos.top,
                                        left: tooltipPos.left
                                    }}
                                >
                                    {item.label}
                                </div>,
                                document.body
                            )}

                            {/* Active Indicator */}
                            {activeItem === item.id && (
                                <motion.div
                                    layoutId="activeIndicator"
                                    className="absolute left-0 w-1 h-8 bg-blue-500 rounded-r-full"
                                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                />
                            )}
                        </div>
                    ))}
                </nav>

                {/* Bottom Toggle & User Section */}
                <div className="border-t border-slate-700/50 bg-slate-900/50">
                    {/* Desktop Toggle (Bottom) */}
                    {!isMobile && (
                        <button
                            onClick={toggleSidebar}
                            className={classNames(
                                "w-full px-2 py-2.5 flex items-center gap-3 text-slate-400 hover:bg-slate-800/50 hover:text-white transition-colors",
                                { 'justify-center': !isOpen }
                            )}
                        >
                            <div className={classNames("shrink-0 transition-transform duration-300", { "rotate-180": !isOpen })}>
                                <ChevronLeft size={18} />
                            </div>
                            <AnimatePresence>
                                {isOpen && (
                                    <motion.span
                                        initial={{ opacity: 0, width: 0 }}
                                        animate={{ opacity: 1, width: "auto" }}
                                        exit={{ opacity: 0, width: 0 }}
                                        className="text-sm font-medium whitespace-nowrap overflow-hidden"
                                    >
                                        Collapse Sidebar
                                    </motion.span>
                                )}
                            </AnimatePresence>
                        </button>
                    )}

                    {/* User Profile */}
                    <div className={classNames(
                        "transition-all duration-300",
                        { 'px-2 py-2': isOpen || isMobile, 'p-1.5': !isOpen && !isMobile }
                    )}>
                        <button
                            onClick={handleLogout}
                            className={classNames(
                                "w-full flex items-center gap-2 p-1.5 rounded-lg hover:bg-red-500/10 hover:border-red-500/20 border border-transparent transition-all cursor-pointer group text-left",
                                { 'justify-center': !isOpen && !isMobile }
                            )}
                            title="Sign Out"
                        >
                            <div className="relative shrink-0">
                                <img
                                    src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`}
                                    alt="User"
                                    className="w-8 h-8 rounded-full bg-slate-600 border-2 border-slate-500 group-hover:border-red-400 transition-colors"
                                />
                                <div className="absolute bottom-0 right-0 w-2 h-2 bg-green-500 border-2 border-slate-800 rounded-full"></div>
                            </div>

                            {isOpen && (
                                <>
                                    <div className="flex flex-col overflow-hidden flex-1">
                                        <span className="text-xs font-semibold text-slate-200 truncate group-hover:text-red-200 transition-colors">{username}</span>
                                        <span className="text-[11px] text-slate-500 truncate group-hover:text-red-300/70 transition-colors">{userRole}</span>
                                    </div>
                                    <LogOut size={14} className="text-slate-500 group-hover:text-red-400 transition-colors" />
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </motion.div>
        </>
    );
};

export default Sidebar;
