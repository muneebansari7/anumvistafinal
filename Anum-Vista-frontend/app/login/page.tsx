"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";

export default function LoginPage() {
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUsername = username.trim();
    if (!cleanUsername) {
      setError("Please enter your username");
      return;
    }
    if (!password) {
      setError("Please enter your password");
      return;
    }

    setError(null);
    setLoading(true);
    try {
      await login(cleanUsername, password);
    } catch (err) {
      setError((err as Error).message || "Invalid username or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-slate-100 dark:bg-[#090d16] px-4">
      <div className="w-full max-w-sm">
        {/* Branding */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-black text-white dark:bg-white dark:text-black font-bold text-base shadow-sm mb-3">
            AV
          </div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
            Anum Vista
          </h1>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
            Finance & Operations Portal
          </p>
        </div>

        {/* Card */}
        <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0d131f] p-6 shadow-sm">
          <div className="mb-4">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">Sign in</h2>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
              Enter your username and password
            </p>
          </div>

          {error && (
            <div className="mb-4 rounded-lg bg-rose-50 border border-rose-200 dark:bg-rose-500/10 dark:border-rose-500/20 px-3 py-2 text-xs text-rose-700 dark:text-rose-300">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-zinc-400 mb-1">
                Username
              </label>
              <input
                type="text"
                required
                autoFocus
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username"
                className="w-full rounded-lg border border-slate-300 dark:border-white/15 bg-white dark:bg-white/[0.04] px-3.5 py-2 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:border-black dark:focus:border-white transition-colors"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-zinc-400 mb-1">
                Password
              </label>
              <input
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-lg border border-slate-300 dark:border-white/15 bg-white dark:bg-white/[0.04] px-3.5 py-2 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:border-black dark:focus:border-white transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-black text-white hover:bg-slate-800 dark:bg-white dark:text-black dark:hover:bg-slate-200 py-2.5 text-xs font-bold transition-colors press-feedback disabled:opacity-50 shadow-sm mt-1"
            >
              {loading ? "Signing in..." : "Continue"}
            </button>
          </form>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-white/10 text-center">
            <p className="text-[11px] text-slate-500 dark:text-zinc-400">
              Active account: <span className="font-mono text-slate-700 dark:text-zinc-200 font-semibold">anumvista</span>
            </p>
          </div>
        </div>

        <p className="mt-4 text-center text-[11px] text-slate-400 dark:text-zinc-500">
          Direct authentication · Property Management System
        </p>
      </div>
    </div>
  );
}
