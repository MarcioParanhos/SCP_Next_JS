import { cookies } from "next/headers";
import type { Metadata } from "next";

import "./globals.css";

import { cn } from "@/lib/utils";

import { ThemeProvider } from "@/components/providers/theme-provider";
import { AuthProvider } from "@/components/providers/session-provider";
import { ActiveThemeProvider } from "@/components/layout/active-theme";
import { Toaster } from "@/components/ui/sonner";
import { getServerSession } from "next-auth";
import type { Session } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export const metadata: Metadata = {
  title: "SCP - Sistema de Carência e Provimento",
  description:
    "Sistema de Carência e Provimento - Gestão Educacional inteligente",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const activeThemeValue = cookieStore.get("active_theme")?.value;
  const isScaled = activeThemeValue?.endsWith("-scaled");

  // Recupera a sessão no servidor para evitar flicker no cliente.
  const session = (await getServerSession(authOptions as any)) as Session | null;

  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={cn(
          "bg-background overscroll-none font-sans antialiased",
          activeThemeValue ? `theme-${activeThemeValue}` : "",
          isScaled ? "theme-scaled" : ""
        )}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
          enableColorScheme
        >
            <ActiveThemeProvider initialTheme={activeThemeValue}>
              <AuthProvider session={session}>{children}</AuthProvider>
              <Toaster />
            </ActiveThemeProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
