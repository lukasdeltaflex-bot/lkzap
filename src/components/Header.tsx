"use client";

import { useSettingsStore } from "../store/useSettingsStore";
import { useAuthStore } from "../store/useAuthStore";
import { LogOut, Settings, Sun, Moon, Monitor } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "firebase/auth";
import { auth } from "../lib/firebase";

export function Header() {
  const { logoBase64 } = useSettingsStore();
  const { isAuthenticated, user } = useAuthStore();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();

  const handleLogout = async () => {
    if (!auth) return;
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Erro ao sair:", error);
    }
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  const isPublicRoute = pathname === '/login' || pathname === '/register';
  if (!isAuthenticated || isPublicRoute) return null;

  return (
    <header className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/">
            {logoBase64 ? (
              <img src={logoBase64} alt="Logo" className="max-h-10 w-auto object-contain" />
            ) : (
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-xl shadow-lg flex items-center justify-center font-bold text-white text-xl">
                LK
              </div>
            )}
          </Link>
          <div className="hidden sm:block">
            <h1 className="text-xl font-bold font-outfit bg-clip-text text-transparent bg-gradient-to-r from-slate-800 to-slate-600 dark:from-white dark:to-slate-300">
              LKZap CRM
            </h1>
            <p className="text-xs text-slate-500 font-medium">Gestão de Saque Complementar</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          {mounted && (
            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
              <button onClick={() => setTheme("light")} className={`p-1.5 rounded-md transition-colors ${theme === 'light' ? 'bg-white dark:bg-slate-700 shadow-sm' : 'text-slate-500'}`}>
                <Sun size={16} />
              </button>
              <button onClick={() => setTheme("dark")} className={`p-1.5 rounded-md transition-colors ${theme === 'dark' ? 'bg-white dark:bg-slate-700 shadow-sm' : 'text-slate-500'}`}>
                <Moon size={16} />
              </button>
              <button onClick={() => setTheme("system")} className={`p-1.5 rounded-md transition-colors ${theme === 'system' ? 'bg-white dark:bg-slate-700 shadow-sm' : 'text-slate-500'}`}>
                <Monitor size={16} />
              </button>
            </div>
          )}

          <Link href="/settings" className="p-2 text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
            <Settings size={20} />
          </Link>

          <div className="hidden lg:flex items-center gap-2 mr-2 px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-full border border-slate-200 dark:border-slate-700">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
              {user?.displayName || user?.email?.split('@')[0]}
            </span>
          </div>

          <button 
            onClick={handleLogout}
            className="flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-red-600 transition-colors dark:text-slate-300 dark:hover:text-red-400"
          >
            <LogOut size={18} />
            <span className="hidden sm:inline">Sair</span>
          </button>
        </div>
      </div>
    </header>
  );
}
