// Rota NextAuth para o App Router
// - Usa CredentialsProvider + PrismaAdapter
// - O `authOptions` exportado é usado tanto pela rota quanto por verificações do lado servidor
import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import bcrypt from "bcrypt";
import { prisma } from "@/lib/prisma";
import type { NextAuthOptions } from "next-auth";

// Exporta `authOptions` para que componentes/páginas server possam importar para checagem de sessão
export const authOptions: NextAuthOptions = {
  // Adapter: conecta o NextAuth ao Prisma (sessões/contas armazenadas no banco)
  adapter: PrismaAdapter(prisma as any),
  // Usa estratégia JWT para sessões (tokens sem estado)
  session: { strategy: "jwt" },
  providers: [
    // Provider de credenciais: valida email + senha contra o banco
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        // Validação básica: garante que os campos estejam presentes
        if (!credentials?.email || !credentials?.password) return null;

        // Procura o usuário pelo email
        const user = await prisma.user.findUnique({ where: { email: credentials.email } });
        if (!user || !user.password) return null;

        // Compara a senha fornecida com o hash bcrypt armazenado
        const isValid = await bcrypt.compare(credentials.password, user.password);
        if (!isValid) return null;

        // Retorna o objeto mínimo de usuário exigido pelo NextAuth
        return { id: user.id, name: user.name ?? undefined, email: user.email };
      },
    }),
  ],
  // Secret usado para assinar tokens; deve estar definido em .env
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    // Propaga informações do token para a sessão e garante que nome/email
    // estejam disponíveis em `session.user` para componentes cliente.
    async jwt({ token, user }) {
      // Quando o usuário faz login, `user` estará disponível e podemos
      // copiar `name`/`email` para o token para que persistam no JWT.
      if (user) {
        (token as any).name = (user as any).name ?? (token as any).name;
        (token as any).email = (user as any).email ?? (token as any).email;
      }
      return token;
    },

    async session({ session, token }) {
      if (token?.sub) (session.user as any).id = token.sub;
      if ((token as any).name) (session.user as any).name = (token as any).name;
      if ((token as any).email) (session.user as any).email = (token as any).email;
      return session;
    },
  },
};

// Cria o handler do NextAuth e exporta para GET e POST
const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };