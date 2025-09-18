"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

interface User {
  id: string
  name: string
  email: string
  role: "admin" | "verifier"
}

interface AuthContextType {
  user: User | null
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  register: (name: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>
  logout: () => Promise<void>
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check for existing session on mount
    checkAuthStatus()
  }, [])

  const checkAuthStatus = async () => {
    try {
      console.log("[v0] Checking auth status...")
      const response = await fetch("/api/auth/verify")
      if (response.ok) {
        const data = await response.json()
        console.log("[v0] Auth check successful:", data.user)
        setUser(data.user)
      } else {
        console.log("[v0] Auth check failed:", response.status)
      }
    } catch (error) {
      console.error("[v0] Auth check error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const login = async (email: string, password: string) => {
    try {
      console.log("[v0] Attempting login for:", email)
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (response.ok) {
        console.log("[v0] Login successful:", data.user)
        setUser(data.user)
        return { success: true }
      } else {
        console.log("[v0] Login failed:", data.error)
        return { success: false, error: data.error }
      }
    } catch (error) {
      console.error("[v0] Login network error:", error)
      return { success: false, error: "Network error" }
    }
  }

  const register = async (name: string, email: string, password: string) => {
    try {
      console.log("[v0] Attempting registration for:", email)
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      })

      const data = await response.json()

      if (response.ok) {
        console.log("[v0] Registration successful:", data.user)
        setUser(data.user)
        return { success: true }
      } else {
        console.log("[v0] Registration failed:", data.error)
        return { success: false, error: data.error }
      }
    } catch (error) {
      console.error("[v0] Registration network error:", error)
      return { success: false, error: "Network error" }
    }
  }

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" })
      setUser(null)
      console.log("[v0] Logout successful")
    } catch (error) {
      console.error("[v0] Logout error:", error)
      // Still clear user state even if API call fails
      setUser(null)
    }
  }

  return <AuthContext.Provider value={{ user, login, register, logout, isLoading }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
