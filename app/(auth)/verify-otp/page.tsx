import { VerifyOtpForm } from "./VerifyOtpForm"
import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Verify Email | EventHub",
  description: "Verify your EventHub account email",
}

export default function VerifyOtpPage() {
  return (
    <div className="flex flex-col space-y-6 w-full sm:w-[400px]">
      <div className="flex flex-col space-y-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">
          Verify your email
        </h1>
        <p className="text-sm text-muted-foreground">
          We have sent a verification code to your email address.
        </p>
      </div>
      
      <VerifyOtpForm />
    </div>
  )
}
