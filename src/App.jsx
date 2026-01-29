import React from 'react';
import Sidebar from './components/Sidebar';
import ChatInterface from './components/ChatInterface';
import Dashboard from './components/Dashboard';
import ComingSoon from './components/ComingSoon';
import Login from './components/Login';
import { AnimatePresence, motion } from 'framer-motion';
import { Routes, Route, useLocation, Navigate } from 'react-router-dom';

function App() {
    const location = useLocation();
    const isLoginPage = location.pathname === '/login';

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
                    <AnimatePresence mode='wait'>
                        <Routes location={location} key={location.pathname}>
                            <Route path="/login" element={
                                <Login />
                            } />

                            <Route path="/" element={
                                <RequireAuth>
                                    <PageWrapper>
                                        <Dashboard />
                                    </PageWrapper>
                                </RequireAuth>
                            } />
                            <Route path="/chat_session" element={
                                <RequireAuth>
                                    <PageWrapper>
                                        <ChatInterface />
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
        initial={{ opacity: 0, x: 10 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -10 }}
        transition={{ duration: 0.2 }}
        className="w-full h-full flex flex-col"
    >
        {children}
    </motion.div>
);

export default App;
