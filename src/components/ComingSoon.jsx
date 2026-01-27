import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Rocket, ArrowLeft, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ComingSoon = () => {
    const navigate = useNavigate();

    return (
        <div className="flex-1 h-full flex flex-col items-center justify-center relative overflow-hidden bg-slate-900/50">
            {/* Ambient Background Animations */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <motion.div
                    animate={{
                        scale: [1, 1.2, 1],
                        rotate: [0, 90, 0],
                        opacity: [0.3, 0.5, 0.3],
                    }}
                    transition={{
                        duration: 15,
                        repeat: Infinity,
                        ease: "linear"
                    }}
                    className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-[100px]"
                />
                <motion.div
                    animate={{
                        scale: [1, 1.5, 1],
                        rotate: [0, -45, 0],
                        opacity: [0.2, 0.4, 0.2],
                    }}
                    transition={{
                        duration: 20,
                        repeat: Infinity,
                        ease: "linear",
                        delay: 2
                    }}
                    className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-600/20 rounded-full blur-[100px]"
                />
            </div>

            {/* Main Content Card */}
            <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.5, type: "spring" }}
                className="relative z-10 max-w-md w-full mx-4 p-8 rounded-3xl bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 shadow-2xl flex flex-col items-center text-center"
            >
                {/* Floating Icon */}
                <div className="relative mb-8">
                    <motion.div
                        animate={{ y: [-10, 10, -10] }}
                        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                        className="w-24 h-24 rounded-2xl bg-gradient-to-tr from-blue-500 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/25 relative z-10"
                    >
                        <Rocket size={48} className="text-white fill-white/20" />
                    </motion.div>

                    {/* Decorative Elements around icon */}
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                        className="absolute inset-0 -m-2 border border-dashed border-slate-600 rounded-3xl z-0"
                    />
                    <motion.div
                        animate={{ scale: [1, 1.5, 1], opacity: [1, 0, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="absolute -right-4 -top-4 text-yellow-400"
                    >
                        <Sparkles size={24} />
                    </motion.div>
                    <motion.div
                        animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                        transition={{ duration: 3, repeat: Infinity, delay: 1 }}
                        className="absolute -left-2 -bottom-2 text-purple-400"
                    >
                        <Star size={20} fill="currentColor" />
                    </motion.div>
                </div>

                {/* Text Content */}
                <h1 className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white via-blue-100 to-slate-300 mb-4">
                    Coming Soon
                </h1>

                <p className="text-slate-400 mb-8 leading-relaxed">
                    We're working hard to bring you this feature. <br />
                    It's going to be amazing, stay tuned!
                </p>

                {/* Construction Progress Bar (Just for looks) */}
                <div className="w-full h-1.5 bg-slate-700/50 rounded-full overflow-hidden mb-8 max-w-[200px]">
                    <motion.div
                        initial={{ x: '-100%' }}
                        animate={{ x: '100%' }}
                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                        className="w-1/2 h-full bg-gradient-to-r from-transparent via-blue-500 to-transparent"
                    />
                </div>

                {/* Action Button */}
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => navigate('/')}
                    className="flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-700/50 hover:bg-slate-700 text-white border border-slate-600 transition-all hover:shadow-lg hover:shadow-blue-500/10 group"
                >
                    <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
                    <span>Back to Home</span>
                </motion.button>
            </motion.div>
        </div>
    );
};

export default ComingSoon;
