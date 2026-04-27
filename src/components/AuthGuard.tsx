"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "../context/AuthContext";
import { Loader2 } from "lucide-react";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();
  const { loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  const isPublicRoute = pathname === '/login' || pathname === '/register';

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !loading) {
      if (!isAuthenticated && !isPublicRoute) {
        router.push('/login');
      } else if (isAuthenticated && isPublicRoute) {
        router.push('/');
      }
    }
  }, [isAuthenticated, isPublicRoute, router, mounted, loading]);

  // Initial mount cycle: return blank shell to match SSR
  if (!mounted) {
    return <div className="min-h-screen bg-slate-50 dark:bg-background" />;
  }

  // Firebase is still checking the token
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-background flex items-center justify-center">
        <Loader2 className="animate-spin text-emerald-500" size={40} />
      </div>
    );
  }

  // Final check: if we are supposed to be redirected, don't show children yet
  if (!isAuthenticated && !isPublicRoute) {
    return null;
  }

  return <>{children}</>;
}
