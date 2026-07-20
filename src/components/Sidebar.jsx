"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  History,
  ThumbsUp,
  Library,
  MessageSquare,
  LayoutDashboard,
  UserCheck,
  Flame,
} from "lucide-react";

export default function Sidebar({ collapsed }) {
  const pathname = usePathname();

  const menuItems = [
    { name: "Home", href: "/", icon: Home },
    { name: "Trending", href: "/?tab=trending", icon: Flame },
    { name: "Subscriptions", href: "/subscriptions", icon: UserCheck },
    { name: "History", href: "/history", icon: History },
    { name: "Liked Videos", href: "/liked-videos", icon: ThumbsUp },
    { name: "Playlists", href: "/playlists", icon: Library },
    { name: "Tweets Feed", href: "/tweets", icon: MessageSquare },
    { name: "Studio Dashboard", href: "/dashboard", icon: LayoutDashboard },
  ];

  return (
    // Hidden on mobile (< md breakpoint) - mobile uses MobileBottomNav instead.
    // Desktop/tablet layout and behavior are completely unchanged.
    <aside
      className={`hidden md:flex glass-panel border-r border-zinc-800 bg-zinc-950/40 text-zinc-400 flex-col transition-all duration-300 ${
        collapsed ? "w-16" : "w-64"
      }`}
    >
      <div className="flex-1 py-4 flex flex-col gap-1 px-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-4 px-3 py-3 rounded-xl transition-all duration-200 group ${
                isActive
                  ? "bg-indigo-600/10 text-indigo-400 font-semibold"
                  : "hover:bg-zinc-900/60 hover:text-zinc-100"
              }`}
            >
              <div
                className={`${
                  isActive
                    ? "text-indigo-400"
                    : "text-zinc-500 group-hover:text-zinc-300"
                } transition-colors duration-200`}
              >
                <Icon size={20} />
              </div>

              {!collapsed && (
                <span className="text-sm tracking-wide transition-opacity duration-200">
                  {item.name}
                </span>
              )}
            </Link>
          );
        })}
      </div>

      {!collapsed && (
        <div className="p-4 border-t border-zinc-800 text-xs text-zinc-600">
          <p>© 2026 LevelTube Inc.</p>
        </div>
      )}
    </aside>
  );
}
