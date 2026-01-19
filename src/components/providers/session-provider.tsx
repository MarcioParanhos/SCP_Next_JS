"use client";

import * as React from "react";
import { SessionProvider } from "next-auth/react";
import type { Session } from "next-auth";

// Wrapper cliente para o next-auth `SessionProvider`.
// Recebe opcionalmente a `session` inicial (fornecida pelo servidor) para
// evitar flicker/placeholder enquanto o cliente recupera a sessão.
export function AuthProvider({
  children,
  session,
}: {
  children: React.ReactNode;
  session?: Session | null;
}) {
  return <SessionProvider session={session}>{children}</SessionProvider>;
}
