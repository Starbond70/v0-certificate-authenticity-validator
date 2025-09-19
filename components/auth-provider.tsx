"use client"

import { createContext, useContext, useState, type ReactNode } from "react"

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
  const [isLoading, setIsLoading] = useState(false)

  const login = async (email: string, password: string) => {
    setIsLoading(true)

    // Simulate loading delay
    await new Promise((resolve) => setTimeout(resolve, 500))

    // Determine role based on email for demo purposes
    const role = email.includes("admin") ? "admin" : "verifier"

    // Auto-login with demo user data
    const demoUser: User = {
      id: "demo-" + Date.now(),
      name: email.includes("admin") ? "Admin User" : "Demo User",
      email: email,
      role: role,
    }

    setUser(demoUser)
    setIsLoading(false)

    return { success: true }
  }

  const register = async (name: string, email: string, password: string) => {
    setIsLoading(true)

    // Simulate loading delay
    await new Promise((resolve) => setTimeout(resolve, 500))

    // Auto-register with provided data
    const newUser: User = {
      id: "demo-" + Date.now(),
      name: name,
      email: email,
      role: "verifier", // Default role for new users
    }

    setUser(newUser)
    setIsLoading(false)

    return { success: true }
  }

  const logout = async () => {
    setUser(null)
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
