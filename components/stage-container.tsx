import React from 'react';

interface StageContainerProps {
  children: React.ReactNode;
  className?: string;
  noPadding?: boolean;
}

export function StageContainer({
  children,
  className = '',
  noPadding = false,
}: StageContainerProps) {
  return (
    <div className="w-full min-w-0 px-3 sm:px-6 py-2 sm:py-4">
      <div
        className={`relative mx-auto max-w-[1400px] min-w-0 rounded-[24px] sm:rounded-[32px] border border-[#14503A] bg-[#072A1B] text-white shadow-2xl overflow-hidden isolate stage-grid-pattern ${
          noPadding ? '' : 'p-4 sm:p-8 lg:p-10'
        } ${className}`}
      >
        {children}
      </div>
    </div>
  );
}
