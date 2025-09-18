import { type NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"

const users = [
  {
    id: "1",
    email: "admin@easyauth.com",
    password: "$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi", // password
    name: "Admin User",
    role: "admin",
  },
  {
    id: "2",
    email: "user@easyauth.com",
    password: "$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi", // password
    name: "John Doe",
    role: "verifier",
  },
]

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key"

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    console.log("[v0] Login attempt for:", email)

    // Find user by email
    const user = users.find((u) => u.email === email)
    if (!user) {
      console.log("[v0] User not found:", email)
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password)
    if (!isValidPassword) {
      console.log("[v0] Invalid password for:", email)
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    console.log("[v0] Login successful for:", email)

    // Generate JWT token
    const token = jwt.sign({ userId: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: "24h" })

    // Create response with user data (excluding password)
    const { password: _, ...userWithoutPassword } = user

    const response = NextResponse.json({
      success: true,
      user: userWithoutPassword,
      token,
    })

    // Set HTTP-only cookie for additional security
    response.cookies.set("auth-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 86400, // 24 hours
    })

    return response
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
