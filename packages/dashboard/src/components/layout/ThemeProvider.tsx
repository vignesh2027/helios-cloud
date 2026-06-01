'use client';

import { useEffect, useState } from 'react';
import { useThemeStore } from '../../lib/theme-store';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useThemeStore(s => s.theme);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const root = document.documentElement;
    root.classList.remove('theme-dark', 'theme-warm');
    root.classList.add(`theme-${theme}`);
  }, [theme, mounted]);

  // Render children immediately; theme class applied after mount to avoid hydration mismatch
  return <>{children}</>;
}
