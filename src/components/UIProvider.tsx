"use client";

import { useSettingsStore } from "../store/useSettingsStore";
import { useEffect, useState } from "react";

export function UIProvider({ children }: { children: React.ReactNode }) {
  const { density, fontFamily, fontSize } = useSettingsStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return <>{children}</>;

  const densityClass = density === 'compact' ? 'density-compact' : '';
  const fontClass = `font-${fontFamily.toLowerCase()}`;
  const sizeClass = `font-size-${fontSize}`;

  return (
    <div className={`${densityClass} ${fontClass} ${sizeClass} min-h-screen flex flex-col transition-all duration-300`}>
      {children}
    </div>
  );
}
