"use client";

import { useState } from "react";
import { signInWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../../lib/firebase";
import { Lock, Mail, Loader2, AlertCircle, ChevronRight, Eye, EyeOff } from "lucide-react";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [resetSent, setResetSent] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage("");
    
    if (!auth) {
      setErrorMessage("Configuração do Firebase ausente no servidor. Verifique as chaves.");
      setIsLoading(false);
      return;
    }
    
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error: any) {
      console.error("Login Error:", error);
      switch (error.code) {
        case "auth/invalid-email":
          setErrorMessage("E-mail inválido.");
          break;
        case "auth/user-not-found":
        case "auth/wrong-password":
        case "auth/invalid-credential":
          setErrorMessage("E-mail ou senha incorretos.");
          break;
        case "auth/too-many-requests":
          setErrorMessage("Muitas tentativas. Tente novamente mais tarde.");
          break;
        default:
          setErrorMessage("Erro ao entrar. Tente novamente.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!email) {
      setErrorMessage("Informe seu e-mail para recuperar a senha.");
      return;
    }
    
    if (!auth) {
      setErrorMessage("Erro de configuração do Firebase.");
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    setErrorMessage("");
    try {
      await sendPasswordResetEmail(auth, email);
      setResetSent(true);
    } catch (error: any) {
      setErrorMessage("Erro ao enviar e-mail de recuperação.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-background p-4 relative overflow-hidden">
      <div className="absolute top-[-10%] right-[-5%] w-96 h-96 bg-emerald-400/20 rounded-full blur-3xl opacity-50 pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-5%] w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl opacity-50 pointer-events-none" />

      <div className="glass-panel p-8 rounded-2xl shadow-xl w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-2xl shadow-lg flex items-center justify-center font-bold text-white text-3xl mb-4">
            LK
          </div>
          <h1 className="text-2xl font-bold font-outfit text-slate-800 dark:text-white">Acesso ao CRM</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Gerencie seus leads com Firebase</p>
        </div>

        {resetSent ? (
          <div className="text-center p-6 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-100 dark:border-emerald-800">
            <CheckIcon className="mx-auto text-emerald-500 mb-3" size={32} />
            <h3 className="font-bold text-slate-800 dark:text-white mb-2">E-mail enviado!</h3>
            <p className="text-sm text-slate-600 dark:text-slate-300">Confira sua caixa de entrada para redefinir sua senha.</p>
            <button onClick={() => setResetSent(false)} className="mt-4 text-emerald-600 font-semibold text-sm">Voltar ao login</button>
          </div>
        ) : (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                E-mail
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail size={18} />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setErrorMessage("");
                  }}
                  className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all dark:text-white"
                  placeholder="seu@email.com"
                  required
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Senha
                </label>
                <button 
                  type="button" 
                  onClick={handleResetPassword}
                  className="text-xs text-emerald-600 hover:text-emerald-700 font-semibold"
                >
                  Esqueci minha senha
                </button>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock size={18} />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setErrorMessage("");
                  }}
                  className="w-full pl-10 pr-12 py-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all dark:text-white"
                  placeholder="••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-emerald-500 transition-colors"
                  aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {errorMessage && (
              <div className="p-3 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-xs rounded-lg flex items-center gap-2 animate-in fade-in slide-in-from-top-1">
                <AlertCircle size={16} />
                {errorMessage}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-800/50 text-white font-semibold py-3 px-4 rounded-lg transition-all shadow-md hover:shadow-lg active:scale-[0.98] flex items-center justify-center gap-2"
            >
              {isLoading ? <Loader2 className="animate-spin" size={20} /> : "Entrar no CRM"}
            </button>
            
            <div className="text-center mt-6">
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Ainda não tem conta?{" "}
                <Link href="/register" className="text-emerald-600 font-bold hover:underline">
                  Cadastre-se grátis
                </Link>
              </p>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

function CheckIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}
