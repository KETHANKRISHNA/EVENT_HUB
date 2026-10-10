"use server"

import { auth, unstable_update } from "@/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export async function switchRoleAction() {
  const session = await auth()
  if (!session?.user?.id) {
    return { error: "Unauthorized" }
  }

  const userId = session.user.id
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      bookings: true,
      events: true,
    },
  })

  if (!user) {
    return { error: "User not found" }
  }



  if (user.role === "ATTENDEE") {
    if (user.bookings.length > 0) {
      return { error: "Cannot switch to Organizer while you have existing bookings." }
    }

    await prisma.user.update({
      where: { id: userId },
      data: { role: "ORGANIZER" },
    })

    await unstable_update({
      user: { role: "ORGANIZER" },
    })

    revalidatePath("/profile")
    revalidatePath("/", "layout")
    return { success: true, newRole: "ORGANIZER" }
  }

  if (user.role === "ORGANIZER") {
    if (user.events.length > 0) {
      return { error: "Cannot switch to Attendee while you have created events." }
    }

    await prisma.user.update({
      where: { id: userId },
      data: { role: "ATTENDEE" },
    })

    await unstable_update({
      user: { role: "ATTENDEE" },
    })

    revalidatePath("/profile")
    revalidatePath("/", "layout")
    return { success: true, newRole: "ATTENDEE" }
  }

  return { error: "Invalid role transition." }
}

export async function updateUpiSettingsAction(data: { upiId: string, upiName: string, upiQrUrl?: string }) {
  const session = await auth()
  if (!session?.user?.id) {
    return { error: "Unauthorized" }
  }

  const userId = session.user.id
  const user = await prisma.user.findUnique({
    where: { id: userId }
  })

  if (!user || user.role !== "ORGANIZER") {
    return { error: "Only organizers can configure payment settings." }
  }

  const upiRegex = /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/
  if (!data.upiId || !upiRegex.test(data.upiId)) {
    return { error: "Invalid UPI ID format." }
  }
  
  if (!data.upiName || data.upiName.trim().length < 2) {
    return { error: "Payee name is required." }
  }

  try {
    await prisma.user.update({
      where: { id: userId },
      data: {
        upiId: data.upiId.trim(),
        upiName: data.upiName.trim(),
        upiQrUrl: data.upiQrUrl,
        // upiVerified is not automatically true just because they entered it
      }
    })

    revalidatePath("/profile")
    return { success: true }
  } catch (error) {
    return { error: "Failed to update UPI settings." }
  }
}

export async function updateUpiQrUrlOnlyAction(url: string | null) {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== "ORGANIZER") {
    return { error: "Unauthorized" }
  }

  try {
    await prisma.user.update({
      where: { id: session.user.id },
      data: { upiQrUrl: url }
    })
    revalidatePath("/profile")
    return { success: true }
  } catch (error) {
    return { error: "Failed to update QR code" }
  }
}

import { createClient } from "@supabase/supabase-js"

export async function uploadUpiQrAction(formData: FormData) {
  const session = await auth()
  if (!session || session.user.role !== "ORGANIZER") {
    return { error: "Unauthorized" }
  }

  const file = formData.get("file") as File
  if (!file) return { error: "No file provided" }
  
  if (file.size > 3 * 1024 * 1024) return { error: "File exceeds 3 MB limit" }
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
    return { error: "Invalid file type. Only JPG, PNG, WEBP allowed." }
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseKey) {
    console.warn("Supabase credentials missing, mocking upload.")
    return { url: "https://via.placeholder.com/200x200?text=Mock+QR" }
  }

  const supabase = createClient(supabaseUrl, supabaseKey)
  
  const ext = file.name.split('.').pop()
  const filename = `${session.user.id}-${Date.now()}.${ext}`
  
  const { data, error } = await supabase.storage
    .from("event-banners") // reusing event-banners bucket for simplicity
    .upload(`qrs/${filename}`, file, { contentType: file.type })

  if (error) return { error: error.message }
  
  const { data: publicUrlData } = supabase.storage
    .from("event-banners")
    .getPublicUrl(`qrs/${filename}`)

  return { url: publicUrlData.publicUrl }
}
