import React, { useState } from 'react';
import { X, Lock, Mail, ShieldCheck } from 'lucide-react';
import { api } from '../services/api';
import type { AuthUser } from '../types/movie';

interface LoginPageProps {
  onClose: () => void;
  onLoginSuccess: (user: AuthUser, token: string) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  onClose,
  onLoginSuccess,
}) => {
  const [email, setEmail] = useState('admin@cinevault.com');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const data = await api.login(email, password);
      onLoginSuccess(data.user, data.token);
      onClose();
    } catch {
      setError('Invalid email or password. Try admin@cinevault.com / admin123');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
      <div className="relative w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl p-6 sm:p-8 shadow-2xl text-zinc-100 space-y-6">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-zinc-800 hover:bg-red-600 text-zinc-400 hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-red-600/20 border border-red-500/30 flex items-center justify-center text-red-500 mx-auto">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-white">Sign In to CineVault</h2>
          <p className="text-xs text-zinc-400">Access admin dashboard & management privileges</p>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-red-950/60 border border-red-800/80 text-red-300 text-xs text-center font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-zinc-300 mb-1">Email / Username</label>
            <div className="relative flex items-center">
              <Mail className="w-4 h-4 text-zinc-500 absolute left-3 pointer-events-none" />
              <input
                type="text"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 bg-zinc-950 border border-zinc-700 rounded-xl text-white focus:outline-none focus:border-red-500 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-zinc-300 mb-1">Password</label>
            <div className="relative flex items-center">
              <Lock className="w-4 h-4 text-zinc-500 absolute left-3 pointer-events-none" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 bg-zinc-950 border border-zinc-700 rounded-xl text-white focus:outline-none focus:border-red-500 text-sm"
              />
            </div>
          </div>

          <div className="bg-zinc-950/70 p-2.5 rounded-lg border border-zinc-800 text-[11px] text-zinc-400">
            <p className="font-semibold text-amber-400">Default Admin Credentials:</p>
            <p>Email: <span className="font-mono text-zinc-200">admin@cinevault.com</span></p>
            <p>Password: <span className="font-mono text-zinc-200">admin123</span></p>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-bold text-sm rounded-xl shadow-lg shadow-red-600/30 transition-all cursor-pointer"
          >
            {isLoading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
};
