// =============================================================================
// CFO Family Finance App — NextAuth v5 Configuration
// Supports: Google OAuth + Credentials (email/password)
// =============================================================================

import NextAuth from 'next-auth'
import Google from 'next-auth/providers/google'
import Credentials from 'next-auth/providers/credentials'
import { PrismaAdapter } from '@auth/prisma-adapter'
import bcrypt from 'bcryptjs'
import { prisma } from './prisma'

export const { handlers, auth, signIn, signOut } = NextAuth({
    trustHost: true,
    adapter: PrismaAdapter(prisma),
    providers: [
        Google({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        }),
        Credentials({
            name: 'credentials',
            credentials: {
                email: { label: 'Email', type: 'email' },
                password: { label: 'Password', type: 'password' },
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) return null

                const user = await prisma.user.findUnique({
                    where: { email: credentials.email as string },
                })

                if (!user || !user.passwordHash) return null

                const isValid = await bcrypt.compare(
                    credentials.password as string,
                    user.passwordHash,
                )

                if (!isValid) return null

                return {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    image: user.avatarUrl || user.image,
                }
            },
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
            if (user?.id) {
                token.userId = user.id
            }
            return token
        },

        async session({ session, token }) {
            if (token.userId) {
                session.user.id = token.userId as string
            }
            return session
        },
    },
})
