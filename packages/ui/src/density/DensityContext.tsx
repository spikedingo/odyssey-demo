import type { DensityLevel } from '@odyssey/types';
import React, { createContext, useContext, useMemo, useState } from 'react';


import { spacing, type SpacingKey } from '../tokens/spacing';

const densityScale: Record<DensityLevel, number> = {
  comfortable: 1.25,
  balanced: 1,
  compact: 0.75,
};

type DensityContextValue = {
  density: DensityLevel;
  setDensity: (density: DensityLevel) => void;
  scale: (value: number) => number;
  spacing: (key: SpacingKey) => number;
};

const DensityContext = createContext<DensityContextValue | null>(null);

export function DensityProvider({
  children,
  initialDensity = 'balanced',
}: {
  children: React.ReactNode;
  initialDensity?: DensityLevel;
}) {
  const [density, setDensity] = useState<DensityLevel>(initialDensity);

  const value = useMemo<DensityContextValue>(() => {
    const scaleFactor = densityScale[density];
    return {
      density,
      setDensity,
      scale: (value: number) => Math.round(value * scaleFactor),
      spacing: (key: SpacingKey) => Math.round(spacing[key] * scaleFactor),
    };
  }, [density]);

  return <DensityContext.Provider value={value}>{children}</DensityContext.Provider>;
}

export function useDensity() {
  const ctx = useContext(DensityContext);
  if (!ctx) throw new Error('useDensity must be used within DensityProvider');
  return ctx;
}
