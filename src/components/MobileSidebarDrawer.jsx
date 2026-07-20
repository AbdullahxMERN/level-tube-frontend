"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { X, History, ThumbsUp, Library, Flame } from "lucide-react";
import Logo from "@/components/Logo";

export default function MobileSidebarDrawer({ open, onClose }) {
  const pathname = usePathname();

  const menuItems = [
    { name: "Trending", href: "/?tab=trending", icon: Flame },
    { name: "History", href: "/history", icon: History },
    { name: "Liked Videos", href: "/liked-videos", icon: ThumbsUp },
    { name: "Playlists", href: "/playlists", icon: Library },
  ];

  if (!open) return null;

  return (
    <div className="md:hidden fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Slide-in panel */}
      <div className="relative w-72 max-w-[80%] h-full bg-zinc-950 border-r border-zinc-800 flex flex-col animate-slide-in">
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-900">
          <Logo size="compact" />
          <button
            onClick={onClose}
            className="text-zinc-500 hover:text-zinc-200 p-1.5 rounded-lg hover:bg-zinc-900 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-3 px-2 flex flex-col gap-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={onClose}
                className={`flex items-center gap-4 px-3 py-3 rounded-xl transition-all duration-200 ${
                  isActive
                    ? "bg-indigo-600/10 text-indigo-400 font-semibold"
                    : "text-zinc-300 hover:bg-zinc-900/60 hover:text-zinc-100"
                }`}
              >
                <Icon
                  size={20}
                  className={isActive ? "text-indigo-400" : "text-zinc-500"}
                />
                <span className="text-sm tracking-wide">{item.name}</span>
              </Link>
            );
          })}
        </div>

        <div className="p-4 border-t border-zinc-900 text-xs text-zinc-600">
          <p>© 2026 LevelTube Inc.</p>
        </div>
      </div>
    </div>
  );
}
