import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";

// Middleware global de autenticação
// - Objetivo: impedir que usuários não autenticados acessem rotas privadas
// - Estratégia: toda requisição passa por aqui; permitimos explicitamente
//   rotas públicas (login, assets, API auth) e bloqueamos o restante
// - O middleware usa `getToken` do next-auth para validar o token JWT
// - Se não houver token, redirecionamos para `/login` preservando query string

export async function middleware(req: any) {
  const { nextUrl, url } = req;
  const { pathname, search } = nextUrl;

  // 1) Defina aqui os paths públicos (não requerem autenticação)
  //    - incluir rota de login, rota de API do next-auth e arquivos estáticos
  const PUBLIC_PATHS = [
    "/login",
    "/register",
    "/api/auth",
    "/favicon.ico",
    "/_next",
    "/_static",
    "/assets",
    "/robots.txt",
  ];

  // 2) Permitir acesso quando o pathname corresponder exatamente a um public path
  //    ou quando o pathname começar com um dos prefixos públicos (ex.: /_next/)
  const isPublic = PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/") || pathname.startsWith(p));
  if (isPublic) return NextResponse.next();

  // 3) Verifica token JWT emitido pelo NextAuth
  //    - getToken retorna `undefined` quando não autenticado
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  // 4) Se não houver token, redireciona para /login
  if (!token) {
    const loginUrl = new URL("/login", url);
    // preserva query string para possível retorno posterior
    loginUrl.search = search || "";
    return NextResponse.redirect(loginUrl);
  }

  // 5) Usuário autenticado — segue normalmente
  return NextResponse.next();
}

// Matcher global: aplicamos o middleware em todas as rotas exceto as que já
// definimos como públicas via `PUBLIC_PATHS`. Aqui usamos matcher para _tudo_.
export const config = {
  matcher: ["/((?!api/auth|_next|_static|favicon.ico).*)"],
};
