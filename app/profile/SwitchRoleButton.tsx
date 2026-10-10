"use client"

import { useTransition } from "react"
import { Button } from "@/components/ui/button"
import { switchRoleAction } from "@/actions/profile"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

export function SwitchRoleButton({
  targetRole,
}: {
  targetRole: "ORGANIZER" | "ATTENDEE"
}) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const handleSwitch = () => {
    startTransition(async () => {
      const res = await switchRoleAction()
      if (res?.error) {
        toast.error(res.error)
      } else {
        toast.success(
          `Switched account to ${
            targetRole === "ORGANIZER" ? "Organizer" : "Attendee"
          }!`
        )
        router.refresh()
      }
    })
  }

  return (
    <Button onClick={handleSwitch} disabled={isPending} variant="outline">
      {isPending
        ? "Switching role..."
        : `Switch to ${
            targetRole === "ORGANIZER" ? "Organizer" : "Attendee"
          } account`}
    </Button>
  )
}
