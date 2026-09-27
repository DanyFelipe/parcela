'use client';

import type { ReactNode } from 'react';

interface HotspotsLayerProps {
  children: ReactNode;
  fadingOut: boolean;
  testId?: string;
}

export function HotspotsLayer({ children, fadingOut, testId }: HotspotsLayerProps) {
  return (
    <div
      className={`absolute inset-0 transition-opacity duration-200 ${
        fadingOut ? 'opacity-0' : 'opacity-100'
      }`}
      aria-hidden={fadingOut}
      data-testid={testId}
    >
      {children}
    </div>
  );
}
