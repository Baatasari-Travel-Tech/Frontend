"use client";

import React, { useState } from "react";
import Sidebar from "../dashboard/Sidebar";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col overflow-x-hidden">
      <div className="flex flex-1 relative">
        <Sidebar
          isOpen={isSidebarOpen}
          setIsOpen={setIsSidebarOpen}
          positionMode="fixed"
        />

        <div className="flex-1 flex flex-col transition-all duration-300 min-w-0 md:ml-24 relative">
          <div
            className={`fixed inset-0 md:left-24 bg-black/40 z-20 transition-opacity duration-300 ${isSidebarOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
              }`}
            onClick={() => setIsSidebarOpen(false)}
            aria-hidden="true"
          />

          <main className="flex-1 mt-0 min-h-[calc(100vh-64px)] flex flex-col">
            <div className="flex-1 p-4 md:p-8 pb-24 md:pb-10">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default DashboardLayout;
