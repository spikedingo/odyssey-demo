import { breakpoints, type Breakpoint } from '../tokens/layout';

export function getBreakpoint(width: number): Breakpoint {
  if (width >= breakpoints.desktop) return 'desktop';
  if (width >= breakpoints.tablet) return 'tablet';
  return 'phone';
}

export function getSidebarWidth(breakpoint: Breakpoint): number {
  if (breakpoint === 'desktop') return 240;
  if (breakpoint === 'tablet') return 72;
  return 0;
}

export function getContentPadding(breakpoint: Breakpoint): number {
  return breakpoint === 'phone' ? 16 : 24;
}
