import { type NextRequest, NextResponse } from "next/server"

// Mock database of verified hashes
const VERIFIED_HASHES = ["a1b2c3d4e5f6...", "b2c3d4e5f6a7...", "c4d5e6f7a8b9...", "d5e6f7a8b9c0..."]

export async function POST(request: NextRequest) {
  try {
    const { hash } = await request.json()

    if (!hash) {
      return NextResponse.json({ error: "Hash is required" }, { status: 400 })
    }

    // Simulate database lookup
    await new Promise((resolve) => setTimeout(resolve, 500))

    const isVerified = VERIFIED_HASHES.includes(hash)

    return NextResponse.json({
      hash,
      verified: isVerified,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Hash verification error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
