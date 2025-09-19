"use client"

import { useRouter } from "next/navigation"

import type React from "react"

import { useState } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Upload,
  FileText,
  Shield,
  LogOut,
  CheckCircle,
  XCircle,
  Search,
  Download,
  Eye,
  Hash,
  User,
  GraduationCap,
  Award,
  Building,
} from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/components/auth-provider"
import { AuthGuard } from "@/components/auth-guard"

interface VerificationResult {
  id: string
  fileName: string
  verificationDate: string
  status: "verified" | "invalid" | "processing"
  extractedData?: {
    name: string
    rollNo: string
    certificateId: string
    marks: string
    institution: string
  }
  hash?: string
  confidence: number
}

export default function VerifyPage() {
  const { user, logout } = useAuth()
  const router = useRouter()
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isUploading, setIsUploading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [currentResult, setCurrentResult] = useState<VerificationResult | null>(null)
  const [verificationHistory, setVerificationHistory] = useState<VerificationResult[]>([
    {
      id: "1",
      fileName: "my_degree.pdf",
      verificationDate: "2024-01-15",
      status: "verified",
      extractedData: {
        name: "Jane Doe",
        rollNo: "CS2020001",
        certificateId: "CERT-2023-001",
        marks: "92%",
        institution: "Tech University",
      },
      hash: "b2c3d4e5f6a7...",
      confidence: 98.5,
    },
    {
      id: "2",
      fileName: "transcript.jpg",
      verificationDate: "2024-01-10",
      status: "invalid",
      confidence: 45.2,
    },
  ])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
    }
  }

  const handleVerification = async () => {
    if (!selectedFile) return

    setIsUploading(true)
    setUploadProgress(0)
    setCurrentResult(null)

    // Simulate verification progress
    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval)
          setIsUploading(false)

          // Mock verification result
          const mockResult: VerificationResult = {
            id: Date.now().toString(),
            fileName: selectedFile.name,
            verificationDate: new Date().toISOString().split("T")[0],
            status: Math.random() > 0.3 ? "verified" : "invalid",
            extractedData:
              Math.random() > 0.3
                ? {
                    name: "John Smith",
                    rollNo: "EE2021005",
                    certificateId: "CERT-2024-" + Math.floor(Math.random() * 1000),
                    marks: Math.floor(Math.random() * 40 + 60) + "%",
                    institution: "Engineering College",
                  }
                : undefined,
            hash: "c4d5e6f7a8b9...",
            confidence: Math.floor(Math.random() * 40 + 60),
          }

          setCurrentResult(mockResult)
          setVerificationHistory((prev) => [mockResult, ...prev])
          setSelectedFile(null)

          return 100
        }
        return prev + 8
      })
    }, 150)
  }

  const handleSearchVerification = () => {
    // Mock search functionality
    if (searchQuery.trim()) {
      const mockResult: VerificationResult = {
        id: "search-" + Date.now(),
        fileName: "searched_certificate.pdf",
        verificationDate: "2024-01-12",
        status: "verified",
        extractedData: {
          name: "Alice Johnson",
          rollNo: "ME2019003",
          certificateId: searchQuery.toUpperCase(),
          marks: "88%",
          institution: "Mechanical Engineering Institute",
        },
        hash: "d5e6f7a8b9c0...",
        confidence: 94.7,
      }
      setCurrentResult(mockResult)
    }
  }

  const getStatusIcon = (status: VerificationResult["status"]) => {
    switch (status) {
      case "verified":
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case "invalid":
        return <XCircle className="h-5 w-5 text-red-500" />
      case "processing":
        return <div className="h-5 w-5 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin" />
    }
  }

  const getStatusBadge = (status: VerificationResult["status"]) => {
    const variants = {
      verified: "default",
      invalid: "destructive",
      processing: "secondary",
    } as const

    return (
      <Badge variant={variants[status]} className="capitalize">
        {status}
      </Badge>
    )
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 90) return "text-green-600"
    if (confidence >= 70) return "text-yellow-600"
    return "text-red-600"
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <motion.header
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="bg-primary text-primary-foreground shadow-lg"
        >
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Shield className="h-8 w-8" />
              <div>
                <h1 className="text-xl font-bold">Document Verification</h1>
                <p className="text-sm opacity-80">Welcome, {user?.name}</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/" className="hover:text-accent transition-colors">
                Home
              </Link>
              {user?.role === "admin" && (
                <Link href="/admin" className="hover:text-accent transition-colors">
                  Admin
                </Link>
              )}
              <Button variant="secondary" size="sm" onClick={logout}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </motion.header>

        <div className="container mx-auto px-4 py-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Tabs defaultValue="verify" className="space-y-6">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="verify">Verify Document</TabsTrigger>
                <TabsTrigger value="search">Search by ID</TabsTrigger>
                <TabsTrigger value="history">Verification History</TabsTrigger>
              </TabsList>

              <TabsContent value="verify" className="space-y-6">
                {/* Upload Section */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Upload className="h-5 w-5 mr-2" />
                      Upload Document for Verification
                    </CardTitle>
                    <CardDescription>
                      Upload your document to verify its authenticity using our advanced OCR system
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="certificate-file">Select Document File</Label>
                      <Input
                        id="certificate-file"
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={handleFileSelect}
                        disabled={isUploading}
                      />
                      <p className="text-sm text-muted-foreground">Supported formats: PDF, JPG, PNG (Max size: 10MB)</p>
                    </div>

                    {selectedFile && (
                      <Card className="bg-muted/30">
                        <CardContent className="pt-4">
                          <div className="flex items-center space-x-3">
                            <FileText className="h-8 w-8 text-primary" />
                            <div className="flex-1">
                              <p className="font-medium">{selectedFile.name}</p>
                              <p className="text-sm text-muted-foreground">
                                {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {isUploading && (
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Processing document...</span>
                          <span>{uploadProgress}%</span>
                        </div>
                        <Progress value={uploadProgress} />
                        <p className="text-xs text-muted-foreground">
                          Running OCR analysis and extracting document data...
                        </p>
                      </div>
                    )}

                    <Button onClick={handleVerification} disabled={!selectedFile || isUploading} className="w-full">
                      {isUploading ? "Verifying..." : "Verify Document"}
                    </Button>
                  </CardContent>
                </Card>

                {/* Verification Result */}
                {currentResult && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                  >
                    <Card
                      className={`border-2 ${
                        currentResult.status === "verified"
                          ? "border-green-200 bg-green-50/50"
                          : "border-red-200 bg-red-50/50"
                      }`}
                    >
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="flex items-center">
                            {getStatusIcon(currentResult.status)}
                            <span className="ml-2">Verification Result</span>
                          </CardTitle>
                          {getStatusBadge(currentResult.status)}
                        </div>
                        <CardDescription>
                          Document: {currentResult.fileName} • Verified on {currentResult.verificationDate}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex items-center justify-between p-3 bg-background rounded-lg">
                          <span className="font-medium">Confidence Score:</span>
                          <span className={`font-bold text-lg ${getConfidenceColor(currentResult.confidence)}`}>
                            {currentResult.confidence}%
                          </span>
                        </div>

                        {currentResult.extractedData && (
                          <div className="space-y-4">
                            <h4 className="font-semibold text-lg">Extracted Document Data</h4>
                            <div className="grid md:grid-cols-2 gap-4">
                              <div className="flex items-center space-x-3 p-3 bg-background rounded-lg">
                                <User className="h-5 w-5 text-primary" />
                                <div>
                                  <p className="text-sm text-muted-foreground">Student Name</p>
                                  <p className="font-medium">{currentResult.extractedData.name}</p>
                                </div>
                              </div>
                              <div className="flex items-center space-x-3 p-3 bg-background rounded-lg">
                                <Hash className="h-5 w-5 text-primary" />
                                <div>
                                  <p className="text-sm text-muted-foreground">Roll Number</p>
                                  <p className="font-medium">{currentResult.extractedData.rollNo}</p>
                                </div>
                              </div>
                              <div className="flex items-center space-x-3 p-3 bg-background rounded-lg">
                                <Award className="h-5 w-5 text-primary" />
                                <div>
                                  <p className="text-sm text-muted-foreground">Document ID</p>
                                  <p className="font-medium">{currentResult.extractedData.certificateId}</p>
                                </div>
                              </div>
                              <div className="flex items-center space-x-3 p-3 bg-background rounded-lg">
                                <GraduationCap className="h-5 w-5 text-primary" />
                                <div>
                                  <p className="text-sm text-muted-foreground">Marks/Grade</p>
                                  <p className="font-medium">{currentResult.extractedData.marks}</p>
                                </div>
                              </div>
                              <div className="flex items-center space-x-3 p-3 bg-background rounded-lg md:col-span-2">
                                <Building className="h-5 w-5 text-primary" />
                                <div>
                                  <p className="text-sm text-muted-foreground">Institution</p>
                                  <p className="font-medium">{currentResult.extractedData.institution}</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {currentResult.hash && (
                          <div className="p-3 bg-background rounded-lg">
                            <p className="text-sm text-muted-foreground mb-1">Blockchain Hash (SHA-256)</p>
                            <p className="font-mono text-xs break-all">{currentResult.hash}</p>
                          </div>
                        )}

                        <div className="flex space-x-2">
                          <Button variant="outline" size="sm">
                            <Download className="h-4 w-4 mr-2" />
                            Download Report
                          </Button>
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}
              </TabsContent>

              <TabsContent value="search" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Search className="h-5 w-5 mr-2" />
                      Search by Document ID
                    </CardTitle>
                    <CardDescription>Enter a document ID to verify if it exists in our database</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="search-id">Document ID</Label>
                      <Input
                        id="search-id"
                        placeholder="Enter document ID (e.g., CERT-2024-001)"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>
                    <Button onClick={handleSearchVerification} className="w-full">
                      Search Document
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="history" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Verification History</CardTitle>
                    <CardDescription>Your recent document verifications</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {verificationHistory.map((result) => (
                        <div key={result.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex items-center space-x-4">
                            <FileText className="h-8 w-8 text-primary" />
                            <div>
                              <div className="flex items-center space-x-2 mb-1">
                                <p className="font-medium">{result.fileName}</p>
                                {getStatusIcon(result.status)}
                                {getStatusBadge(result.status)}
                              </div>
                              <p className="text-sm text-muted-foreground">
                                Verified on {result.verificationDate} • Confidence: {result.confidence}%
                              </p>
                            </div>
                          </div>
                          <Button variant="outline" size="sm">
                            View Details
                          </Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </motion.div>
        </div>
      </div>
    </AuthGuard>
  )
}
