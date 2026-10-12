'use client';

import React, { useEffect } from 'react';

interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

export function Drawer({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
}: DrawerProps) {
  // Prevent background scrolling while drawer is active
  useEffect(() => {
    if (!isOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);

  // Handle ESC key to dismiss drawer
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] overflow-hidden"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      {/* Backdrop: blurs and dims the entire underlying page, including the map */}
      <div
        className="fixed inset-0 bg-black/75 backdrop-blur-md transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Slide-over Drawer Panel: aligned right, stays strictly above backdrop */}
      <div className="fixed inset-y-0 right-0 flex max-w-full justify-end pointer-events-none">
        <div className="pointer-events-auto relative w-screen max-w-xl bg-[#0C3A26] border-l border-[#14503A] text-white shadow-2xl flex flex-col h-full z-10 font-sans overflow-hidden animate-in slide-in-from-right duration-200">
          {/* Header */}
          <div className="shrink-0 border-b border-[#14503A] bg-[#072A1B] p-5 sm:p-6 flex items-start justify-between z-10">
            <div>
              <h2 className="font-serif text-xl sm:text-2xl font-bold text-white">
                {title}
              </h2>
              {subtitle && (
                <p className="mt-1 text-xs text-[#8FA89A]">{subtitle}</p>
              )}
            </div>

            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-[#14503A] p-2 text-[#8FA89A] hover:bg-[#14503A] hover:text-white transition-colors cursor-pointer min-h-[36px] min-w-[36px] flex items-center justify-center shrink-0 ml-3"
              aria-label="Close panel"
            >
              ✕
            </button>
          </div>

          {/* Content Body: dedicated scrollable container */}
          <div className="p-5 sm:p-6 space-y-6 flex-1 overflow-y-auto text-sm text-[#8FA89A]">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
