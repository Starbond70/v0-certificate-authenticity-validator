export interface ExtractedData {
  name: string
  rollNo: string
  certificateId: string
  marks: string
  institution: string
}

export interface OCRResult {
  filename: string
  success: boolean
  extractedData: ExtractedData
  hash: string
  confidence: number
  processingInfo: {
    tesseractConfidence: number
    layoutConfidence: number
    enhancedExtraction: boolean
  }
  timestamp: string
}

export class OCRClient {
  private baseUrl: string

  constructor(baseUrl = "/api") {
    this.baseUrl = baseUrl
  }

  async processCertificate(file: File): Promise<OCRResult> {
    const formData = new FormData()
    formData.append("file", file)

    const response = await fetch(`${this.baseUrl}/ocr`, {
      method: "POST",
      body: formData,
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || "OCR processing failed")
    }

    return response.json()
  }

  async verifyHash(hash: string): Promise<{ hash: string; verified: boolean; timestamp: string }> {
    const response = await fetch(`${this.baseUrl}/verify-hash`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ hash }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || "Hash verification failed")
    }

    return response.json()
  }
}

export const ocrClient = new OCRClient()
