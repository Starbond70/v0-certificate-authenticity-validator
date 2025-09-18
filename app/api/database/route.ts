import { type NextRequest, NextResponse } from "next/server"

// Mock database operations for development
const mockDatabase = {
  certificates: [
    {
      id: "1",
      hash: "a1b2c3d4e5f6...",
      extractedData: {
        name: "John Smith",
        rollNo: "CS2021001",
        certificateId: "CERT-2024-001",
        marks: "85%",
        institution: "University of Technology",
      },
      uploadDate: "2024-01-15",
      status: "verified",
      confidence: 95.5,
    },
    {
      id: "2",
      hash: "b2c3d4e5f6a7...",
      extractedData: {
        name: "Jane Doe",
        rollNo: "EE2020005",
        certificateId: "CERT-2024-002",
        marks: "92%",
        institution: "Engineering College",
      },
      uploadDate: "2024-01-14",
      status: "verified",
      confidence: 88.7,
    },
  ],
  users: [
    {
      id: "admin",
      email: "admin@certvalidator.com",
      name: "Admin User",
      role: "admin",
    },
    {
      id: "user123",
      email: "john.doe@example.com",
      name: "John Doe",
      role: "verifier",
    },
  ],
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const action = searchParams.get("action")

  try {
    switch (action) {
      case "stats":
        return NextResponse.json({
          totalCertificates: mockDatabase.certificates.length,
          verifiedCertificates: mockDatabase.certificates.filter((c) => c.status === "verified").length,
          pendingCertificates: mockDatabase.certificates.filter((c) => c.status === "pending").length,
          totalUsers: mockDatabase.users.length,
          recentCertificatesToday: 2,
          verificationRate: 95.5,
        })

      case "certificates":
        const limit = Number.parseInt(searchParams.get("limit") || "100")
        const status = searchParams.get("status")
        let certificates = mockDatabase.certificates

        if (status) {
          certificates = certificates.filter((c) => c.status === status)
        }

        return NextResponse.json({
          certificates: certificates.slice(0, limit),
          count: certificates.length,
        })

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }
  } catch (error) {
    console.error("Database API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { action, data } = await request.json()

    switch (action) {
      case "store_certificate":
        // Mock certificate storage
        const newCertificate = {
          id: Date.now().toString(),
          hash: data.hash,
          extractedData: data.extractedData,
          uploadDate: new Date().toISOString().split("T")[0],
          status: data.confidence > 80 ? "verified" : "pending",
          confidence: data.confidence,
        }

        mockDatabase.certificates.unshift(newCertificate)

        return NextResponse.json({
          success: true,
          documentId: newCertificate.id,
          hash: data.hash,
          message: "Certificate stored successfully",
        })

      case "verify_hash":
        const certificate = mockDatabase.certificates.find((c) => c.hash === data.hash)

        if (certificate) {
          return NextResponse.json({
            verified: true,
            certificateData: certificate.extractedData,
            hash: data.hash,
          })
        } else {
          return NextResponse.json({
            verified: false,
            hash: data.hash,
            message: "Certificate not found in database",
          })
        }

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }
  } catch (error) {
    console.error("Database API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
