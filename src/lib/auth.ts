// =============================================================================
// CFO Family Finance App — NextAuth v5 Configuration
// =============================================================================

import NextAuth from 'next-auth'
import Google from 'next-auth/providers/google'
import { PrismaAdapter } from '@auth/prisma-adapter'
import { prisma } from './prisma'

export const { handlers, auth, signIn, signOut } = NextAuth({
    trustHost: true,
    adapter: PrismaAdapter(prisma),
    providers: [
        Google({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        }),
    ],

    session: {
        strategy: 'jwt',
        maxAge: 30 * 24 * 60 * 60, // 30 days
    },

    pages: {
        signIn: '/auth/signin',
        error: '/auth/error',
    },

    callbacks: {
        async jwt({ token, user }) {
            // First time sign in: persist user.id into the JWT
            if (user?.id) {
                token.userId = user.id
            }
            return token
        },

        async session({ session, token }) {
            // Expose userId from JWT to session for client-side use
            if (token.userId) {
                session.user.id = token.userId as string
            }
            return session
        },
    },
})
