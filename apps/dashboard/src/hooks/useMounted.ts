import { useEffect, useState } from 'react';

/** True after the first client paint — avoids Expo Web SSR/query hydration mismatches. */
export function useMounted(): boolean {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted;
}
