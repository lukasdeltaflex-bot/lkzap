"use client";

import { useEffect, useState } from 'react';
import { RefreshCw, X } from 'lucide-react';

export function ServiceWorkerRegister() {
  const [showUpdate, setShowUpdate] = useState(false);
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').then((registration) => {
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // New update available
                setWaitingWorker(newWorker);
                setShowUpdate(true);
              }
            });
          }
        });

        // Check for waiting worker on mount
        if (registration.waiting) {
          setWaitingWorker(registration.waiting);
          setShowUpdate(true);
        }
      });

      let refreshing = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (!refreshing) {
          refreshing = true;
          window.location.reload();
        }
      });
    }
  }, []);

  const updateApp = () => {
    if (waitingWorker) {
      waitingWorker.postMessage({ type: 'SKIP_WAITING' });
    }
    setShowUpdate(false);
  };

  if (!showUpdate) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:w-80 z-[9999] animate-in slide-in-from-bottom duration-300">
      <div className="glass-panel p-4 rounded-2xl shadow-2xl border border-emerald-500/20 bg-emerald-50/90 dark:bg-emerald-950/90 backdrop-blur-md">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-emerald-500/20 rounded-full text-emerald-600 dark:text-emerald-400">
            <RefreshCw size={20} className="animate-spin-slow" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">Atualização Disponível</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
              Uma nova versão do LKZap está pronta para você.
            </p>
            <div className="flex gap-2 mt-3">
              <button
                onClick={updateApp}
                className="flex-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-colors"
              >
                Atualizar agora
              </button>
              <button
                onClick={() => setShowUpdate(false)}
                className="px-3 py-1.5 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 text-xs font-bold transition-colors"
              >
                Depois
              </button>
            </div>
          </div>
          <button onClick={() => setShowUpdate(false)} className="text-slate-400 hover:text-slate-600">
            <X size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
