"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import {
  User,
  Mail,
  Lock,
  UserPlus,
  Image as ImageIcon,
  Camera,
} from "lucide-react";
import Logo from "@/components/Logo";
export default function RegisterPage() {
  const { register } = useAuth();
  const [fullName, setFullName] = useState("");
  const [userName, setUserName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [avatar, setAvatar] = useState(null);
  const [coverImage, setCoverImage] = useState(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!fullName || !userName || !email || !password || !avatar) {
      return setError(
        "Full Name, Username, Email, Password, and Avatar are required.",
      );
    }

    setError("");
    setLoading(true);

    const fd = new FormData();
    fd.append("fullName", fullName);
    fd.append("userName", userName);
    fd.append("email", email);
    fd.append("password", password);
    fd.append("avatar", avatar);
    if (coverImage) {
      fd.append("coverImage", coverImage);
    }

    const result = await register(fd);
    if (!result.success) {
      setError(result.error || "Registration failed");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Glow backgrounds */}
      <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-indigo-600/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-600/10 rounded-full blur-3xl"></div>

      <div className="w-full max-w-lg glass-panel border border-zinc-900 bg-zinc-900/20 backdrop-blur-2xl p-8 rounded-3xl shadow-2xl animate-fade-in z-10 flex flex-col gap-5">
        {/* Title */}
        <div className="flex flex-col items-center text-center gap-1">
          <Link
            href="/"
            className="flex items-center gap-2 font-bold text-2xl tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-500 mb-1"
          >
            <logo />
          </Link>
          <h2 className="text-xl font-bold text-zinc-100">Create Account</h2>
          <p className="text-xs text-zinc-500 font-light">
            Set up your profile and start uploading your custom videos.
          </p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold px-4 py-3 rounded-2xl">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-zinc-400 font-semibold pl-1">
                Full Name
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="John Doe"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  className="w-full bg-zinc-950 border border-zinc-850 rounded-2xl py-2.5 pl-10 pr-4 text-sm text-zinc-200 placeholder-zinc-650 focus:outline-none focus:border-indigo-500"
                />
                <User
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-600"
                  size={16}
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-zinc-400 font-semibold pl-1">
                Username
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="john_doe"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  required
                  className="w-full bg-zinc-950 border border-zinc-850 rounded-2xl py-2.5 pl-10 pr-4 text-sm text-zinc-200 placeholder-zinc-650 focus:outline-none focus:border-indigo-500"
                />
                <User
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-600"
                  size={16}
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-zinc-400 font-semibold pl-1">
              Email Address
            </label>
            <div className="relative">
              <input
                type="email"
                placeholder="john@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-zinc-950 border border-zinc-850 rounded-2xl py-2.5 pl-10 pr-4 text-sm text-zinc-200 placeholder-zinc-650 focus:outline-none focus:border-indigo-500"
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
                placeholder="Min 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-zinc-950 border border-zinc-850 rounded-2xl py-2.5 pl-10 pr-4 text-sm text-zinc-200 placeholder-zinc-650 focus:outline-none focus:border-indigo-500"
              />
              <Lock
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-600"
                size={16}
              />
            </div>
          </div>

          {/* Files dropzone inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-zinc-900 pt-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-zinc-400 font-semibold pl-1 flex items-center gap-1">
                <Camera size={12} />
                <span>Avatar Profile (Required)</span>
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setAvatar(e.target.files?.[0])}
                required
                className="bg-zinc-950 border border-zinc-850 rounded-2xl py-2 px-3 text-xs text-zinc-500 file:mr-2 file:py-1 file:px-2 file:rounded-lg file:border-0 file:text-[10px] file:font-semibold file:bg-zinc-900 file:text-zinc-200 hover:file:bg-zinc-800"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-zinc-400 font-semibold pl-1 flex items-center gap-1">
                <ImageIcon size={12} />
                <span>Cover Banner (Optional)</span>
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setCoverImage(e.target.files?.[0])}
                className="bg-zinc-950 border border-zinc-850 rounded-2xl py-2 px-3 text-xs text-zinc-500 file:mr-2 file:py-1 file:px-2 file:rounded-lg file:border-0 file:text-[10px] file:font-semibold file:bg-zinc-900 file:text-zinc-200 hover:file:bg-zinc-800"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-sm py-3 rounded-2xl shadow-lg shadow-indigo-600/10 transition-all duration-300 mt-2 disabled:opacity-40 flex items-center justify-center gap-2"
          >
            {loading ? (
              <span>Creating profile...</span>
            ) : (
              <>
                <span>Register</span>
                <UserPlus size={16} />
              </>
            )}
          </button>
        </form>

        <div className="text-center text-xs text-zinc-500 border-t border-zinc-900/60 pt-4 mt-2">
          <span>Already have an account? </span>
          <Link
            href="/login"
            className="text-indigo-400 hover:text-indigo-300 font-semibold transition-colors ml-1"
          >
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
