import React from 'react';
import Sidebar from './components/Sidebar';
import ChatInterface from './components/ChatInterface';
import Dashboard from './components/Dashboard';
import ComingSoon from './components/ComingSoon';
import { AnimatePresence, motion } from 'framer-motion';
import { Routes, Route, useLocation } from 'react-router-dom';

function App() {
    const location = useLocation();

    return (
        <div className="flex h-screen w-full bg-background overflow-hidden font-sans text-text">
            <Sidebar />
            <main className="flex-1 h-full min-w-0 flex flex-col relative">
                {/* Subtle background gradient effects */}
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
                    <div className="absolute top-[-20%] right-[-10%] w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[100px]"></div>
                    <div className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[100px]"></div>
                </div>

                {/* Content */}
                <div className="relative z-10 w-full h-full flex flex-col">
                    <AnimatePresence mode='wait'>
                        {/* We wrap Routes in motion.div based on key=location.pathname to animate page transitions if desired. 
                   However, AnimatePresence needs a direct child with key. The Routes component switches children. 
                   Common pattern is: <Routes location={location} key={location.pathname}>... 
               */}
                        <Routes location={location} key={location.pathname}>
                            <Route path="/" element={
                                <PageWrapper>
                                    <Dashboard />
                                </PageWrapper>
                            } />
                            <Route path="/chat_session" element={
                                <PageWrapper>
                                    <ChatInterface />
                                </PageWrapper>
                            } />
                            <Route path="*" element={
                                <ComingSoon />
                            } />
                        </Routes>
                    </AnimatePresence>
                </div>
            </main>
        </div>
    )
}

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
