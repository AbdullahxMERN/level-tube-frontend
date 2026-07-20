"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  UserCheck,
  MessageSquare,
  LayoutDashboard,
  Plus,
} from "lucide-react";

export default function MobileBottomNav() {
  const pathname = usePathname();

  const items = [
    { name: "Home", href: "/", icon: Home },
    { name: "Subs", href: "/subscriptions", icon: UserCheck },
    // Upload rendered separately, centered
    { name: "Tweets", href: "/tweets", icon: MessageSquare },
    { name: "Studio", href: "/dashboard", icon: LayoutDashboard },
  ];

  const isActive = (href) => pathname === href;

  return (
    <>
      {/* Floating bottom nav - mobile only */}
      <nav className="md:hidden fixed bottom-3 left-3 right-3 z-40">
        <div className="relative flex items-center justify-between bg-zinc-900/80 backdrop-blur-xl border border-zinc-800/80 rounded-[28px] shadow-2xl shadow-black/40 px-2 py-2">
          {/* Left pair */}
          <div className="flex items-center flex-1 justify-around">
            {items.slice(0, 2).map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className="relative flex flex-col items-center justify-center gap-0.5 w-14 h-12 rounded-2xl transition-all duration-300"
                >
                  {active && (
                    <span className="absolute inset-0 bg-indigo-600/15 rounded-2xl" />
                  )}
                  <Icon
                    size={20}
                    strokeWidth={active ? 2.4 : 1.8}
                    className={`relative transition-colors duration-300 ${
                      active ? "text-indigo-400" : "text-zinc-500"
                    }`}
                  />
                  <span
                    className={`relative text-[9.5px] font-medium transition-colors duration-300 ${
                      active ? "text-indigo-400" : "text-zinc-500"
                    }`}
                  >
                    {item.name}
                  </span>
                  {active && (
                    <span className="absolute -bottom-0.5 w-1 h-1 rounded-full bg-indigo-400" />
                  )}
                </Link>
              );
            })}
          </div>

          {/* Center Upload button */}
          <Link
            href="/dashboard?upload=true"
            aria-label="Upload"
            className="relative flex-shrink-0 flex items-center justify-center w-12 h-12 -mt-6 rounded-full bg-gradient-to-b from-indigo-500 to-indigo-600 shadow-lg shadow-indigo-600/40 border-[3px] border-zinc-950 active:scale-90 transition-transform duration-200"
          >
            <Plus size={22} strokeWidth={2.5} className="text-white" />
          </Link>

          {/* Right pair */}
          <div className="flex items-center flex-1 justify-around">
            {items.slice(2, 4).map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className="relative flex flex-col items-center justify-center gap-0.5 w-14 h-12 rounded-2xl transition-all duration-300"
                >
                  {active && (
                    <span className="absolute inset-0 bg-indigo-600/15 rounded-2xl" />
                  )}
                  <Icon
                    size={20}
                    strokeWidth={active ? 2.4 : 1.8}
                    className={`relative transition-colors duration-300 ${
                      active ? "text-indigo-400" : "text-zinc-500"
                    }`}
                  />
                  <span
                    className={`relative text-[9.5px] font-medium transition-colors duration-300 ${
                      active ? "text-indigo-400" : "text-zinc-500"
                    }`}
                  >
                    {item.name}
                  </span>
                  {active && (
                    <span className="absolute -bottom-0.5 w-1 h-1 rounded-full bg-indigo-400" />
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Spacer so page content isn't hidden behind the floating bar */}
      <div className="md:hidden h-24" />
    </>
  );
}
