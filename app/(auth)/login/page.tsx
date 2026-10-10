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
import { LoginForm } from "./LoginForm"

export default async function LoginPage(props: {
  searchParams: Promise<{ callbackUrl?: string; message?: string }>
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
  const message = searchParams.message

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-100px)] px-4">
      <Card className="w-full max-w-md shadow-lg border">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold tracking-tight">
            Welcome back
          </CardTitle>
          <CardDescription>
            Enter your credentials to sign in
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-2">
          {message && (
            <div className="p-3 text-sm text-green-700 bg-green-100 rounded-md border border-green-200 text-center font-medium">
              {message}
            </div>
          )}
          <LoginForm callbackUrl={callbackUrl} />
        </CardContent>
        <CardFooter className="flex flex-col space-y-2 border-t pt-4">
          <div className="text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Button
              render={<Link href={callbackUrl ? `/signup?callbackUrl=${encodeURIComponent(callbackUrl)}` : "/signup"} />}
              variant="link"
              className="px-0 font-medium"
              nativeButton={false}
            >
              Sign up
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
