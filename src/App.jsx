import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import ChatInterface from './components/ChatInterface';
import Dashboard from './components/Dashboard';
import { AnimatePresence, motion } from 'framer-motion';

function App() {
    const [currentView, setCurrentView] = useState('home');

    const renderContent = () => {
        switch (currentView) {
            case 'home':
                return <Dashboard />;
            case 'chat':
                return <ChatInterface />;
            default:
                return <div className="flex-1 flex items-center justify-center text-slate-500">Coming Soon</div>;
        }
    };

    return (
        <div className="flex h-screen w-full bg-background overflow-hidden font-sans text-text">
            <Sidebar activeItem={currentView} onNavigate={setCurrentView} />
            <main className="flex-1 h-full min-w-0 flex flex-col relative">
                {/* Subtle background gradient effects */}
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
                    <div className="absolute top-[-20%] right-[-10%] w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[100px]"></div>
                    <div className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[100px]"></div>
                </div>

                {/* Content */}
                <div className="relative z-10 w-full h-full flex flex-col">
                    <AnimatePresence mode='wait'>
                        <motion.div
                            key={currentView}
                            initial={{ opacity: 0, x: 10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -10 }}
                            transition={{ duration: 0.2 }}
                            className="w-full h-full flex flex-col"
                        >
                            {renderContent()}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </main>
        </div>
    )
}

export default App;
