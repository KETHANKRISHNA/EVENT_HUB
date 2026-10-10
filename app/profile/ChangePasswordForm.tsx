"use client"

import { useActionState } from "react"
import { changePasswordAction } from "@/actions/auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function ChangePasswordForm({ email }: { email: string }) {
  const [state, formAction, isPending] = useActionState(changePasswordAction, null)

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="email" value={email} />
      
      {state?.success && (
        <div className="p-3 text-sm text-green-700 bg-green-50 rounded-md border border-green-200 font-medium">
          Password successfully changed.
        </div>
      )}
      
      {state?.error && (
        <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md border border-destructive/20 font-medium">
          {state.error}
        </div>
      )}
      
      <div className="space-y-2">
        <Label htmlFor="currentPassword">Current Password</Label>
        <Input id="currentPassword" name="currentPassword" type="password" required />
      </div>

      <div className="space-y-2">
        <Label htmlFor="newPassword">New Password</Label>
        <Input id="newPassword" name="newPassword" type="password" required />
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Confirm New Password</Label>
        <Input id="confirmPassword" name="confirmPassword" type="password" required />
      </div>
      
      <Button type="submit" disabled={isPending}>
        {isPending ? "Updating..." : "Change Password"}
      </Button>
    </form>
  )
}
