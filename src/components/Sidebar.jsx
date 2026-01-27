import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    MessageSquare,
    Menu,
    ChevronLeft,
    Settings,
    Home,
    User,
} from 'lucide-react';
import classNames from 'classnames';
import { useNavigate, useLocation } from 'react-router-dom';

const Sidebar = () => {
    const [isOpen, setIsOpen] = useState(true);
    const navigate = useNavigate();
    const location = useLocation();

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
    };

    return (
        <motion.div
            initial={{ width: isOpen ? 280 : 80 }}
            animate={{ width: isOpen ? 280 : 80 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="h-screen bg-sidebar border-r border-slate-700/50 flex flex-col relative shrink-0 shadow-xl z-20"
        >
            {/* Header */}
            <div className="p-4 flex items-center justify-between h-20 border-b border-slate-700/50">
                <AnimatePresence>
                    {isOpen && (
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="font-bold text-xl text-white tracking-wide flex items-center gap-2"
                        >
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-500 to-purple-600 flex items-center justify-center">
                                <span className="text-sm">AI</span>
                            </div>
                            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
                                Regina
                            </span>
                        </motion.div>
                    )}
                </AnimatePresence>

                <button
                    onClick={toggleSidebar}
                    className="p-2 rounded-lg hover:bg-slate-700/50 text-slate-400 hover:text-white transition-colors absolute right-[-12px] top-8 bg-sidebar border border-slate-700 shadow-md transform translate-x-1/2 md:translate-x-0 md:static"
                >
                    {isOpen ? <ChevronLeft size={20} /> : <Menu size={20} />}
                </button>
            </div>



            {/* Navigation */}
            <nav className="flex-1 px-3 py-4 space-y-2 overflow-y-auto">
                {navItems.map((item) => (
                    <div
                        key={item.id}
                        onClick={() => handleNavigation(item.path)}
                        className={classNames(
                            "flex items-center gap-4 p-3 rounded-xl cursor-pointer transition-all duration-200 group relative",
                            {
                                'bg-slate-700/50 text-blue-400': activeItem === item.id,
                                'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200': activeItem !== item.id,
                                'justify-center': !isOpen
                            }
                        )}
                    >
                        <item.icon
                            size={24}
                            className={classNames(
                                "transition-colors",
                                { 'text-blue-500': activeItem === item.id }
                            )}
                        />

                        <AnimatePresence>
                            {isOpen && (
                                <motion.span
                                    initial={{ opacity: 0, width: 0 }}
                                    animate={{ opacity: 1, width: "auto" }}
                                    exit={{ opacity: 0, width: 0 }}
                                    className="font-medium whitespace-nowrap"
                                >
                                    {item.label}
                                </motion.span>
                            )}
                        </AnimatePresence>

                        {/* Tooltip for collapsed state */}
                        {!isOpen && (
                            <div className="absolute left-full ml-4 px-2 py-1 bg-slate-800 text-white text-sm rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-xl border border-slate-700 z-50">
                                {item.label}
                            </div>
                        )}

                        {/* Active Indicator Strip */}
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

            {/* User Section (Bottom) */}
            <div className="p-4 border-t border-slate-700/50">
                <div className={classNames(
                    "flex items-center gap-3 p-2 rounded-xl hover:bg-slate-800/50 transition-colors cursor-pointer",
                    { 'justify-center': !isOpen }
                )}>
                    <img
                        src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix"
                        alt="User"
                        className="w-10 h-10 rounded-full bg-slate-600 border-2 border-slate-500"
                    />
                    {isOpen && (
                        <div className="flex flex-col overflow-hidden">
                            <span className="text-sm font-semibold text-slate-200 truncate">Regina Admin</span>
                            <span className="text-xs text-slate-500 truncate">Pro Plan</span>
                        </div>
                    )}
                </div>
            </div>
        </motion.div>
    );
};

export default Sidebar;
