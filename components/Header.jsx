'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Film, History as HistoryIcon } from 'lucide-react';

export default function Header() {
  const pathname = usePathname();

  const isHomeActive = pathname === '/';
  const isHistoryActive = pathname === '/history';

  return (
    <header className="bg-dark-800 border-b border-dark-600 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-accent flex items-center justify-center">
              <Film className="w-5 h-5 text-white" />
            </div>

            <span className="text-xl font-bold tracking-tight">
              AI Video Studio
            </span>
          </div>

          {/* Navigation */}
          <nav className="flex items-center gap-1 sm:gap-4">

            {/* Video Splitter */}
            <Link
              href="/"
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isHomeActive
                  ? 'bg-dark-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-dark-700'
              }`}
            >
              <Film className="w-4 h-4" />
              <span className="hidden sm:inline">
                Video Splitter
              </span>
            </Link>

            {/* History */}
            <Link
              href="/history"
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isHistoryActive
                  ? 'bg-dark-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-dark-700'
              }`}
            >
              <HistoryIcon className="w-4 h-4" />
              <span className="hidden sm:inline">
                History
              </span>
            </Link>

          </nav>
        </div>
      </div>
    </header>
  );
}