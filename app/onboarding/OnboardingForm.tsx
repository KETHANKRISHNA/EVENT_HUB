"use client"

import { useState, useTransition } from "react"
import { completeOnboardingAction } from "@/actions/onboarding"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Ticket, Calendar, CheckCircle2 } from "lucide-react"

export function OnboardingForm() {
  const [selectedRole, setSelectedRole] = useState<"ATTENDEE" | "ORGANIZER">("ATTENDEE")
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const handleContinue = () => {
    setError(null)
    startTransition(async () => {
      const res = await completeOnboardingAction(selectedRole)
      if (res?.error) {
        setError(res.error)
      }
    })
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md border border-destructive/20 text-center font-medium">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Attendee Option */}
        <Card
          onClick={() => setSelectedRole("ATTENDEE")}
          className={`cursor-pointer transition-all duration-200 border-2 relative overflow-hidden ${
            selectedRole === "ATTENDEE"
              ? "border-primary ring-2 ring-primary/20 bg-primary/5 shadow-md"
              : "border-border hover:border-primary/50 hover:bg-muted/30"
          }`}
        >
          <CardContent className="p-6 flex flex-col items-start space-y-4">
            <div className="flex items-center justify-between w-full">
              <div className="p-3 rounded-full bg-primary/10 text-primary">
                <Ticket className="h-6 w-6" />
              </div>
              {selectedRole === "ATTENDEE" && (
                <CheckCircle2 className="h-5 w-5 text-primary" />
              )}
            </div>
            <div>
              <h3 className="text-lg font-bold text-foreground">
                I want to attend events
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                Explore popular events, buy tickets, pick seats, and manage all your bookings.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Organizer Option */}
        <Card
          onClick={() => setSelectedRole("ORGANIZER")}
          className={`cursor-pointer transition-all duration-200 border-2 relative overflow-hidden ${
            selectedRole === "ORGANIZER"
              ? "border-primary ring-2 ring-primary/20 bg-primary/5 shadow-md"
              : "border-border hover:border-primary/50 hover:bg-muted/30"
          }`}
        >
          <CardContent className="p-6 flex flex-col items-start space-y-4">
            <div className="flex items-center justify-between w-full">
              <div className="p-3 rounded-full bg-primary/10 text-primary">
                <Calendar className="h-6 w-6" />
              </div>
              {selectedRole === "ORGANIZER" && (
                <CheckCircle2 className="h-5 w-5 text-primary" />
              )}
            </div>
            <div>
              <h3 className="text-lg font-bold text-foreground">
                I want to organize events
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                Host events, configure ticket tiers, create custom seat maps, and track sales.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Button
        onClick={handleContinue}
        disabled={isPending}
        className="w-full py-6 text-base font-semibold"
      >
        {isPending ? "Setting up account..." : "Continue"}
      </Button>
    </div>
  )
}
