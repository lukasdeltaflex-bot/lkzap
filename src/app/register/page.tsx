"use client";

import { useState, useEffect, useMemo } from "react";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { auth } from "../../lib/firebase";
import { Lock, Mail, User, Phone, Loader2, AlertCircle, ArrowLeft, CheckCircle2, Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { normalizePhone } from "../../lib/utils";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Validation states
  const [emailError, setEmailError] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [isEmailTouched, setIsEmailTouched] = useState(false);
  const [isPhoneTouched, setIsPhoneTouched] = useState(false);

  // Phone Masking Logic
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/\D/g, ""); // Permite apenas números
    
    // Suporta celular com 9 dígitos (11 total com DDD)
    let formattedValue = "";
    if (rawValue.length > 0) {
      formattedValue = "(" + rawValue.slice(0, 2);
      if (rawValue.length > 2) {
        formattedValue += ") " + rawValue.slice(2, 7);
      }
      if (rawValue.length > 7) {
        formattedValue += "-" + rawValue.slice(7, 11);
      }
    }
    
    setPhone(formattedValue);
    if (!isPhoneTouched) setIsPhoneTouched(true);
  };

  // Email formatting and validation
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.toLowerCase().trim();
    setEmail(val);
    if (!isEmailTouched) setIsEmailTouched(true);
  };

  // Debounced Validation
  useEffect(() => {
    const timer = setTimeout(() => {
      if (isEmailTouched) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!email) {
          setEmailError("O e-mail é obrigatório");
        } else if (!emailRegex.test(email)) {
          setEmailError("Digite um e-mail válido");
        } else {
          setEmailError("");
        }
      }

      if (isPhoneTouched) {
        const digits = phone.replace(/\D/g, "");
        if (!phone) {
          setPhoneError("O WhatsApp é obrigatório");
        } else if (digits.length < 10) {
          setPhoneError("Telefone muito curto");
        } else {
          setPhoneError("");
        }
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [email, phone, isEmailTouched, isPhoneTouched]);

  const isFormValid = useMemo(() => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneDigits = phone.replace(/\D/g, "");
    return (
      name.length > 2 &&
      emailRegex.test(email) &&
      phoneDigits.length >= 10 &&
      password.length >= 6 &&
      !emailError &&
      !phoneError
    );
  }, [name, email, phone, password, emailError, phoneError]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;

    setIsLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    if (!auth) {
      setErrorMessage("Firebase não configurado.");
      setIsLoading(false);
      return;
    }

    try {
      // Remover máscara ao salvar (55 + DDD + Numero)
      const sanitizedPhone = normalizePhone(phone);
      
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // Armazenar o nome no perfil
      await updateProfile(userCredential.user, {
        displayName: name,
      });

      // Simulação de salvar o telefone (já que o Auth não tem campo nativo e o Firestore é opcional/futuro)
      console.log("Usuário criado com sucesso:", {
        uid: userCredential.user.uid,
        email: email,
        phone: sanitizedPhone // Formato: 5511970786054
      });

      setSuccessMessage("Conta criada com sucesso! Redirecionando...");
      
    } catch (error: any) {
      console.error("Firebase register error:", error);
      
      // Mapeamento de erros profissionais solicitados
      switch (error.code) {
        case "auth/email-already-in-use":
          setErrorMessage("Este e-mail já está cadastrado.");
          break;
        case "auth/invalid-email":
          setErrorMessage("Digite um e-mail válido.");
          break;
        case "auth/weak-password":
          setErrorMessage("A senha deve ter pelo menos 6 caracteres.");
          break;
        case "auth/operation-not-allowed":
          setErrorMessage("Login por e-mail/senha não está ativado no Firebase.");
          break;
        case "auth/network-request-failed":
          setErrorMessage("Falha de conexão. Verifique sua internet.");
          break;
        default:
          console.error("Firebase register unhandled error:", { code: error.code, message: error.message });
          setErrorMessage(`Erro (${error.code || "unknown"}): ${error.message || "Erro inesperado. Tente novamente."}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-background p-4 relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-5%] w-96 h-96 bg-emerald-400/20 rounded-full blur-3xl opacity-50 pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-5%] w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl opacity-50 pointer-events-none" />

      <div className="glass-panel p-8 rounded-2xl shadow-xl w-full max-w-md relative z-10">
        <div className="mb-6">
          <Link href="/login" className="text-slate-500 hover:text-emerald-600 flex items-center gap-1 text-sm font-medium transition-colors mb-4">
            <ArrowLeft size={16} /> Voltar para o Login
          </Link>
          <h1 className="text-2xl font-bold font-outfit text-slate-800 dark:text-white">Criar Nova Conta</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Comece a gerenciar seus leads em segundos</p>
        </div>

        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Nome Completo
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <User size={18} />
              </div>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all dark:text-white"
                placeholder="Ex: João Silva"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              WhatsApp / Celular
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Phone size={18} />
              </div>
              <input
                type="tel"
                value={phone}
                onChange={handlePhoneChange}
                className={`w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border rounded-lg focus:ring-2 outline-none transition-all dark:text-white ${
                  phoneError 
                    ? "border-red-500 focus:ring-red-500" 
                    : "border-slate-300 dark:border-slate-700 focus:ring-emerald-500 focus:border-emerald-500"
                }`}
                placeholder="(00) 00000-0000"
                required
              />
            </div>
            {phoneError && <p className="text-red-500 text-[10px] mt-1 ml-1">{phoneError}</p>}
          </div>

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
                onChange={handleEmailChange}
                className={`w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border rounded-lg focus:ring-2 outline-none transition-all dark:text-white ${
                  emailError 
                    ? "border-red-500 focus:ring-red-500" 
                    : "border-slate-300 dark:border-slate-700 focus:ring-emerald-500 focus:border-emerald-500"
                }`}
                placeholder="seu@email.com"
                required
              />
            </div>
            {emailError && <p className="text-red-500 text-[10px] mt-1 ml-1">{emailError}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Senha (Min. 6 caracteres)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Lock size={18} />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-12 py-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all dark:text-white"
                placeholder="••••••"
                required
                minLength={6}
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
            <div className="p-3 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-xs rounded-lg flex items-center gap-2">
              <AlertCircle size={16} />
              {errorMessage}
            </div>
          )}

          {successMessage && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 text-xs rounded-lg flex items-center gap-2">
              <CheckCircle2 size={16} />
              {successMessage}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading || !isFormValid}
            className={`w-full font-semibold py-3 px-4 rounded-lg transition-all shadow-md flex items-center justify-center gap-2 ${
              isLoading || !isFormValid
                ? "bg-slate-300 dark:bg-slate-700 text-slate-500 cursor-not-allowed shadow-none"
                : "bg-emerald-600 hover:bg-emerald-700 text-white hover:shadow-lg active:scale-[0.98]"
            }`}
          >
            {isLoading ? <Loader2 className="animate-spin" size={20} /> : "Finalizar Cadastro"}
          </button>
        </form>
      </div>
    </div>
  );
}
