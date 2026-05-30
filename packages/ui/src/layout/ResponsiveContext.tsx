import React, { createContext, useContext, useMemo } from 'react';
import { useWindowDimensions } from 'react-native';

import type { Breakpoint } from '../tokens/layout';
import { getBreakpoint, getContentPadding, getSidebarWidth } from './getBreakpoint';

export type ResponsiveContextValue = {
  width: number;
  height: number;
  breakpoint: Breakpoint;
  isPhone: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  contentPadding: number;
  sidebarWidth: number;
};

const ResponsiveContext = createContext<ResponsiveContextValue | null>(null);

export function ResponsiveProvider({ children }: { children: React.ReactNode }) {
  const { width, height } = useWindowDimensions();

  const value = useMemo<ResponsiveContextValue>(() => {
    const breakpoint = getBreakpoint(width);
    return {
      width,
      height,
      breakpoint,
      isPhone: breakpoint === 'phone',
      isTablet: breakpoint === 'tablet',
      isDesktop: breakpoint === 'desktop',
      contentPadding: getContentPadding(breakpoint),
      sidebarWidth: getSidebarWidth(breakpoint),
    };
  }, [width, height]);

  return <ResponsiveContext.Provider value={value}>{children}</ResponsiveContext.Provider>;
}

export function useBreakpoint(): ResponsiveContextValue {
  const ctx = useContext(ResponsiveContext);
  if (!ctx) {
    throw new Error('useBreakpoint must be used within ResponsiveProvider');
  }
  return ctx;
}
