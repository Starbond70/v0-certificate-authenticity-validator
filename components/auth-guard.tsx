"use client"

import type React from "react"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/auth-provider"

interface AuthGuardProps {
  children: React.ReactNode
  requireAdmin?: boolean
}

export function AuthGuard({ children, requireAdmin = false }: AuthGuardProps) {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading) {
      // If no user is logged in, redirect to auth page
      if (!user) {
        router.push("/auth")
        return
      }

      // If admin access is required but user is not admin, redirect to verify page
      if (requireAdmin && user.role !== "admin") {
        router.push("/verify")
        return
      }
    }
  }, [user, isLoading, requireAdmin, router])

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  // Don't render children if user is not authenticated or doesn't have required permissions
  if (!user || (requireAdmin && user.role !== "admin")) {
    return null
  }

  // Render children if all checks pass
  return <>{children}</>
}
