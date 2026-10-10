"use server"

import { signIn, signOut } from "@/auth"
import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcrypt"
import { AuthError } from "next-auth"
import { z } from "zod"

import { generateAndSendOtp, verifyOtpAction } from "./otp"

const signupSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(10, "Phone must be at least 10 characters"),
  role: z.enum(["ATTENDEE", "ORGANIZER"]),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string()
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
})

export async function signupAction(prevState: unknown, formData: FormData) {
  const data = Object.fromEntries(formData)
  const parsed = signupSchema.safeParse(data)

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || "Invalid input" }
  }

  const email = parsed.data.email.trim().toLowerCase()
  const existingUser = await prisma.user.findUnique({
    where: { email },
  })

  if (existingUser) {
    return { error: "Email is already registered" }
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 10)

  await prisma.user.create({
    data: {
      name: parsed.data.name,
      email,
      phone: parsed.data.phone,
      passwordHash,
      role: parsed.data.role,
      onboarded: false,
    },
  })

  return { success: true, email }
}

export async function loginAction(prevState: unknown, formData: FormData) {
  const email = formData.get("email") as string
  const password = formData.get("password") as string
  const callbackUrl = formData.get("callbackUrl") as string | null

  if (!email || !password) {
    return { error: "Email and password are required" }
  }

  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  })

  let defaultRedirect = "/events"
  if (user) {
    if (!user.onboarded && user.role !== "MANAGER") defaultRedirect = "/onboarding"
    else if (user.role === "ORGANIZER") defaultRedirect = "/organizer"
    else if (user.role === "MANAGER") defaultRedirect = "/manager"
  }

  const redirectTo =
    callbackUrl && callbackUrl.startsWith("/") && !callbackUrl.startsWith("//")
      ? callbackUrl
      : defaultRedirect

  try {
    await signIn("credentials", {
      email,
      password,
      redirectTo,
    })
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return { error: "Invalid email or password" }
        default:
          return { error: "Something went wrong" }
      }
    }
    throw error
  }
}

export async function logoutAction() {
  revalidatePath("/", "layout")
  await signOut({ redirectTo: "/login" })
}

export async function forgotPasswordAction(prevState: unknown, formData: FormData) {
  const email = formData.get("email") as string
  if (!email) return { error: "Email is required" }

  const normalizedEmail = email.trim().toLowerCase()
  console.log(`Forgot password requested for: ${normalizedEmail}`)

  const user = await prisma.user.findUnique({ where: { email: normalizedEmail } })
  console.log(`User found: ${!!user}`)

  if (user) {
    const result = await generateAndSendOtp(normalizedEmail, "FORGOT_PASSWORD")
    if (result.error) {
      return { error: result.error }
    }
  }

  // Always return success to prevent email enumeration
  return { success: true, email: normalizedEmail }
}

export async function resetPasswordAction(prevState: unknown, formData: FormData) {
  const token = formData.get("token") as string
  const newPassword = formData.get("newPassword") as string
  const confirmPassword = formData.get("confirmPassword") as string

  if (!token || !newPassword || newPassword !== confirmPassword) {
    return { error: "Invalid input or passwords do not match" }
  }

  if (newPassword.length < 6) {
    return { error: "New password must be at least 6 characters" }
  }

  // Find verified OTP by token
  const otpRecord = await prisma.otp.findFirst({
    where: { purpose: `VERIFIED_${token}` }
  })

  if (!otpRecord) {
    return { error: "Invalid or expired password reset session." }
  }

  if (otpRecord.expiresAt < new Date()) {
    return { error: "Password reset session has expired." }
  }

  const newPasswordHash = await bcrypt.hash(newPassword, 10)

  await prisma.user.update({
    where: { email: otpRecord.email },
    data: { 
      passwordHash: newPasswordHash,
    }
  })

  await prisma.otp.delete({
    where: { id: otpRecord.id }
  })

  return { success: true }
}

export async function changePasswordAction(prevState: unknown, formData: FormData) {
  const email = formData.get("email") as string
  const currentPassword = formData.get("currentPassword") as string
  const newPassword = formData.get("newPassword") as string
  const confirmPassword = formData.get("confirmPassword") as string

  if (!email || !currentPassword || !newPassword || newPassword !== confirmPassword) {
    return { error: "Invalid input or passwords do not match" }
  }

  if (newPassword.length < 6) {
    return { error: "New password must be at least 6 characters" }
  }

  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() }
  })

  if (!user || !user.passwordHash) {
    return { error: "User not found or invalid account" }
  }

  const isValidPassword = await bcrypt.compare(currentPassword, user.passwordHash)
  if (!isValidPassword) {
    return { error: "Current password is incorrect" }
  }

  const newPasswordHash = await bcrypt.hash(newPassword, 10)

  await prisma.user.update({
    where: { email: email.toLowerCase() },
    data: { 
      passwordHash: newPasswordHash,
    }
  })

  return { success: true }
}
