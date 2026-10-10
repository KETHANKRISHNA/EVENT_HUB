"use client"

import { useActionState, useEffect } from "react"
import { updatePhoneAction } from "@/actions/profile-phone"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"

export function UpdatePhoneForm({ initialPhone }: { initialPhone?: string | null }) {
  const [state, formAction, isPending] = useActionState(updatePhoneAction, null)

  useEffect(() => {
    if (state?.success) {
      toast.success("Phone number updated successfully")
    } else if (state?.error) {
      toast.error(state.error)
    }
  }, [state])

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="phone">Phone Number</Label>
        <Input 
          id="phone" 
          name="phone" 
          type="tel" 
          placeholder="+1234567890" 
          defaultValue={initialPhone || ""}
          required 
        />
        {!initialPhone && (
          <p className="text-sm text-destructive font-medium mt-1">
            A phone number is required to use EventHub. Please provide it.
          </p>
        )}
      </div>
      
      <Button type="submit" disabled={isPending}>
        {isPending ? "Updating..." : "Update Phone"}
      </Button>
    </form>
  )
}
