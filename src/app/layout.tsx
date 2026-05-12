import type { Metadata } from "next";
import { Inter, Outfit, Poppins, Roboto, Montserrat } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "../components/ThemeProvider";
import { UIProvider } from "../components/UIProvider";
import { AuthGuard } from "../components/AuthGuard";
import { Header } from "../components/Header";
import { AuthProvider } from "../context/AuthContext";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit" });
const poppins = Poppins({ weight: ["400", "500", "600", "700"], subsets: ["latin"], variable: "--font-poppins" });
const roboto = Roboto({ weight: ["400", "500", "700"], subsets: ["latin"], variable: "--font-roboto" });
const montserrat = Montserrat({ subsets: ["latin"], variable: "--font-montserrat" });

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
    <html lang="pt-BR" suppressHydrationWarning className={`${inter.variable} ${outfit.variable} ${poppins.variable} ${roboto.variable} ${montserrat.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col transition-colors">
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={true}>
          <AuthProvider>
            <UIProvider>
              <AuthGuard>
                <Header />
                <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 lg:p-8">
                  {children}
                </main>
              </AuthGuard>
            </UIProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
