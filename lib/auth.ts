import NextAuth, { DefaultSession } from "next-auth"
import Google from "next-auth/providers/google"
import Yandex from "next-auth/providers/yandex"
import Credentials from "next-auth/providers/credentials"
import type { NextAuthConfig } from "next-auth"
import { upsertUserProfile } from './database'

// Extend the built-in session types
declare module "next-auth" {
  interface Session {
    user: {
      id: string
      provider?: string
    } & DefaultSession["user"]
  }
  
  interface User {
    provider?: string
  }
}

export const authOptions: NextAuthConfig = {
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET!,
      profile(profile) {
        return {
          id: profile.sub,
          name: profile.name,
          email: profile.email,
          image: profile.picture,
          provider: "google"
        }
      }
    }),
    Yandex({
      clientId: process.env.AUTH_YANDEX_ID!,
      clientSecret: process.env.AUTH_YANDEX_SECRET!,
      profile(profile) {
        return {
          id: profile.id,
          name: profile.display_name || profile.real_name,
          email: profile.default_email,
          image: profile.default_avatar_id ? `https://avatars.yandex.net/get-yapic/${profile.default_avatar_id}/islands-200` : undefined,
          provider: "yandex"
        }
      }
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
          provider: "credentials"
        }
      },
    }),
  ],
  pages: {
    signIn: '/auth/login',
    error: '/auth/error',
  },
  trustHost: true, // Required for custom domains/IPs in development
  callbacks: {
    async signIn({ user, account, profile }) {
      // Auto-create user profile on first login
      try {
        if (user && account) {
          const userWithProvider = {
            ...user,
            provider: account.provider
          }
          await upsertUserProfile(userWithProvider)
        }
        return true
      } catch (error) {
        console.error('Error creating user profile:', error)
        // Don't block login if profile creation fails
        return true
      }
    },
    async session({ session, token }) {
      if (token?.sub) {
        session.user.id = token.sub
      }
      if (token?.provider) {
        session.user.provider = token.provider as string
      }
      return session
    },
    async jwt({ token, user, account }) {
      if (user) {
        token.sub = user.id
        token.provider = user.provider || account?.provider
      }
      return token
    },
  },
}

export const { handlers, auth, signIn, signOut } = NextAuth(authOptions)