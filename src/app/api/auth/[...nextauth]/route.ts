import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { loginUser } from "@/lib/actions/user.actions";
import { JWT } from "next-auth/jwt";
import { Session } from "next-auth";

// Make sure the secret is available
if (!process.env.NEXTAUTH_SECRET) {
  throw new Error("NEXTAUTH_SECRET is not defined");
}

// Define proper types for your user
interface User {
  id: string;
  email?: string | null;
  name?: string | null;
}

// Define session type
interface CustomSession extends Session {
  id?: string;
}

// Explicitly type authOptions as NextAuthOptions
export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (credentials?.email && credentials?.password) {
          const user = await loginUser(credentials.email, credentials.password);
          if (user) {
            return user as User;
          }
        }
        return null;
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60,
  },
  jwt: {
    secret: process.env.NEXTAUTH_SECRET,
  },
  callbacks: {
    async jwt({ token, user }: { token: JWT; user?: User }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }: { session: CustomSession; token: JWT & { id?: string } }) {
      if (token) {
        session.id = token.id;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === "development",
};

export const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };