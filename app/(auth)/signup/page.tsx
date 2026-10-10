import Link from "next/link"
import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { SignupForm } from "./SignupForm"

export default async function SignupPage(props: {
  searchParams: Promise<{ callbackUrl?: string }>
}) {
  const session = await auth()
  if (session) {
    if (!session.user.onboarded) {
      redirect("/onboarding")
    }
    if (session.user.role === "MANAGER") redirect("/manager")
    if (session.user.role === "ORGANIZER") redirect("/organizer")
    redirect("/events")
  }

  const searchParams = await props.searchParams
  const callbackUrl = searchParams.callbackUrl

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-100px)] px-4 py-8">
      <Card className="w-full max-w-md shadow-lg border">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold tracking-tight">
            Create an Account
          </CardTitle>
          <CardDescription>
            Join EventHub to discover or host amazing events
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-2">
          <SignupForm />
        </CardContent>
        <CardFooter className="flex flex-col space-y-2 border-t pt-4">
          <div className="text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Button
              render={<Link href={callbackUrl ? `/login?callbackUrl=${encodeURIComponent(callbackUrl)}` : "/login"} />}
              variant="link"
              className="px-0 font-medium"
              nativeButton={false}
            >
              Sign in
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
