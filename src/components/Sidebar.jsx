import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    MessageSquare,
    Menu,
    ChevronLeft,
    Settings,
    Home,
    User,
    X
} from 'lucide-react';
import classNames from 'classnames';
import { useNavigate, useLocation } from 'react-router-dom';

const Sidebar = () => {
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
    const [isOpen, setIsOpen] = useState(!isMobile); // Default closed on mobile, open on desktop
    const [hoveredItem, setHoveredItem] = useState(null);
    const [tooltipPos, setTooltipPos] = useState({ top: 0, left: 0 });
    const navigate = useNavigate();
    const location = useLocation();

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
        { id: 'home', icon: Home, label: 'Dashboard', path: '/' },
        { id: 'chat', icon: MessageSquare, label: 'Chat Session', path: '/chat_session' },
        { id: 'profile', icon: User, label: 'Profile', path: '/profile' },
        { id: 'settings', icon: Settings, label: 'Settings', path: '/settings' },
    ];

    const getActiveItem = () => {
        const currentPath = location.pathname;
        if (currentPath === '/') return 'home';
        if (currentPath.startsWith('/chat_session')) return 'chat';
        const found = navItems.find(item => item.path !== '/' && currentPath.startsWith(item.path));
        return found ? found.id : '';
    };

    const activeItem = getActiveItem();

    const toggleSidebar = () => setIsOpen(!isOpen);

    const handleNavigation = (path) => {
        navigate(path);
        if (isMobile) setIsOpen(false); // Close sidebar on mobile navigation
    };

    const handleItemHover = (e, itemId) => {
        const rect = e.currentTarget.getBoundingClientRect();
        setTooltipPos({
            top: rect.bottom,
            left: rect.left + rect.width / 2
        });
        setHoveredItem(itemId);
    };

    // Sidebar Width Logic
    const sidebarWidth = isOpen ? 280 : (isMobile ? 0 : 80);

    return (
        <>
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

            <motion.div
                initial={{ width: sidebarWidth }}
                animate={{ width: sidebarWidth }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className={classNames(
                    "h-screen bg-sidebar border-r border-slate-700/50 flex flex-col shrink-0 shadow-xl z-40 overflow-hidden",
                    {
                        'fixed left-0 top-0': isMobile, // Fixed on mobile
                        'relative': !isMobile,          // Relative (flex item) on desktop
                        'border-none': isMobile && !isOpen // Remove border when hidden on mobile
                    }
                )}
            >
                <div className={classNames(
                    "h-20 border-b border-slate-700/50 overflow-hidden flex items-center transition-all",
                    {
                        'p-4 justify-between': isOpen || isMobile,
                        'justify-center': !isOpen && !isMobile
                    }
                )}>
                    <motion.div
                        className="font-bold text-xl text-white tracking-wide flex items-center gap-2"
                    >
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-500 to-purple-600 flex items-center justify-center shrink-0">
                            <span className="text-sm">AI</span>
                        </div>
                        <AnimatePresence>
                            {isOpen && (
                                <motion.span
                                    initial={{ opacity: 0, width: 0 }}
                                    animate={{ opacity: 1, width: "auto" }}
                                    exit={{ opacity: 0, width: 0 }}
                                    className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400 whitespace-nowrap overflow-hidden"
                                >
                                    Regina
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
                <nav className="flex-1 px-3 py-4 space-y-2 overflow-y-auto overflow-x-hidden">
                    {navItems.map((item) => (
                        <div
                            key={item.id}
                            onClick={() => handleNavigation(item.path)}
                            onMouseEnter={(e) => handleItemHover(e, item.id)}
                            onMouseLeave={() => setHoveredItem(null)}
                            className={classNames(
                                "flex items-center gap-4 p-3 rounded-xl cursor-pointer transition-all duration-200 group relative",
                                {
                                    'bg-slate-700/50 text-blue-400': activeItem === item.id,
                                    'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200': activeItem !== item.id,
                                    'justify-center': !isOpen && !isMobile
                                }
                            )}
                        >
                            <item.icon
                                size={24}
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
                                        className="font-medium whitespace-nowrap overflow-hidden"
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
                                "w-full p-4 flex items-center gap-4 text-slate-400 hover:bg-slate-800/50 hover:text-white transition-colors",
                                { 'justify-center': !isOpen }
                            )}
                        >
                            <div className={classNames("shrink-0 transition-transform duration-300", { "rotate-180": !isOpen })}>
                                <ChevronLeft size={24} />
                            </div>
                            <AnimatePresence>
                                {isOpen && (
                                    <motion.span
                                        initial={{ opacity: 0, width: 0 }}
                                        animate={{ opacity: 1, width: "auto" }}
                                        exit={{ opacity: 0, width: 0 }}
                                        className="font-medium whitespace-nowrap overflow-hidden"
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
                        { 'p-4 pt-2': isOpen || isMobile, 'p-2': !isOpen && !isMobile }
                    )}>
                        <div className={classNames(
                            "flex items-center gap-3 p-2 rounded-xl hover:bg-slate-800/50 transition-colors cursor-pointer",
                            { 'justify-center': !isOpen && !isMobile }
                        )}>
                            <img
                                src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix"
                                alt="User"
                                className="w-10 h-10 rounded-full bg-slate-600 border-2 border-slate-500 shrink-0"
                            />
                            {isOpen && (
                                <div className="flex flex-col overflow-hidden">
                                    <span className="text-sm font-semibold text-slate-200 truncate">Regina Admin</span>
                                    <span className="text-xs text-slate-500 truncate">Pro Plan</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </motion.div>
        </>
    );
};

export default Sidebar;
