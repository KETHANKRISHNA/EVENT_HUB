import NextAuth from "next-auth"
import authConfig from "./auth.config"
import { NextResponse } from "next/server"

const { auth } = NextAuth(authConfig)

export default auth((req) => {
  const { nextUrl } = req
  const isLoggedIn = !!req.auth
  const user = req.auth?.user

  // 1. Never block API auth routes
  const isApiAuthRoute = nextUrl.pathname.startsWith("/api/auth")
  if (isApiAuthRoute) {
    return NextResponse.next()
  }

  // 2. Identify route categories
  const isOrganizerRoute = nextUrl.pathname.startsWith("/organizer")
  const isOnboardingRoute = nextUrl.pathname.startsWith("/onboarding")
  const isAuthRoute =
    nextUrl.pathname.startsWith("/login") ||
    nextUrl.pathname.startsWith("/signup") ||
    nextUrl.pathname.startsWith("/forgot-password") ||
    nextUrl.pathname.startsWith("/verify-otp") ||
    nextUrl.pathname.startsWith("/reset-password")

  const isProtectedRoute =
    isOrganizerRoute ||
    isOnboardingRoute ||
    nextUrl.pathname.startsWith("/my-bookings") ||
    nextUrl.pathname.startsWith("/checkout") ||
    nextUrl.pathname.startsWith("/profile")

  // 3. Logged-out user checks
  if (!isLoggedIn) {
    if (isProtectedRoute) {
      const redirectUrl = new URL("/login", nextUrl)
      redirectUrl.searchParams.set("callbackUrl", nextUrl.pathname)
      return NextResponse.redirect(redirectUrl)
    }
    return NextResponse.next()
  }



  // 5. Logged-in user with onboarded === false must go to /onboarding
  if (user?.onboarded === false) {
    if (isOnboardingRoute) {
      return NextResponse.next()
    }
    return NextResponse.redirect(new URL("/onboarding", nextUrl))
  }

  // 6. Logged-in onboarded user visiting auth or onboarding routes goes to their dashboard
  if (isAuthRoute || isOnboardingRoute) {
    if (user?.role === "ORGANIZER") {
      return NextResponse.redirect(new URL("/organizer", nextUrl))
    }
    return NextResponse.redirect(new URL("/events", nextUrl))
  }

  // 7. Role-based route authorization
  if (isOrganizerRoute && user?.role !== "ORGANIZER") {
    return NextResponse.redirect(new URL("/", nextUrl))
  }

  return NextResponse.next()
})

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
