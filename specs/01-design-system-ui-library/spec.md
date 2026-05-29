# Spec 01 — Design System & UI Library

## What

Define and implement the visual design language and component library for the Odyssey restaurant dashboard. This covers the complete token system, Light/Dark theming, all primitive UI components, and a dedicated UI Library screen that serves as a living component catalog.

## Why

Visual consistency, reusability, and easy AI-assisted development all depend on a single source of truth for design decisions. By encoding the design system into tokens consumed by components (rather than scattered inline styles), we ensure every screen looks coherent without per-screen effort, and the design system itself becomes demonstrably reviewable.

---

## Design Language

**Personality**: Warm hospitality — approachable, inviting, operationally trustworthy. Think boutique restaurant management, not cold enterprise SaaS.

**Key characteristics**:
- Warmth through earthy green primary palette, rounded corners, generous padding.
- Professionalism through consistent typography scale, deliberate hierarchy, restrained color use.
- Operational clarity: status indicators are immediately legible; tables are information-dense but not cramped.

---

## Token System

All tokens live in `packages/ui/src/tokens/`. Tokens are TypeScript objects (not CSS variables) to work natively with React Native.

### Color Tokens

```ts
// Primary — Sage Green (warm, appetizing)
primary: {
  50:  '#f0f7f0',
  100: '#d9edd9',
  200: '#b3dbb3',
  300: '#7ec47e',
  400: '#55aa55',
  500: '#3d8f3d',  // brand default
  600: '#2e7230',
  700: '#245826',
  800: '#1a411c',
  900: '#112d13',
}

// Neutral — warm gray (not cold blue-gray)
neutral: {
  0:   '#ffffff',
  50:  '#faf9f7',
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
}

// Semantic
success: { light: '#22c55e', DEFAULT: '#16a34a', dark: '#15803d' }
warning: { light: '#fbbf24', DEFAULT: '#d97706', dark: '#b45309' }
error:   { light: '#f87171', DEFAULT: '#dc2626', dark: '#b91c1c' }
info:    { light: '#60a5fa', DEFAULT: '#2563eb', dark: '#1d4ed8' }

// Order status colors (used in badges)
orderStatus: {
  pending:           '#d97706',  // amber
  accepted:          '#2563eb',  // blue
  preparing:         '#7c3aed',  // violet
  ready:             '#059669',  // emerald
  out_for_delivery:  '#0891b2',  // cyan
  completed:         '#16a34a',  // green
  cancelled:         '#6b7280',  // gray
}
```

### Typography Tokens

Font family: **Inter** (via `@expo-google-fonts/inter` or `expo-font`).

```ts
fontFamily: {
  sans: 'Inter_400Regular',
  sansMedium: 'Inter_500Medium',
  sansSemiBold: 'Inter_600SemiBold',
  sansBold: 'Inter_700Bold',
}

fontSize: {
  xs:   10,
  sm:   12,
  base: 14,
  md:   16,
  lg:   18,
  xl:   20,
  '2xl': 24,
  '3xl': 30,
  '4xl': 36,
}

lineHeight: {
  tight:   1.25,
  normal:  1.5,
  relaxed: 1.75,
}

fontWeight: { regular: '400', medium: '500', semibold: '600', bold: '700' }
```

### Spacing Scale

Base unit: **4px**. All spacing is multiples of 4.

```ts
spacing: {
  0:  0,    // 0px
  1:  4,    // 4px
  2:  8,    // 8px
  3:  12,   // 12px
  4:  16,   // 16px
  5:  20,   // 20px
  6:  24,   // 24px
  8:  32,   // 32px
  10: 40,   // 40px
  12: 48,   // 48px
  16: 64,   // 64px
  20: 80,   // 80px
}
```

### Radius, Border, Shadow, Elevation

```ts
radius: {
  none: 0,
  sm:   4,
  md:   8,
  lg:   12,
  xl:   16,
  '2xl': 24,
  full: 9999,
}

border: {
  width: { none: 0, thin: 1, medium: 2 },
  // Colors are resolved from neutral tokens in theme
}

shadow: {
  none: { ... },
  sm:   { elevation: 1, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 2 },
  md:   { elevation: 3, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.12, shadowRadius: 6 },
  lg:   { elevation: 8, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.16, shadowRadius: 16 },
}
```

### Layout / Grid

```ts
layout: {
  maxContentWidth: 1280,
  sidebarWidth:    240,
  contentPadding:  24,    // spacing[6]
  cardGap:         16,    // spacing[4]
  sectionGap:      32,    // spacing[8]
}
```

---

## Theme System

Two themes: `light` and `dark`. Each theme maps semantic color roles to token values.

```ts
type Theme = {
  colors: {
    background:       string;  // page/screen background
    surface:          string;  // card/panel background
    surfaceElevated:  string;  // modal/drawer background
    border:           string;  // default border
    borderStrong:     string;  // emphasis border
    text:             string;  // primary text
    textSecondary:    string;  // secondary/muted text
    textDisabled:     string;
    textInverse:      string;  // text on colored backgrounds
    primary:          string;  // brand action color
    primaryHover:     string;
    primaryPressed:   string;
    primarySubtle:    string;  // tinted bg for primary elements
    danger:           string;
    dangerSubtle:     string;
    warning:          string;
    warningSubtle:    string;
    success:          string;
    successSubtle:    string;
  };
  // shadows adjust opacity per theme
  shadows: typeof shadow;
};
```

**Theme provider**: `packages/ui/src/theme/ThemeContext.tsx` — React context with `useTheme()` hook. Reads system preference by default; includes manual toggle.

---

## Semantic States

| State | Visual treatment |
|---|---|
| Loading | Skeleton shimmer (animated gradient sweep) |
| Empty | Centered icon + heading + subtext + optional CTA button |
| Error | Inline error banner (red surface, error icon, message, retry action) |
| Success | Toast notification (green, bottom-right, auto-dismiss 4s) |
| Warning | `<WarningBanner>` — inline amber banner with warning icon, message, optional action |
| Disabled | 40% opacity, no pointer events, `cursor: not-allowed` on web |
| Hover | `primarySubtle` background tint or slight border darkening |
| Focus | 2px `primary` ring offset by 2px |
| Active/Pressed | Scale transform 0.97 + slight brightness reduction |

---

## Density System

Three density levels: `comfortable` | `balanced` (default) | `compact`.

Density affects:
- Row height in tables/lists.
- Cell padding in tables.
- Vertical spacing in forms.
- Card padding.

Density is stored in a context alongside the theme and toggleable from the Settings page or a persistent control in the header.

```ts
type Density = 'comfortable' | 'balanced' | 'compact';
const densityScale = {
  comfortable: 1.25,
  balanced:    1.0,
  compact:     0.75,
};
```

---

## UI Primitive Components

All in `packages/ui/src/components/`. Each exports a typed React component.

### Button
```ts
type ButtonProps = {
  variant: 'primary' | 'secondary' | 'ghost' | 'danger';
  size: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  leftIcon?: LucideIcon;
  rightIcon?: LucideIcon;
  onPress: () => void;
  children: string;
};
```
States: default / hover / pressed / disabled / loading (spinner replaces content).

### Input
```ts
type InputProps = {
  label?: string;
  placeholder?: string;
  value: string;
  onChangeText: (v: string) => void;
  error?: string;
  hint?: string;
  disabled?: boolean;
  leftIcon?: LucideIcon;
  rightElement?: React.ReactNode;
};
```
States: default / focused (primary ring) / error (red border + message) / disabled.

### TextArea
```ts
type TextAreaProps = {
  label?: string;
  placeholder?: string;
  value: string;
  onChangeText: (v: string) => void;
  error?: string;
  hint?: string;
  disabled?: boolean;
  rows?: number;  // default 4
  maxLength?: number;
};
```
Multi-line text input. Same visual states as `Input` (focused ring, error, disabled). Used in Menu item description and order notes.

### Switch / Toggle
```ts
type SwitchProps = {
  label?: string;
  value: boolean;
  onValueChange: (v: boolean) => void;
  disabled?: boolean;
  hint?: string;
};
```
Boolean toggle control. Used in Settings (auto-accept, service/delivery availability, opening-hours closed toggle) and Menu (item availability).

### Select / Dropdown
```ts
type SelectProps<T extends string> = {
  label?: string;
  options: { label: string; value: T }[];
  value: T | null;
  onChange: (v: T) => void;
  placeholder?: string;
  error?: string;
  disabled?: boolean;
};
```

### Modal / Dialog
```ts
type ModalProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  footer?: React.ReactNode;
};
```
Renders centered overlay. On web: max-width capped by `size`. On native: bottom sheet.

### Drawer
```ts
type DrawerProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  width?: number;  // default 480
};
```
Slides in from the right on web. Full-screen modal on narrow/native.

### Card / Surface
```ts
type CardProps = {
  elevation?: 'none' | 'sm' | 'md';
  padding?: keyof typeof spacing;
  children: React.ReactNode;
  onPress?: () => void;  // makes card pressable
};
```

### Table / List
- `<DataTable>` — columnar data with sortable headers, density-aware row padding.
- `<ListItem>` — single list row (icon, primary text, secondary text, right element).
- Both support `loading` (renders skeleton rows) and `empty` (renders `EmptyState`).

### Badge / Status Indicator
```ts
type BadgeProps = {
  label: string;
  variant: 'default' | 'success' | 'warning' | 'error' | 'info' | 'order-status';
  orderStatus?: OrderStatus;  // used when variant = 'order-status'
  size?: 'sm' | 'md';
};
```

### Navigation Elements
- `<Sidebar>` — vertical nav with icon + label items, active state, collapsible.
- `<NavItem>` — single nav row.
- `<Breadcrumb>` — page breadcrumb trail.
- `<TabBar>` — horizontal tabs for sub-page navigation.

### Skeleton / Loading States
- `<SkeletonBox>` — animated shimmer box (width/height configurable).
- `<SkeletonText>` — animated shimmer text line.
- `<SkeletonCard>` — card-shaped skeleton block.
- `<TableSkeleton>` — full table skeleton with configurable row count.

### Feedback / Toast
- `<Toast>` — individual toast (variant: success/error/warning/info, auto-dismiss 4s, close button).
- `<ToastContainer>` — portal anchored to bottom-right corner.
- `useToast()` hook — `toast.success(message)`, `toast.error(message)`, etc.
- `<WarningBanner>` — inline amber banner for non-blocking warnings (message, optional action button, dismissible).

### Additional Primitives
- `<Avatar>` — initials or image, sizes sm/md/lg.
- `<Divider>` — horizontal rule.
- `<EmptyState>` — icon + heading + subtext + optional action button.
- `<ErrorState>` — error icon + message + retry button.
- `<KPICard>` — metric label + large value + optional trend indicator (used on Home).
- `<PageHeader>` — page title + breadcrumb + optional action button(s).
- `<SearchInput>` — Input variant pre-wired with search icon and clear button.
- `<Tooltip>` — hover tooltip (web only).

---

## UI Library Screen / Route

Route: `/ui-library` in the Expo Router app.

The UI Library screen is a scrollable showcase of every token and component. Sections:

1. **Color Tokens** — swatches for all palette + semantic colors, with hex values.
2. **Typography** — every font size/weight combination rendered as text samples.
3. **Spacing Scale** — visual ruler showing each spacing value as a colored box.
4. **Surfaces & Shadows** — cards at each elevation level.
5. **Border Radius** — boxes at each radius value.
6. **Components** — each primitive in all its variants/states:
   - Buttons: all variants × all sizes × loading × disabled.
   - Inputs: default, focused (simulated), error, disabled.
   - TextArea: default, error, disabled.
   - Switch: on/off, disabled.
   - Selects, Modals, Drawers (toggleable via "Open" button).
   - Badges: all variants including each order status.
   - Skeleton states.
   - Toast (triggered by button) + WarningBanner (static example).
   - KPI cards, EmptyState, ErrorState.
7. **Theme Toggle** — Live Light/Dark switch affecting the entire screen.
8. **Density Toggle** — Live density switcher.

---

## Acceptance Criteria

- [ ] `packages/ui` builds with zero TypeScript errors.
- [ ] All token files export typed objects (no `any`).
- [ ] `useTheme()` hook returns the correct theme in both Light and Dark modes.
- [ ] All primitives render in Expo Web without crashing.
- [ ] `/ui-library` route is accessible and shows all sections.
- [ ] Theme toggle on `/ui-library` switches colors across all rendered components.
- [ ] Density toggle changes spacing visibly in tables and forms.
- [ ] All buttons show hover, focus, active, and disabled states (web).
- [ ] All inputs show focused (primary ring), error, and disabled states.
- [ ] TextArea and Switch render correctly in all states.
- [ ] WarningBanner renders with message and optional action.
- [ ] Toast system: `useToast().success()` renders a toast that auto-dismisses.
- [ ] Skeleton shimmer animation plays without flickering.
- [ ] `EmptyState` and `ErrorState` render correctly with optional action.
- [ ] Order status badges display correct colors for all 7 status values.
