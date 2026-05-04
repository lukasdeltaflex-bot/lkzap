import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "../components/ThemeProvider";
import { AuthGuard } from "../components/AuthGuard";
import { Header } from "../components/Header";
import { AuthProvider } from "../context/AuthContext";
import { ServiceWorkerRegister } from "../components/ServiceWorkerRegister";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit" });

export const metadata: Metadata = {
  title: "LKZap CRM",
  description: "CRM de Saque Complementar",
  manifest: "/manifest.json",
  icons: {
    apple: "/apple-touch-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning className={`${inter.variable} ${outfit.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans transition-colors">
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={true}>
          <AuthProvider>
            <AuthGuard>
              <Header />
              <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 lg:p-8">
                {children}
              </main>
              {/* <ServiceWorkerRegister /> */}
            </AuthGuard>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
