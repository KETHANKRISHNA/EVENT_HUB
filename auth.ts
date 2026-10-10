import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { prisma } from "./lib/prisma"
import authConfig from "./auth.config"
import bcrypt from "bcrypt"

export const { handlers, signIn, signOut, auth, unstable_update } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const email = (credentials.email as string).trim().toLowerCase()
        const password = credentials.password as string

        const user = await prisma.user.findUnique({
          where: { email },
        })

        if (!user || !user.passwordHash) {
          return null
        }

        const isValid = await bcrypt.compare(password, user.passwordHash)
        
        if (!isValid) {
          return null
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          onboarded: user.onboarded,
          image: user.image,
        }
      }
    })
  ],
  trustHost: true,
  callbacks: {
    ...authConfig.callbacks,
    async jwt({ token, user, trigger }) {
      if (user || trigger === "update" || !token.id) {
        const email = token.email || user?.email
        if (email) {
          const dbUser = await prisma.user.findUnique({
            where: { email: email.toLowerCase() },
          })
          if (dbUser) {
            token.id = dbUser.id
            token.role = dbUser.role
            token.onboarded = dbUser.onboarded
            token.image = dbUser.image
            token.name = dbUser.name
          }
        }
      }
      return token
    },
  },
})
