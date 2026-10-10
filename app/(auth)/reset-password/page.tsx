import { ResetPasswordForm } from "./ResetPasswordForm"
import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Reset Password | EventHub",
  description: "Reset your EventHub password",
}

export default function ResetPasswordPage() {
  return (
    <div className="flex flex-col space-y-6 w-full sm:w-[400px]">
      <div className="flex flex-col space-y-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">
          Reset Password
        </h1>
        <p className="text-sm text-muted-foreground">
          Enter the verification code and your new password.
        </p>
      </div>
      
      <ResetPasswordForm />
    </div>
  )
}
