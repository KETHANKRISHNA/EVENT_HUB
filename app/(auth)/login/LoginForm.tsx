"use client"

import { useActionState, useEffect } from "react"
import { loginAction } from "@/actions/auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
export function LoginForm({ callbackUrl }: { callbackUrl?: string }) {
  const [state, formAction, isPending] = useActionState(loginAction, null)



  return (
    <form action={formAction} className="space-y-4">
      {state?.error && (
        <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md border border-destructive/20 text-center font-medium">
          {state.error}
        </div>
      )}
      
      {callbackUrl && <input type="hidden" name="callbackUrl" value={callbackUrl} />}
      
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" placeholder="m@example.com" required />
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="password">Password</Label>
          <a href="/forgot-password" className="text-sm font-medium text-primary hover:underline">
            Forgot Password?
          </a>
        </div>
        <Input id="password" name="password" type="password" required />
      </div>
      
      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? "Signing in..." : "Sign in"}
      </Button>
    </form>
  )
}
