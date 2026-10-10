"use server"

import { auth, unstable_update } from "@/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"

export async function completeOnboardingAction(role: string) {
  const session = await auth()
  if (!session?.user?.id) {
    redirect("/login")
  }


  // Never allow ADMIN role from client, only ATTENDEE or ORGANIZER
  if (role !== "ATTENDEE" && role !== "ORGANIZER") {
    return { error: "Please select a valid account type." }
  }

  // Update user in database for the current session user only
  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      role: role as "ATTENDEE" | "ORGANIZER",
      onboarded: true,
    },
  })

  // Refresh session token
  await unstable_update({
    user: {
      role,
      onboarded: true,
    },
  })

  revalidatePath("/", "layout")

  if (role === "ORGANIZER") {
    redirect("/organizer")
  } else {
    redirect("/events")
  }
}
