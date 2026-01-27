import React from 'react';
import { Send, Paperclip, MoreVertical, Bot, User } from 'lucide-react';

const ChatInterface = () => {
    return (
        <div className="flex-1 flex flex-col h-full bg-slate-900/50 relative overflow-hidden">
            {/* Chat Header */}
            <div className="h-20 border-b border-slate-700/50 flex items-center justify-between px-6 bg-slate-900/80 backdrop-blur-md sticky top-0 z-10">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400">
                        <Bot size={24} />
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold text-white">AI Assistant</h2>
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                            <span className="text-xs text-slate-400">Always active</span>
                        </div>
                    </div>
                </div>
                <button className="p-2 hover:bg-slate-800 rounded-full text-slate-400 transition-colors">
                    <MoreVertical size={20} />
                </button>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Bot Message */}
                <div className="flex gap-4 max-w-3xl">
                    <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 shrink-0 mt-1">
                        <Bot size={18} />
                    </div>
                    <div className="space-y-2">
                        <div className="p-4 rounded-2xl bg-slate-800/50 text-slate-200 border border-slate-700/50 shadow-sm rounded-tl-none">
                            <p>Hello! I'm your AI assistant. How can I help you today? I can assist with code, writing, analysis, and much more.</p>
                        </div>
                        <span className="text-xs text-slate-500 px-1">10:23 AM</span>
                    </div>
                </div>

                {/* User Message */}
                <div className="flex gap-4 max-w-3xl ml-auto flex-row-reverse">
                    <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400 shrink-0 mt-1">
                        <User size={18} />
                    </div>
                    <div className="space-y-2">
                        <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-600 to-purple-600 text-white shadow-md rounded-tr-none">
                            <p>Can you show me a react sidebar component?</p>
                        </div>
                        <span className="text-xs text-slate-500 px-1 text-right block">10:24 AM</span>
                    </div>
                </div>

                {/* Bot Message */}
                <div className="flex gap-4 max-w-3xl">
                    <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 shrink-0 mt-1">
                        <Bot size={18} />
                    </div>
                    <div className="space-y-2">
                        <div className="p-4 rounded-2xl bg-slate-800/50 text-slate-200 border border-slate-700/50 shadow-sm rounded-tl-none">
                            <p>Certainly! I can help you design a responsive and interactive sidebar using React and Tailwind CSS. Would you like it to have specific features like collapsible functionality?</p>
                        </div>
                        <span className="text-xs text-slate-500 px-1">10:25 AM</span>
                    </div>
                </div>
            </div>

            {/* Input Area */}
            <div className="p-6 bg-slate-900/80 backdrop-blur-md border-t border-slate-700/50">
                <div className="max-w-4xl mx-auto relative group">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-xl blur transition-opacity opacity-0 group-hover:opacity-100 duration-500"></div>
                    <div className="relative flex items-end gap-2 bg-slate-800/50 border border-slate-700/50 rounded-xl p-2 shadow-inner focus-within:ring-2 focus-within:ring-blue-500/50 focus-within:border-blue-500/50 transition-all">
                        <button className="p-3 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors">
                            <Paperclip size={20} />
                        </button>
                        <textarea
                            placeholder="Type your message..."
                            className="flex-1 bg-transparent border-none focus:ring-0 text-slate-200 placeholder-slate-500 resize-none h-12 py-3 max-h-32"
                        />
                        <button className="p-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg shadow-lg hover:shadow-blue-500/25 transition-all">
                            <Send size={18} />
                        </button>
                    </div>
                    <div className="text-center mt-2">
                        <span className="text-xs text-slate-500">AI can make mistakes. Consider checking important information.</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ChatInterface;
