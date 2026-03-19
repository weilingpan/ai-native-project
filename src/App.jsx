import React from 'react';
import Sidebar from './components/Sidebar';
import ChatInterface from './components/ChatInterface';
import AgentInterface from './components/AgentInterface';
import Dashboard from './components/Dashboard';
import ComingSoon from './components/ComingSoon';
import Login from './components/Login';
import CreateAccount from './components/CreateAccount';
import { AnimatePresence, motion } from 'framer-motion';
import { Routes, Route, useLocation, Navigate } from 'react-router-dom';

function App() {
    const location = useLocation();
    const isLoginPage = location.pathname === '/login' || location.pathname === '/signup';

    return (
        <div className="flex h-screen w-full bg-background overflow-hidden font-sans text-text">
            {!isLoginPage && <Sidebar />}
            <main className="flex-1 h-full min-w-0 flex flex-col relative">
                {/* Subtle background gradient effects */}
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
                    <div className="absolute top-[-20%] right-[-10%] w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[100px]"></div>
                    <div className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[100px]"></div>
                </div>

                {/* Content */}
                <div className="relative z-10 w-full h-full flex flex-col">
                    <AnimatePresence mode='sync'>
                        <Routes location={location} key={location.pathname.split('/')[1] || '/'}>
                            <Route path="/login" element={<Login />} />
                            <Route path="/signup" element={<CreateAccount />} />

                            <Route path="/" element={
                                <RequireAuth>
                                    <PageWrapper>
                                        <Dashboard />
                                    </PageWrapper>
                                </RequireAuth>
                            } />
                            <Route path="/chat" element={
                                <RequireAuth>
                                    <PageWrapper>
                                        <ChatInterface />
                                    </PageWrapper>
                                </RequireAuth>
                            } />
                            <Route path="/chat/:session_id" element={
                                <RequireAuth>
                                    <PageWrapper>
                                        <ChatInterface />
                                    </PageWrapper>
                                </RequireAuth>
                            } />

                            <Route path="/agent" element={
                                <RequireAuth>
                                    <PageWrapper>
                                        <AgentInterface />
                                    </PageWrapper>
                                </RequireAuth>
                            } />
                            <Route path="/agent/:session_id" element={
                                <RequireAuth>
                                    <PageWrapper>
                                        <AgentInterface />
                                    </PageWrapper>
                                </RequireAuth>
                            } />

                            <Route path="*" element={
                                <RequireAuth>
                                    <ComingSoon />
                                </RequireAuth>
                            } />
                        </Routes>
                    </AnimatePresence>
                </div>
            </main>
        </div>
    )
}

// Protected Route Component
const RequireAuth = ({ children }) => {
    const isAuthenticated = localStorage.getItem('isAuthenticated');

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    return children;
};

// Helper wrapper for page transition animations
const PageWrapper = ({ children }) => (
    <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}
        className="w-full h-full flex flex-col absolute inset-0"
    >
        {children}
    </motion.div>
);

export default App;
