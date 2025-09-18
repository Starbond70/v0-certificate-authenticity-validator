import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import jwt from "jsonwebtoken"

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key"

// Define protected routes
const protectedRoutes = ["/admin", "/verify"]
const adminOnlyRoutes = ["/admin"]

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Check if the route needs protection
  const isProtectedRoute = protectedRoutes.some((route) => pathname.startsWith(route))

  if (!isProtectedRoute) {
    return NextResponse.next()
  }

  // Get token from cookie
  const token = request.cookies.get("auth-token")?.value

  if (!token) {
    // Redirect to auth page if no token
    return NextResponse.redirect(new URL("/auth", request.url))
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET) as any

    // Check admin-only routes
    const isAdminRoute = adminOnlyRoutes.some((route) => pathname.startsWith(route))
    if (isAdminRoute && decoded.role !== "admin") {
      return NextResponse.redirect(new URL("/verify", request.url))
    }

    // Redirect to the appropriate dashboard after login
    if (pathname === "/auth") {
      if (decoded.role === "admin") {
        return NextResponse.redirect(new URL("/admin", request.url))
      } else {
        return NextResponse.redirect(new URL("/verify", request.url))
      }
    }

    return NextResponse.next()
  } catch (error) {
    // Invalid token, redirect to auth
    return NextResponse.redirect(new URL("/auth", request.url))
  }
}

export const config = {
  matcher: ["/admin/:path*", "/verify/:path*", "/auth"],
}
