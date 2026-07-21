"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { LogIn, Mail, Lock } from "lucide-react";
import Logo from "@/components/Logo";
import { signInWithGoogle } from "@/lib/firebase";

export default function LoginPage() {
  const { login, googleLogin } = useAuth();
  const [emailOrUsername, setEmailOrUsername] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!emailOrUsername || !password)
      return setError("Please enter all fields");

    setError("");
    setLoading(true);

    const result = await login(emailOrUsername, password);
    if (!result.success) {
      setError(result.error || "Invalid credentials");
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError("");
    setGoogleLoading(true);
    try {
      const idToken = await signInWithGoogle();
      const result = await googleLogin(idToken);
      if (!result.success) {
        setError(result.error || "Google sign-in failed");
      }
    } catch (err) {
      console.error(err);
      setError(err.message || "Google sign-in failed");
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Visual background glow elements */}
      <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-indigo-600/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-600/10 rounded-full blur-3xl"></div>

      <div className="w-full max-w-md glass-panel border border-zinc-900 bg-zinc-900/20 backdrop-blur-2xl p-8 rounded-3xl shadow-2xl animate-fade-in z-10 flex flex-col gap-6">
        {/* Title */}
        <div className="flex flex-col items-center text-center gap-2">
          <Link
            href="/"
            className="flex items-center gap-2 font-bold text-2xl tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-500 mb-2"
          >
            <Logo />
          </Link>
          <h2 className="text-xl font-bold text-zinc-100">Welcome Back</h2>
          <p className="text-xs text-zinc-500 font-light">
            Sign in to resume watching, liking, and uploading videos.
          </p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold px-4 py-3 rounded-2xl">
            {error}
          </div>
        )}

        {/* Google Sign-In */}
        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={googleLoading}
          className="w-full flex items-center justify-center gap-3 bg-zinc-100 hover:bg-zinc-200 text-zinc-900 font-semibold text-sm py-3 rounded-2xl transition-all duration-200 disabled:opacity-50"
        >
          <svg width="18" height="18" viewBox="0 0 48 48">
            <path
              fill="#FFC107"
              d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"
            />
            <path
              fill="#FF3D00"
              d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"
            />
            <path
              fill="#4CAF50"
              d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"
            />
            <path
              fill="#1976D2"
              d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 01-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"
            />
          </svg>
          <span>
            {googleLoading ? "Signing in..." : "Continue with Google"}
          </span>
        </button>

        {/* Divider */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-zinc-800"></div>
          <span className="text-[10px] text-zinc-600 font-semibold uppercase">
            or
          </span>
          <div className="flex-1 h-px bg-zinc-800"></div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-zinc-400 font-semibold pl-1">
              Email or Username
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="e.g. john_doe"
                value={emailOrUsername}
                onChange={(e) => setEmailOrUsername(e.target.value)}
                required
                className="w-full bg-zinc-950 border border-zinc-850 rounded-2xl py-3 pl-10 pr-4 text-sm text-zinc-200 placeholder-zinc-650 focus:outline-none focus:border-indigo-500 transition-colors"
              />
              <Mail
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-600"
                size={16}
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-zinc-400 font-semibold pl-1">
              Password
            </label>
            <div className="relative">
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-zinc-950 border border-zinc-850 rounded-2xl py-3 pl-10 pr-4 text-sm text-zinc-200 placeholder-zinc-650 focus:outline-none focus:border-indigo-500 transition-colors"
              />
              <Lock
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-600"
                size={16}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-sm py-3.5 rounded-2xl shadow-lg shadow-indigo-600/10 transition-all duration-300 mt-2 disabled:opacity-40 flex items-center justify-center gap-2"
          >
            {loading ? (
              <span>Logging in...</span>
            ) : (
              <>
                <span>Sign In</span>
                <LogIn size={16} />
              </>
            )}
          </button>
        </form>

        <div className="text-center text-xs text-zinc-500 border-t border-zinc-900/60 pt-4 mt-2">
          <span>Don't have an account? </span>
          <Link
            href="/register"
            className="text-indigo-400 hover:text-indigo-300 font-semibold transition-colors ml-1"
          >
            Register now
          </Link>
        </div>
      </div>
    </div>
  );
}
