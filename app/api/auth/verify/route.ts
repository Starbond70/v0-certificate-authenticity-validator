import { type NextRequest, NextResponse } from "next/server"
import jwt from "jsonwebtoken"

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key"

export async function GET(request: NextRequest) {
  try {
    // Get token from cookie or Authorization header
    const token =
      request.cookies.get("auth-token")?.value || request.headers.get("Authorization")?.replace("Bearer ", "")

    if (!token) {
      return NextResponse.json({ error: "No token provided" }, { status: 401 })
    }

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET) as any

    const users = [
      {
        id: "1",
        email: "admin@easyauth.com",
        name: "Admin User",
        role: "admin",
      },
      {
        id: "2",
        email: "user@easyauth.com",
        name: "John Doe",
        role: "verifier",
      },
    ]

    const user = users.find((u) => u.id === decoded.userId)
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 401 })
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    })
  } catch (error) {
    console.error("Token verification error:", error)
    return NextResponse.json({ error: "Invalid token" }, { status: 401 })
  }
}
