import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { OnboardingForm } from "./OnboardingForm"

export default async function OnboardingPage() {
  const session = await auth()

  if (!session) {
    redirect("/login")
  }

  if (session.user.onboarded) {
    if (session.user.role === "ORGANIZER") redirect("/organizer")
    redirect("/events")
  }

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-100px)] px-4 py-12">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8 space-y-2">
          <h1 className="text-3xl font-extrabold tracking-tight">
            Welcome to EventHub, {session.user.name || "friend"}!
          </h1>
          <p className="text-muted-foreground text-base max-w-md mx-auto">
            Choose how you would like to use your account. You can switch roles later in your profile.
          </p>
        </div>
        <OnboardingForm />
      </div>
    </div>
  )
}
