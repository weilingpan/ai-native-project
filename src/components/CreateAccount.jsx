import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Lock, Shield, Loader2, UserPlus, AlertCircle, Eye, EyeOff, CheckCircle2, Paperclip } from 'lucide-react';

export default function CreateAccount() {
    const [formData, setFormData] = useState({
        username: '',
        password: '',
        confirmPassword: '',
        role: 'User'
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [countdown, setCountdown] = useState(5);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const navigate = useNavigate();

    useEffect(() => {
        if (!success) return;
        if (countdown === 0) { navigate('/login'); return; }
        const timer = setTimeout(() => setCountdown((prev) => prev - 1), 1000);
        return () => clearTimeout(timer);
    }, [countdown, success, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (formData.password.length < 8) {
            setError('Password must be at least 8 characters.');
            return;
        }

        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        setIsLoading(true);
        try {
            // Exclude confirmPassword from the request payload
            const payload = {
                username: formData.username,
                password: formData.password,
                role: formData.role
            };

            const response = await fetch('/accounts/', {
                method: 'POST',
                headers: {
                    'accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                setCountdown(5);
                setSuccess(true);
            } else {
                const errorData = await response.json();
                setError(errorData.detail || errorData.error || 'Failed to create account.');
            }
        } catch (err) {
            console.error('Error:', err);
            setError('An error occurred during account creation.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    return (
        <div className="flex min-h-screen w-full items-center justify-center bg-background p-4 text-text overflow-hidden relative">
            <AnimatePresence>
                {success && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="bg-sidebar border border-white/10 p-8 rounded-2xl shadow-2xl flex flex-col items-center max-w-sm mx-4"
                        >
                            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mb-6">
                                <CheckCircle2 className="w-8 h-8 text-green-500" />
                            </div>
                            <h2 className="text-2xl font-bold text-white mb-2">Account Created!</h2>
                            <p className="text-secondary text-center mb-6">
                                Your account has been successfully created. You can now log in.
                            </p>
                            <div className="text-sm text-secondary bg-background/50 py-2 px-4 rounded-full flex items-center gap-2">
                                <Loader2 className="w-4 h-4 animate-spin text-primary" />
                                <span>
                                    Redirecting in <span className="text-primary font-bold text-base mx-0.5">{countdown}</span> seconds...
                                </span>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Background Effects */}
            <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-primary/20 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-accent/20 rounded-full blur-[120px] pointer-events-none" />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md z-10 flex flex-col max-h-[95vh]"
            >
                <div className="bg-sidebar/50 backdrop-blur-xl border border-white/10 rounded-2xl p-8 py-8 shadow-2xl overflow-y-auto overscroll-contain
                                [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-white/10 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-white/20"
                >
                    <div className="mb-8 text-center shrink-0">
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mb-2">
                            Create Account
                        </h1>
                        <p className="text-secondary text-sm">
                            Join us to get started!
                        </p>
                    </div>

                    <div className="relative">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-secondary ml-1">
                                    Username <span className="text-red-400 ml-0.5">*</span>
                                </label>
                                <div className="relative group">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary group-focus-within:text-primary transition-colors h-5 w-5" />
                                    <input
                                        type="text"
                                        name="username"
                                        value={formData.username}
                                        onChange={handleChange}
                                        required
                                        className="w-full bg-background/50 border border-white/10 rounded-xl py-3 pl-10 pr-4 outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all placeholder:text-slate-600"
                                        placeholder="Enter your username"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-secondary ml-1">
                                    Password <span className="text-red-400 ml-0.5">*</span>
                                </label>
                                <div className="relative group">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary group-focus-within:text-primary transition-colors h-5 w-5" />
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        name="password"
                                        value={formData.password}
                                        onChange={handleChange}
                                        required
                                        className="w-full bg-background/50 border border-white/10 rounded-xl py-3 pl-10 pr-10 outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all placeholder:text-slate-600"
                                        placeholder="Create a password"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary hover:text-primary transition-colors focus:outline-none"
                                    >
                                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-secondary ml-1">
                                    Confirm Password <span className="text-red-400 ml-0.5">*</span>
                                </label>
                                <div className="relative group">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary group-focus-within:text-primary transition-colors h-5 w-5" />
                                    <input
                                        type={showConfirmPassword ? 'text' : 'password'}
                                        name="confirmPassword"
                                        value={formData.confirmPassword}
                                        onChange={handleChange}
                                        required
                                        className="w-full bg-background/50 border border-white/10 rounded-xl py-3 pl-10 pr-10 outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all placeholder:text-slate-600"
                                        placeholder="Confirm your password"
                                    />
                                    <div className="absolute right-12 top-1/2 -translate-y-1/2 pointer-events-none transition-all duration-300">
                                        {formData.confirmPassword && (
                                            formData.password === formData.confirmPassword
                                                ? <CheckCircle2 className="h-4 w-4 text-green-500" />
                                                : <AlertCircle className="h-4 w-4 text-red-500 animate-pulse" />
                                        )}
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary hover:text-primary transition-colors focus:outline-none"
                                    >
                                        {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <label className="text-sm font-medium text-secondary ml-1">
                                    Account Role <span className="text-red-400 ml-0.5">*</span>
                                </label>
                                <div className="flex gap-3">
                                    {['User', 'Admin'].map((r) => (
                                        <button
                                            key={r}
                                            type="button"
                                            onClick={() => setFormData(prev => ({ ...prev, role: r }))}
                                            className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border transition-all relative overflow-hidden group/role ${
                                                formData.role === r
                                                    ? 'bg-primary/10 border-primary/50 text-text ring-1 ring-primary/20'
                                                    : 'bg-background/40 border-white/5 text-secondary hover:border-white/10'
                                            }`}
                                        >
                                            <Shield className={`h-4 w-4 transition-colors ${formData.role === r ? 'text-primary' : 'text-slate-500'}`} />
                                            <span className="text-sm font-medium">{r}</span>
                                            {formData.role === r && (
                                                <motion.div
                                                    layoutId="role-bg"
                                                    className="absolute inset-0 bg-primary/5 -z-10"
                                                />
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>



                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    className="flex items-center gap-2 text-red-400 text-sm bg-red-400/10 p-3 rounded-lg"
                                >
                                    <AlertCircle className="h-4 w-4 shrink-0" />
                                    <p>{error}</p>
                                </motion.div>
                            )}



                            <button
                                type="submit"
                                disabled={isLoading || !formData.username || !formData.password || !formData.confirmPassword}
                                className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-3 rounded-xl transition-all shadow-lg shadow-primary/25 flex items-center justify-center gap-2"
                            >
                                {isLoading ? (
                                    <Loader2 className="animate-spin h-5 w-5" />
                                ) : (
                                    <>
                                        Sign Up
                                        <UserPlus className="h-4 w-4" />
                                    </>
                                )}
                            </button>
                        </form>
                    </div>
                </div>
                <p className="mt-6 text-center text-sm text-secondary shrink-0 pb-4">
                    Already have an account?{' '}
                    <Link to="/login" className="text-primary hover:underline font-medium">
                        Log in
                    </Link>
                </p>
            </motion.div>
        </div>
    );
}
