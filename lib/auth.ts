import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import Yandex from "next-auth/providers/yandex"
import Credentials from "next-auth/providers/credentials"

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET!,
    }),
    Yandex({
      clientId: process.env.AUTH_YANDEX_ID!,
      clientSecret: process.env.AUTH_YANDEX_SECRET!,
    }),
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        // TODO: Add actual user authentication logic here
        // This is a placeholder - replace with your actual authentication
        // For now, just return a mock user for testing
        return {
          id: "1",
          email: credentials.email as string,
          name: "Test User",
        }
      },
    }),
  ],
  pages: {
    signIn: '/auth/login',
    error: '/auth/error',
  },
  callbacks: {
    // @ts-ignore
    async session({ session, token }: { session: any; token: any }) {
      if (token?.sub) {
        session.user.id = token.sub
      }
      return session
    },
    // @ts-ignore
    async jwt({ token, user }: { token: any; user: any }) {
      if (user) {
        token.sub = user.id
      }
      return token
    },
  },
})