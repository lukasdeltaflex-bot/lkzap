import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit" });

export const metadata: Metadata = {
  title: "LKZap - CRM de Saque Complementar",
  description: "Mini CRM focado em produtividade para captação",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={`${inter.variable} ${outfit.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans">
        <header className="glass-panel sticky top-0 z-50 border-b-0 border-opacity-10 backdrop-blur-md px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center text-white font-bold text-xl shadow-lg">
              L
            </div>
            <h1 className="text-xl font-bold font-outfit tracking-tight text-slate-800 dark:text-white">
              LKZap
            </h1>
          </div>
          <div className="text-sm font-medium text-slate-500">
            CRM Saque Complementar
          </div>
        </header>
        <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </body>
    </html>
  );
}
