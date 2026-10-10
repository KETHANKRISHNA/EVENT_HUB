"use client"

import { useActionState, useEffect } from "react"
import { resetPasswordAction } from "@/actions/auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useRouter, useSearchParams } from "next/navigation"

export function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get("token") || ""
  const message = searchParams.get("message") || ""

  const [state, formAction, isPending] = useActionState(resetPasswordAction, null)

  useEffect(() => {
    if (state?.success) {
      router.push("/login?message=Password reset successful. Please sign in with your new password.")
    }
  }, [state?.success, router])

  if (!token) {
    return <div className="text-center text-sm text-muted-foreground">Missing reset token.</div>
  }

  return (
    <form action={formAction} className="space-y-4">
      {message && !state?.error && (
        <div className="p-3 text-sm text-primary bg-primary/10 rounded-md border border-primary/20 text-center font-medium">
          {message}
        </div>
      )}
      
      {state?.error && (
        <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md border border-destructive/20 text-center font-medium">
          {state.error}
        </div>
      )}
      
      <input type="hidden" name="token" value={token} />

      <div className="space-y-2">
        <Label htmlFor="newPassword">New Password</Label>
        <Input id="newPassword" name="newPassword" type="password" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Confirm New Password</Label>
        <Input id="confirmPassword" name="confirmPassword" type="password" required />
      </div>
      
      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? "Resetting..." : "Reset Password"}
      </Button>
    </form>
  )
}
