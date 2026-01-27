import React from 'react';
import { motion } from 'framer-motion';

const Dashboard = () => {
    return (
        <div className="flex-1 h-full flex flex-col items-center justify-center relative overflow-hidden text-white/90">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="z-10 text-center"
            >
                <h1 className="text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 pb-2">
                    Welcome!
                </h1>
                <p className="mt-4 text-xl text-slate-400">
                    To the Regina AI Interface
                </p>
            </motion.div>

            {/* Decorative background elements generic to the dash */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-[120px]"></div>
            </div>
        </div>
    );
};

export default Dashboard;
