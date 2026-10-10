"use client"

import { useActionState, useEffect } from "react"
import { forgotPasswordAction } from "@/actions/auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { useRouter } from "next/navigation"

export function ForgotPasswordForm() {
  const [state, formAction, isPending] = useActionState(forgotPasswordAction, null)
  const router = useRouter()

  useEffect(() => {
    if (state?.success && state.email) {
      router.push(`/verify-otp?email=${encodeURIComponent(state.email)}&message=If an account exists with this email, a verification code has been sent.`)
    }
  }, [state?.success, state?.email, router])

  return (
    <form action={formAction} className="space-y-4">
      {state?.error && (
        <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md border border-destructive/20 text-center font-medium">
          {state.error}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" placeholder="m@example.com" required disabled={isPending} />
      </div>
      
      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? "Sending..." : "Send Reset Code"}
      </Button>

      <div className="text-center mt-4">
        <Link href="/login" className="text-sm font-medium text-primary hover:underline">
          Back to Login
        </Link>
      </div>
    </form>
  )
}
