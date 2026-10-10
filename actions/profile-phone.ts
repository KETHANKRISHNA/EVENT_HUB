"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { z } from "zod"

const phoneSchema = z.object({
  phone: z.string().min(10, "Phone must be at least 10 characters"),
})

export async function updatePhoneAction(prevState: any, formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) {
    return { error: "Unauthorized" }
  }

  const phoneStr = formData.get("phone") as string
  const parsed = phoneSchema.safeParse({ phone: phoneStr })
  
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || "Invalid input" }
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { phone: parsed.data.phone },
  })

  revalidatePath("/profile")
  return { success: true }
}
