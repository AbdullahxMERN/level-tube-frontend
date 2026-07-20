"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Logo from "@/components/Logo";
import {
  Search,
  Video,
  LogOut,
  LayoutDashboard,
  User as UserIcon,
  Menu,
  X,
} from "lucide-react";

export default function Navbar({ onToggleSidebar }) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [searchQuery, setSearchQuery] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  useEffect(() => {
    setSearchQuery(searchParams.get("query") || "");
  }, [searchParams]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/?query=${encodeURIComponent(searchQuery)}`);
    } else {
      router.push("/");
    }
    setMobileSearchOpen(false);
  };

  return (
    <nav className="sticky top-0 z-40 w-full glass-panel border-b border-zinc-800 bg-zinc-950/70 backdrop-blur-md px-4 py-3">
      {/* Main row */}
      <div className="flex items-center justify-between">
        {/* Left: Logo & Sidebar Toggle — hide on mobile when search is open */}
        <div
          className={`items-center gap-3 ${mobileSearchOpen ? "hidden" : "flex"} md:flex`}
        >
          <button
            onClick={onToggleSidebar}
            className="p-2 hover:bg-zinc-800 rounded-full transition-colors duration-200 text-zinc-400 hover:text-zinc-100 focus:outline-none"
          >
            <Menu size={20} />
          </button>
          <Link href="/" className="flex items-center">
            <Logo />
          </Link>
        </div>

        {/* Middle: Search Bar — visible on desktop always, on mobile only when toggled open */}
        <form
          onSubmit={handleSearchSubmit}
          className={`${mobileSearchOpen ? "flex" : "hidden"} md:flex items-center flex-1 md:max-w-lg md:mx-4`}
        >
          <div className="relative w-full">
            <input
              type="text"
              autoFocus={mobileSearchOpen}
              placeholder="Search videos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-l-full py-2 pl-4 pr-10 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all duration-200"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 text-xs"
              >
                Clear
              </button>
            )}
          </div>
          <button
            type="submit"
            className="bg-zinc-800 border-y border-r border-zinc-800 hover:bg-zinc-700 hover:border-zinc-700 px-5 py-2 rounded-r-full text-zinc-400 hover:text-zinc-100 transition-all duration-200 flex items-center justify-center"
          >
            <Search size={18} />
          </button>

          {/* Close button — mobile search overlay only */}
          <button
            type="button"
            onClick={() => setMobileSearchOpen(false)}
            className="md:hidden ml-2 p-2 text-zinc-400 hover:text-zinc-100 rounded-full hover:bg-zinc-800 transition-colors flex-shrink-0"
          >
            <X size={20} />
          </button>
        </form>

        {/* Right: Actions & Profile — hide on mobile when search is open */}
        <div
          className={`items-center gap-2 md:gap-4 ${mobileSearchOpen ? "hidden" : "flex"} md:flex`}
        >
          {/* Mobile search trigger icon */}
          <button
            onClick={() => setMobileSearchOpen(true)}
            className="md:hidden p-2 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded-full transition-colors duration-200"
            aria-label="Open search"
          >
            <Search size={20} />
          </button>

          {user ? (
            <>
              {/* Upload button - hidden on mobile since MobileBottomNav already
                  has a dedicated Upload button; still shown on desktop, which
                  has no bottom nav */}
              <Link
                href="/dashboard?upload=true"
                className="hidden md:flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-medium text-sm px-4 py-2 rounded-full transition-all duration-300 shadow-md shadow-indigo-600/10 focus:outline-none"
              >
                <Video size={16} />
                <span className="hidden sm:inline">Upload</span>
              </Link>

              {/* Notification bell removed */}

              {/* Profile Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center focus:outline-none"
                >
                  <img
                    src={
                      user.avatar ||
                      "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100"
                    }
                    alt={user.fullName}
                    className="w-8 h-8 rounded-full border border-zinc-700 object-cover ring-2 ring-transparent hover:ring-indigo-500 transition-all duration-200"
                  />
                </button>

                {dropdownOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-30"
                      onClick={() => setDropdownOpen(false)}
                    />
                    <div className="absolute right-0 mt-2 w-56 glass-panel bg-zinc-900 border border-zinc-800 rounded-2xl shadow-xl py-2 z-40 animate-fade-in">
                      <div className="px-4 py-2 border-b border-zinc-800">
                        <p className="text-sm font-semibold text-zinc-200 truncate">
                          {user.fullName}
                        </p>
                        <p className="text-xs text-zinc-500 truncate">
                          @{user.userName}
                        </p>
                      </div>
                      <Link
                        href={`/channel/${user.userName}`}
                        onClick={() => setDropdownOpen(false)}
                        className="w-full text-left px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800 flex items-center gap-3 transition-colors duration-200"
                      >
                        <UserIcon size={16} className="text-zinc-400" />
                        <span>Your Channel</span>
                      </Link>
                      <Link
                        href="/dashboard"
                        onClick={() => setDropdownOpen(false)}
                        className="w-full text-left px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800 flex items-center gap-3 transition-colors duration-200"
                      >
                        <LayoutDashboard size={16} className="text-zinc-400" />
                        <span>Studio Dashboard</span>
                      </Link>
                      <button
                        onClick={() => {
                          setDropdownOpen(false);
                          logout();
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-zinc-800 flex items-center gap-3 transition-colors duration-200 border-t border-zinc-800 mt-1"
                      >
                        <LogOut size={16} />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="text-zinc-300 hover:text-white hover:bg-zinc-800 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="bg-zinc-100 hover:bg-zinc-200 text-zinc-950 px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200"
              >
                Sign Up
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
