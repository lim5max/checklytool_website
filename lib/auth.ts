import NextAuth, { DefaultSession } from "next-auth"
import Yandex from "next-auth/providers/yandex"
import Credentials from "next-auth/providers/credentials"
import type { NextAuthConfig } from "next-auth"
import bcrypt from 'bcryptjs'
import { upsertUserProfile } from './database'
import { createClient } from './supabase/server'

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

        try {
          const supabase = await createClient()

          console.log('[AUTH] Attempting login for:', credentials.email)

          // Получаем пользователя из базы данных
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { data: user, error } = await (supabase as any)
            .from('user_profiles')
            .select('user_id, email, name, password_hash, avatar_url')
            .eq('email', credentials.email as string)
            .single()

          if (error) {
            console.error('[AUTH] Database error:', error)
            return null
          }

          if (!user) {
            console.log('[AUTH] User not found:', credentials.email)
            return null
          }

          console.log('[AUTH] User found:', {
            email: user.email,
            hasPasswordHash: !!user.password_hash,
            passwordHashType: typeof user.password_hash,
            passwordHashLength: user.password_hash?.length
          })

          // Проверяем наличие пароля
          if (!user.password_hash || typeof user.password_hash !== 'string') {
            console.log('[AUTH] No password hash for user:', credentials.email, 'Type:', typeof user.password_hash)
            return null
          }

          // Проверяем пароль
          console.log('[AUTH] Comparing passwords for:', credentials.email)
          const isPasswordValid = await bcrypt.compare(
            credentials.password as string,
            user.password_hash
          )

          console.log('[AUTH] Password comparison result:', isPasswordValid)

          if (!isPasswordValid) {
            console.log('[AUTH] Invalid password for:', credentials.email)
            return null
          }

          console.log('[AUTH] Login successful:', credentials.email)

          // Возвращаем данные пользователя
          return {
            id: user.user_id,
            email: user.email,
            name: user.name || '',
            image: user.avatar_url,
            provider: "credentials"
          }
        } catch (error) {
          console.error('[AUTH] Authorization error:', error)
          if (error instanceof Error) {
            console.error('[AUTH] Error message:', error.message)
            console.error('[AUTH] Error stack:', error.stack)
          }
          return null
        }
      },
    }),
  ],
  pages: {
    signIn: '/auth/login',
    error: '/auth/error',
  },
  session: {
    strategy: "jwt",
    maxAge: 48 * 60 * 60, // 48 hours
  },
  trustHost: true,
  callbacks: {
    async signIn({ user, account }) {
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