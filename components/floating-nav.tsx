'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Compass, Database, Globe, Layers, MapPin, Sparkles, Menu, X } from 'lucide-react';

export function FloatingNav() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const links = [
    { href: '/', label: 'Census', icon: Database },
    { href: '/map', label: 'The Map', icon: Globe },
    { href: '/brief', label: 'The Compass', icon: Compass },
    { href: '/board', label: 'The Board', icon: Layers },
    { href: '/sources', label: 'Sources', icon: MapPin },
  ];

  return (
    <>
      <header className="sticky top-2 sm:top-4 z-50 w-full px-3 sm:px-6 pointer-events-none">
        <div className="mx-auto max-w-5xl flex items-center justify-between gap-2">
          {/* Main Pill Nav */}
          <div className="pointer-events-auto flex items-center justify-between sm:justify-start gap-1 sm:gap-2 rounded-full border border-[#E2E8E4] bg-white/95 px-2.5 py-1.5 shadow-lg backdrop-blur-md w-full sm:w-auto">
            {/* Logo badge */}
            <Link
              href="/"
              onClick={() => setMobileMenuOpen(false)}
              className="flex h-9 w-9 sm:h-8 sm:w-8 items-center justify-center rounded-full bg-[#072A1B] text-[12px] sm:text-[11px] font-bold text-[#D0F07A] transition-transform hover:scale-105 shrink-0"
              title="Groundtruth - Reference Layer for India GCCs"
            >
              GT
            </Link>

            {/* Desktop Nav Items */}
            <nav className="hidden md:flex items-center gap-1 text-xs font-medium">
              {links.map((link) => {
                const Icon = link.icon;
                const isActive =
                  link.href === '/'
                    ? pathname === '/'
                    : pathname.startsWith(link.href);

                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 transition-all min-h-[36px] ${
                      isActive
                        ? 'bg-[#072A1B] text-[#D0F07A] font-semibold shadow-xs'
                        : 'text-[#2C3D34] hover:bg-[#F6F8F6] hover:text-[#072A1B]'
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    <span>{link.label}</span>
                  </Link>
                );
              })}
            </nav>

            {/* Mobile Header Active Tab indicator + Menu Button */}
            <div className="flex md:hidden items-center gap-2">
              <span className="text-xs font-semibold text-[#072A1B] px-2 truncate max-w-[140px]">
                {links.find((l) => (l.href === '/' ? pathname === '/' : pathname.startsWith(l.href)))?.label || 'Groundtruth'}
              </span>

              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-[#F6F8F6] text-[#072A1B] hover:bg-[#072A1B] hover:text-[#D0F07A] transition-colors"
                aria-label="Toggle navigation menu"
                aria-expanded={mobileMenuOpen}
              >
                {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Desktop CTA: Build my Entry Brief */}
          <div className="pointer-events-auto hidden sm:block shrink-0">
            <Link
              href="/brief"
              className="inline-flex items-center gap-2 rounded-full bg-[#D0F07A] px-4 py-2 text-xs font-semibold text-[#072A1B] shadow-md transition-all hover:bg-[#BDE658] hover:scale-105 active:scale-95 whitespace-nowrap min-h-[40px]"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>Build my Entry Brief</span>
            </Link>
          </div>
        </div>

        {/* Mobile Dropdown Drawer Menu */}
        {mobileMenuOpen && (
          <div className="pointer-events-auto md:hidden mt-2 mx-auto max-w-5xl rounded-[24px] border border-[#E2E8E4] bg-white/98 p-4 shadow-2xl backdrop-blur-xl animate-in fade-in slide-in-from-top-2 duration-200">
            <nav className="flex flex-col gap-1.5">
              {links.map((link) => {
                const Icon = link.icon;
                const isActive =
                  link.href === '/'
                    ? pathname === '/'
                    : pathname.startsWith(link.href);

                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center justify-between rounded-2xl px-4 py-3 text-sm transition-all min-h-[44px] ${
                      isActive
                        ? 'bg-[#072A1B] text-[#D0F07A] font-bold shadow-xs'
                        : 'text-[#2C3D34] hover:bg-[#F6F8F6] hover:text-[#072A1B]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="h-4 w-4" />
                      <span>{link.label}</span>
                    </div>
                    {isActive && (
                      <span className="h-2 w-2 rounded-full bg-[#D0F07A]"></span>
                    )}
                  </Link>
                );
              })}

              <div className="pt-2 mt-1 border-t border-[#E2E8E4]">
                <Link
                  href="/brief"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-center gap-2 rounded-full bg-[#D0F07A] px-4 py-3 text-sm font-bold text-[#072A1B] shadow-md transition-all hover:bg-[#BDE658] w-full min-h-[44px]"
                >
                  <Sparkles className="h-4 w-4" />
                  <span>Build my Entry Brief</span>
                </Link>
              </div>
            </nav>
          </div>
        )}
      </header>
    </>
  );
}
