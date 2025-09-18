"use client"

import type React from "react"

import { useAuth } from "@/components/auth-provider"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { Shield } from "lucide-react"

interface AuthGuardProps {
  children: React.ReactNode
  requireAdmin?: boolean
  fallbackPath?: string
}

export function AuthGuard({ children, requireAdmin = false, fallbackPath = "/auth" }: AuthGuardProps) {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.push(fallbackPath)
        return
      }

      if (requireAdmin && user.role !== "admin") {
        router.push("/verify")
        return
      }
    }
  }, [user, isLoading, requireAdmin, router, fallbackPath])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Shield className="h-12 w-12 text-primary mx-auto mb-4 animate-pulse" />
          <h2 className="text-xl font-semibold mb-2">EasyAuth</h2>
          <p className="text-muted-foreground">Verifying authentication...</p>
        </div>
      </div>
    )
  }

  if (!user || (requireAdmin && user.role !== "admin")) {
    return null
  }

  return <>{children}</>
}
