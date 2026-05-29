import { neutral, primary, semantic } from '../tokens/colors';
import { shadow } from '../tokens/layout';

export type ThemeMode = 'light' | 'dark';

export type Theme = {
  mode: ThemeMode;
  colors: {
    background: string;
    surface: string;
    surfaceElevated: string;
    border: string;
    borderStrong: string;
    text: string;
    textSecondary: string;
    textDisabled: string;
    textInverse: string;
    primary: string;
    primaryHover: string;
    primaryPressed: string;
    primarySubtle: string;
    danger: string;
    dangerSubtle: string;
    warning: string;
    warningSubtle: string;
    success: string;
    successSubtle: string;
    info: string;
  };
  shadows: Record<'none' | 'sm' | 'md' | 'lg', object>;
};

export const lightTheme: Theme = {
  mode: 'light',
  colors: {
    background: neutral[50],
    surface: neutral[0],
    surfaceElevated: neutral[0],
    border: neutral[200],
    borderStrong: neutral[300],
    text: neutral[900],
    textSecondary: neutral[600],
    textDisabled: neutral[400],
    textInverse: neutral[0],
    primary: primary[500],
    primaryHover: primary[600],
    primaryPressed: primary[700],
    primarySubtle: primary[50],
    danger: semantic.error.DEFAULT,
    dangerSubtle: '#fef2f2',
    warning: semantic.warning.DEFAULT,
    warningSubtle: '#fffbeb',
    success: semantic.success.DEFAULT,
    successSubtle: '#f0fdf4',
    info: semantic.info.DEFAULT,
  },
  shadows: shadow,
};

export const darkTheme: Theme = {
  mode: 'dark',
  colors: {
    background: neutral[950],
    surface: neutral[900],
    surfaceElevated: neutral[800],
    border: neutral[700],
    borderStrong: neutral[600],
    text: neutral[50],
    textSecondary: neutral[400],
    textDisabled: neutral[600],
    textInverse: neutral[900],
    primary: primary[400],
    primaryHover: primary[300],
    primaryPressed: primary[500],
    primarySubtle: primary[900],
    danger: semantic.error.light,
    dangerSubtle: '#450a0a',
    warning: semantic.warning.light,
    warningSubtle: '#451a03',
    success: semantic.success.light,
    successSubtle: '#052e16',
    info: semantic.info.light,
  },
  shadows: {
    none: {},
    sm: { elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.3, shadowRadius: 2 },
    md: { elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.35, shadowRadius: 6 },
    lg: { elevation: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 16 },
  },
};
