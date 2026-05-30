import { getBreakpoint, getContentPadding, getSidebarWidth } from '../layout/getBreakpoint';

describe('getBreakpoint', () => {
  it('returns phone below tablet threshold', () => {
    expect(getBreakpoint(0)).toBe('phone');
    expect(getBreakpoint(767)).toBe('phone');
  });

  it('returns tablet between tablet and desktop thresholds', () => {
    expect(getBreakpoint(768)).toBe('tablet');
    expect(getBreakpoint(1023)).toBe('tablet');
  });

  it('returns desktop at desktop threshold and above', () => {
    expect(getBreakpoint(1024)).toBe('desktop');
    expect(getBreakpoint(1920)).toBe('desktop');
  });
});

describe('layout helpers', () => {
  it('maps sidebar width by breakpoint', () => {
    expect(getSidebarWidth('phone')).toBe(0);
    expect(getSidebarWidth('tablet')).toBe(72);
    expect(getSidebarWidth('desktop')).toBe(240);
  });

  it('maps content padding by breakpoint', () => {
    expect(getContentPadding('phone')).toBe(16);
    expect(getContentPadding('tablet')).toBe(24);
    expect(getContentPadding('desktop')).toBe(24);
  });
});
