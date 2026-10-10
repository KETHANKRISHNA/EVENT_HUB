import type { NextAuthConfig } from "next-auth"

export default {
  providers: [],
  pages: {
    signIn: "/login",
  },
  trustHost: true,
  session: {
    strategy: "jwt",
  },
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = user.role
        token.onboarded = user.onboarded
        token.image = user.image
      }
      return token
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as string
        session.user.onboarded = token.onboarded as boolean
        session.user.image = (token.image as string) ?? null
      }
      return session
    },
  },
} satisfies NextAuthConfig
