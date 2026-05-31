'use client';

import { useEffect } from 'react';
import { useThemeStore } from '../../lib/theme-store';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useThemeStore(s => s.theme);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('theme-dark', 'theme-warm');
    root.classList.add(`theme-${theme}`);
  }, [theme]);

  return <>{children}</>;
}
