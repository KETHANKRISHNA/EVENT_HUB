"use client"

import { useActionState, useEffect } from "react"
import { verifyOtpAction } from "@/actions/otp"
import { forgotPasswordAction } from "@/actions/auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useRouter, useSearchParams } from "next/navigation"

export function VerifyOtpForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const email = searchParams.get("email") || ""
  const message = searchParams.get("message") || ""

  const boundVerifyAction = async (prevState: unknown, formData: FormData) => {
    const otp = formData.get("otp") as string
    return verifyOtpAction(email, otp, "FORGOT_PASSWORD")
  }

  const [state, formAction, isPending] = useActionState(boundVerifyAction, null)
  const [resendState, resendAction, isResending] = useActionState(forgotPasswordAction, null)

  useEffect(() => {
    if (state?.success) {
      router.push(`/reset-password?token=${encodeURIComponent(state.token || "")}`)
    }
  }, [state?.success, state?.token, router])

  if (!email) {
    return <div className="text-center text-sm text-muted-foreground">Missing email address.</div>
  }

  return (
    <>
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
      
      <div className="space-y-2">
        <Label htmlFor="otp">Verification Code</Label>
        <Input 
          id="otp" 
          name="otp" 
          type="text" 
          placeholder="123456" 
          required 
          pattern="[0-9]{6}" 
          maxLength={6} 
          title="Please enter a 6-digit code"
        />
        <p className="text-xs text-muted-foreground">
          Enter the 6-digit code sent to {email}
        </p>
      </div>
      
      <Button type="submit" className="w-full" disabled={isPending || isResending}>
        {isPending ? "Verifying..." : "Verify OTP"}
      </Button>
    </form>

    <form action={resendAction} className="mt-4 text-center">
      <input type="hidden" name="email" value={email} />
      <Button variant="link" type="submit" className="text-sm text-primary p-0" disabled={isResending || isPending}>
        {isResending ? "Resending..." : "Resend OTP"}
      </Button>
      {resendState?.error && (
        <p className="text-xs text-destructive mt-1">{resendState.error}</p>
      )}
      {resendState?.success && (
        <p className="text-xs text-green-600 mt-1">A new verification code has been sent.</p>
      )}
    </form>
    </>
  )
}
