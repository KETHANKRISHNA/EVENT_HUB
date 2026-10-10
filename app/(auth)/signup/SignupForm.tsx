"use client"

import { useActionState, useEffect } from "react"
import { signupAction } from "@/actions/auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useRouter } from "next/navigation"

export function SignupForm() {
  const [state, formAction, isPending] = useActionState(signupAction, null)
  const router = useRouter()

  useEffect(() => {
    if (state?.success) {
      router.push("/login?message=Account created successfully. Please sign in.")
    }
  }, [state?.success, router])

  return (
    <form action={formAction} className="space-y-4">
      {state?.error && (
        <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md border border-destructive/20 text-center font-medium">
          {state.error}
        </div>
      )}
      
      <div className="space-y-2">
        <Label htmlFor="name">Full Name</Label>
        <Input id="name" name="name" type="text" placeholder="John Doe" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" placeholder="m@example.com" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="phone">Phone Number</Label>
        <Input id="phone" name="phone" type="tel" placeholder="+1234567890" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="role">Account Type</Label>
        <select 
          id="role" 
          name="role" 
          required
          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
        >
          <option value="ATTENDEE">Attendee</option>
          <option value="ORGANIZER">Event Organizer</option>
        </select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input id="password" name="password" type="password" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Confirm Password</Label>
        <Input id="confirmPassword" name="confirmPassword" type="password" required />
      </div>
      
      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? "Creating account..." : "Sign up"}
      </Button>
    </form>
  )
}
