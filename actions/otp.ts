"use server"

import { prisma } from "@/lib/prisma"
import { sendEmail } from "@/lib/email"
import crypto from "crypto"
import bcrypt from "bcrypt"

export async function generateAndSendOtp(email: string, purpose: string) {
  const normalizedEmail = email.trim().toLowerCase()
  
  // 1. Invalidate previous OTPs for this email and purpose
  await prisma.otp.deleteMany({
    where: { email: normalizedEmail, purpose }
  })

  // 2. Generate secure 6-digit OTP
  const otp = crypto.randomInt(100000, 1000000).toString()
  const hashedOtp = crypto.createHash("sha256").update(otp).digest("hex")

  // 3. Store OTP in database (valid for 5 minutes)
  const otpRecord = await prisma.otp.create({
    data: {
      email: normalizedEmail,
      hashedOtp,
      purpose,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000)
    }
  })

  console.log(`OTP database record created: ${!!otpRecord}`)
  console.log(`OTP expiry: ${otpRecord.expiresAt}`)

  // 4. Send email
  let subject = "Your Verification Code"
  let html = `<p>Your verification code is: <strong>${otp}</strong></p><p>It will expire in 5 minutes.</p>`
  
  if (purpose === "FORGOT_PASSWORD") {
    subject = "EventHub - Password Reset Code"
    html = `<p>You requested a password reset. Your verification code is: <strong>${otp}</strong></p><p>It will expire in 5 minutes.</p>`
  }

  console.log(`Resend request started`)
  const emailResult = await sendEmail({
    to: normalizedEmail,
    subject,
    html,
  })
  
  console.log(`Resend success: ${emailResult.success}`)

  if (!emailResult.success) {
    console.log(`Resend error: ${JSON.stringify(emailResult.error)}`)
    return { error: "Unable to send OTP. Please try again later." }
  }

  return { success: true }
}

export async function verifyOtpAction(email: string, otp: string, purpose: string) {
  const normalizedEmail = email.trim().toLowerCase()

  const otpRecord = await prisma.otp.findFirst({
    where: { email: normalizedEmail, purpose },
    orderBy: { createdAt: "desc" }
  })

  if (!otpRecord) {
    return { error: "Invalid or expired verification code." }
  }

  if (otpRecord.expiresAt < new Date()) {
    return { error: "Verification code has expired. Please request a new one." }
  }

  if (otpRecord.attempts >= 5) {
    return { error: "Too many failed attempts. Please request a new code." }
  }

  const submittedOtpHash = crypto.createHash("sha256").update(otp).digest("hex")
  const isValid = submittedOtpHash === otpRecord.hashedOtp

  if (!isValid) {
    await prisma.otp.update({
      where: { id: otpRecord.id },
      data: { attempts: otpRecord.attempts + 1 }
    })
    return { error: "Invalid verification code." }
  }

  // OTP is valid
  const token = crypto.randomBytes(32).toString("hex")
  await prisma.otp.update({
    where: { id: otpRecord.id },
    data: { purpose: `VERIFIED_${token}` }
  })

  return { success: true, token }
}
