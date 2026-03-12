import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Shield, Clock, Search, Loader2, AlertCircle, User as UserIcon } from 'lucide-react';

const Dashboard = () => {
    const [currentUserRole, setCurrentUserRole] = useState(null);
    const [users, setUsers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const controller = new AbortController();
        const { signal } = controller;

        const fetchDashboardData = async () => {
            try {
                const username = localStorage.getItem('username');
                if (!username) {
                    setError('Not authenticated');
                    setIsLoading(false);
                    return;
                }

                const userRes = await fetch(`/accounts/${username}`, {
                    headers: { 'accept': 'application/json' },
                    signal,
                });

                if (!userRes.ok) throw new Error('Failed to fetch user profile');
                const userData = await userRes.json();
                setCurrentUserRole(userData.role);

                if (userData.role === 'Admin') {
                    const token = localStorage.getItem('token');
                    const headers = { 'accept': 'application/json' };
                    if (token) headers['Authorization'] = `Bearer ${token}`;

                    const allUsersRes = await fetch('/accounts/', { headers, signal });
                    if (!allUsersRes.ok) throw new Error('Failed to fetch users list');

                    const allUsersData = await allUsersRes.json();
                    setUsers(Array.isArray(allUsersData) ? allUsersData : allUsersData.users || []);
                }
            } catch (err) {
                if (err.name === 'AbortError') return;
                console.error(err);
                setError(err.message || 'An error occurred loading the dashboard');
            } finally {
                if (!signal.aborted) setIsLoading(false);
            }
        };

        fetchDashboardData();
        return () => controller.abort();
    }, []);

    const filteredUsers = users.filter(u => 
        u.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.role?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Date formatter helper
    const formatDate = (dateString) => {
        if (!dateString) return 'Unknown';
        const d = new Date(dateString);
        return isNaN(d.getTime()) ? dateString : new Intl.DateTimeFormat('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }).format(d);
    };

    if (isLoading) {
        return (
            <div className="flex-1 h-full flex flex-col items-center justify-center relative overflow-hidden text-white/90">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <p className="mt-4 text-slate-400">Loading dashboard...</p>
            </div>
        );
    }

    if (error && currentUserRole === 'Admin') {
        return (
            <div className="flex-1 h-full flex flex-col items-center justify-center relative overflow-hidden text-white/90">
                <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
                <p className="text-red-400">{error}</p>
            </div>
        );
    }

    return (
        <div className="flex-1 h-full flex flex-col relative overflow-hidden text-white/90 p-8">
            {currentUserRole === 'Admin' ? (
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.4 }}
                    className="z-10 w-full max-w-6xl mx-auto h-full flex flex-col"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between mb-8 shrink-0">
                        <div>
                            <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
                                <Users className="h-8 w-8 text-primary" />
                                Users Dashboard
                            </h1>
                            <p className="text-secondary text-sm">Manage and view all registered accounts in the system.</p>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="relative group">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary h-4 w-4 group-focus-within:text-primary transition-colors" />
                                <input 
                                    type="text" 
                                    placeholder="Search users..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="bg-sidebar/50 border border-white/10 rounded-xl py-2 pl-9 pr-4 text-sm outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all w-64"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Table Container */}
                    <div className="bg-sidebar/30 backdrop-blur-xl border border-white/10 rounded-2xl flex-1 overflow-hidden flex flex-col shadow-2xl">
                        <div className="overflow-auto flex-1 p-4 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-white/10 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-white/20">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-white/5 text-xs uppercase tracking-wider text-secondary font-semibold">
                                        <th className="pb-4 pt-2 px-4 whitespace-nowrap">User</th>
                                        <th className="pb-4 pt-2 px-4 whitespace-nowrap">Role</th>
                                        <th className="pb-4 pt-2 px-4 whitespace-nowrap">Created At</th>
                                        <th className="pb-4 pt-2 px-4 whitespace-nowrap text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="text-sm">
                                    <AnimatePresence>
                                        {filteredUsers.length === 0 ? (
                                            <tr>
                                                <td colSpan="4" className="text-center py-12 text-secondary">
                                                    No users found matching your search.
                                                </td>
                                            </tr>
                                        ) : (
                                            filteredUsers.map((user, idx) => (
                                                <motion.tr 
                                                    key={user.username || idx}
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0 }}
                                                    transition={{ delay: idx * 0.05 }}
                                                    className="border-b border-white/5 hover:bg-white/[0.02] transition-colors"
                                                >
                                                    <td className="py-4 px-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-white/10 flex items-center justify-center shrink-0">
                                                                <span className="font-bold text-blue-300 text-xs">
                                                                    {user.username?.charAt(0).toUpperCase()}
                                                                </span>
                                                            </div>
                                                            <span className="font-medium text-white">{user.username}</span>
                                                        </div>
                                                    </td>
                                                    <td className="py-4 px-4">
                                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
                                                            user.role === 'Admin' 
                                                                ? 'bg-purple-500/10 text-purple-300 border-purple-500/20'
                                                                : 'bg-blue-500/10 text-blue-300 border-blue-500/20'
                                                        }`}>
                                                            {user.role === 'Admin' ? <Shield className="w-3 h-3" /> : <UserIcon className="w-3 h-3" />}
                                                            {user.role || 'User'}
                                                        </span>
                                                    </td>
                                                    <td className="py-4 px-4 text-slate-400">
                                                        <div className="flex items-center gap-2">
                                                            <Clock className="w-3.5 h-3.5 opacity-50" />
                                                            {formatDate(user.created_at || user.createdAt)}
                                                        </div>
                                                    </td>
                                                    <td className="py-4 px-4 text-right">
                                                        <button disabled className="text-xs bg-white/5 hover:bg-white/10 text-secondary border border-white/10 px-3 py-1.5 rounded-lg transition-colors cursor-not-allowed opacity-50">
                                                            Manage
                                                        </button>
                                                    </td>
                                                </motion.tr>
                                            ))
                                        )}
                                    </AnimatePresence>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </motion.div>
            ) : (
                <div className="h-full flex flex-col items-center justify-center z-10">
                    <div className="text-center">
                        <h1 className="text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 pb-2">
                            Welcome!
                        </h1>
                        <p className="mt-4 text-xl text-slate-400">
                            To the Regina AI Interface
                        </p>
                    </div>
                </div>
            )}

            {/* Decorative background elements generic to the dash */}
            <div className="absolute inset-0 pointer-events-none z-0">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-[120px]"></div>
            </div>
        </div>
    );
};

export default Dashboard;
