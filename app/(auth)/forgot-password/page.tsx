import { ForgotPasswordForm } from "./ForgotPasswordForm"
import { auth } from "@/auth"
import { redirect } from "next/navigation"

export const metadata = {
  title: "Forgot Password | EventHub",
}

export default async function ForgotPasswordPage() {
  const session = await auth()
  
  if (session) {
    if (!session.user.onboarded) redirect("/onboarding")
    if (session.user.role === "MANAGER") redirect("/manager")
    if (session.user.role === "ORGANIZER") redirect("/organizer")
    redirect("/events")
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <div className="w-full max-w-md space-y-8 bg-white p-8 rounded-xl shadow-sm border">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">Forgot your password?</h2>
          <p className="mt-2 text-sm text-gray-600">
            Enter your registered email address and we'll send you a password reset link.
          </p>
        </div>
        
        <ForgotPasswordForm />
      </div>
    </div>
  )
}
