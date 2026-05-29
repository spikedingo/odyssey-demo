export const primary = {
  50: '#f0f7f0',
  100: '#d9edd9',
  200: '#b3dbb3',
  300: '#7ec47e',
  400: '#55aa55',
  500: '#3d8f3d',
  600: '#2e7230',
  700: '#245826',
  800: '#1a411c',
  900: '#112d13',
} as const;

export const neutral = {
  0: '#ffffff',
  50: '#faf9f7',
  100: '#f2f0ed',
  200: '#e6e2dc',
  300: '#d1cbc2',
  400: '#b0a89e',
  500: '#8a8178',
  600: '#655f57',
  700: '#4a4540',
  800: '#332f2b',
  900: '#1a1815',
  950: '#0d0c0a',
} as const;

export const semantic = {
  success: { light: '#22c55e', DEFAULT: '#16a34a', dark: '#15803d' },
  warning: { light: '#fbbf24', DEFAULT: '#d97706', dark: '#b45309' },
  error: { light: '#f87171', DEFAULT: '#dc2626', dark: '#b91c1c' },
  info: { light: '#60a5fa', DEFAULT: '#2563eb', dark: '#1d4ed8' },
} as const;

export const orderStatus = {
  pending: '#d97706',
  accepted: '#2563eb',
  preparing: '#7c3aed',
  ready: '#059669',
  out_for_delivery: '#0891b2',
  completed: '#16a34a',
  cancelled: '#6b7280',
} as const;
