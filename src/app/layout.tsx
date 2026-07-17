import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/components/auth-provider";
import { getServerUser } from "@/lib/get-server-user";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CrmNailsAgency - CRM para Nail Art",
  description: "Gestiona tu negocio de nail art con estilo. CRM especializado con tablero visual, calendario inteligente, automatizaciones y fidelización de clientes.",
  keywords: ["CRM", "nail art", "uñas", "salón", "gestión", "citas", "clientes", "automatización"],
  authors: [{ name: "CrmNailsAgency" }],
  icons: {
    icon: "/glamcrm-logo.png",
  },
  openGraph: {
    title: "CrmNailsAgency - CRM para Nail Art",
    description: "Gestiona tu negocio de nail art con estilo",
    type: "website",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const serverUser = await getServerUser();

  return (
    <html lang="es" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <AuthProvider user={serverUser}>
          {children}
        </AuthProvider>
        <Toaster />
        <SonnerToaster position="top-right" />
      </body>
    </html>
  );
}
