import { type NextRequest, NextResponse } from "next/server"

// Mock OCR processing function
async function processWithOCR(file: File) {
  // Simulate processing time
  await new Promise((resolve) => setTimeout(resolve, 2000))

  // Mock extracted data based on filename patterns
  const fileName = file.name.toLowerCase()

  const mockData = {
    name: fileName.includes("john") ? "John Smith" : fileName.includes("jane") ? "Jane Doe" : "Alice Johnson",
    rollNo: `${Math.random() > 0.5 ? "CS" : "EE"}${2020 + Math.floor(Math.random() * 4)}${String(Math.floor(Math.random() * 999)).padStart(3, "0")}`,
    certificateId: `CERT-2024-${String(Math.floor(Math.random() * 999)).padStart(3, "0")}`,
    marks: `${Math.floor(Math.random() * 40 + 60)}%`,
    institution: Math.random() > 0.5 ? "Tech University" : "Engineering College",
  }

  // Generate mock hash
  const hash = Array.from({ length: 16 }, () => Math.floor(Math.random() * 16).toString(16)).join("")

  return {
    success: true,
    extractedData: mockData,
    hash: hash + "...",
    confidence: Math.floor(Math.random() * 30 + 70),
    processingInfo: {
      tesseractConfidence: Math.floor(Math.random() * 20 + 75),
      layoutConfidence: Math.floor(Math.random() * 20 + 80),
      enhancedExtraction: true,
    },
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "application/pdf"]
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: "Unsupported file type" }, { status: 400 })
    }

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "File too large (max 10MB)" }, { status: 400 })
    }

    // Process the file with OCR
    const result = await processWithOCR(file)

    return NextResponse.json({
      filename: file.name,
      ...result,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("OCR processing error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
