import NextAuth from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      authorization: {
        params: {
          prompt: 'consent',
          access_type: 'offline',
          response_type: 'code',
          hd: process.env.GOOGLE_WORKSPACE_DOMAIN || undefined,
        },
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      const allowedDomain = process.env.GOOGLE_WORKSPACE_DOMAIN
      if (allowedDomain && profile?.email) {
        const emailDomain = profile.email.split('@')[1]
        if (emailDomain !== allowedDomain) {
          return false
        }
      }
      return true
    },
    async session({ session, token }) {
      return session
    },
    async jwt({ token, user, account }) {
      if (account) {
        token.accessToken = account.access_token
      }
      return token
    },
  },
  pages: {
    signIn: '/auth/login',
    error: '/auth/login',
  },
  secret: process.env.NEXTAUTH_SECRET,
})

export { handler as GET, handler as POST }
