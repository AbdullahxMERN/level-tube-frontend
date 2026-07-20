"use client";

import React, { useState, Suspense } from "react";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import MobileBottomNav from "@/components/MobileBottomNav";
import MobileSidebarDrawer from "@/components/MobileSidebarDrawer";

export default function MainLayout({ children }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  // On desktop this collapses/expands the fixed Sidebar.
  // On mobile the Sidebar is hidden entirely, so the same button instead
  // opens the slide-in MobileSidebarDrawer.
  const toggleSidebar = () => {
    setSidebarCollapsed((prev) => !prev);
    setMobileDrawerOpen((prev) => !prev);
  };

  return (
    <div className="flex flex-col min-h-screen bg-zinc-950 text-zinc-100">
      {/* Navbar at top with Suspense wrapper to handle useSearchParams */}
      <Suspense
        fallback={
          <div className="h-16 w-full border-b border-zinc-800 bg-zinc-950/70" />
        }
      >
        <Navbar onToggleSidebar={toggleSidebar} />
      </Suspense>

      {/* Mobile slide-in menu drawer, triggered by the Navbar hamburger button */}
      <MobileSidebarDrawer
        open={mobileDrawerOpen}
        onClose={() => setMobileDrawerOpen(false)}
      />

      {/* Sidebar + Main Content */}
      <div className="flex flex-1 overflow-hidden">
        <Sidebar collapsed={sidebarCollapsed} />

        <main className="flex-1 overflow-y-auto px-4 py-6 md:px-8 max-w-7xl mx-auto w-full">
          {/* Suspense wrapper for child pages that read query parameters */}
          <Suspense
            fallback={
              <div className="flex items-center justify-center min-h-[50vh]">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-sm text-zinc-500">
                    Loading page content...
                  </span>
                </div>
              </div>
            }
          >
            {children}
          </Suspense>

          {/* Bottom navigation - mobile only, hidden on md+ screens (desktop uses Sidebar) */}
          <MobileBottomNav />
        </main>
      </div>
    </div>
  );
}
