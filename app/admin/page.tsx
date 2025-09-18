"use client"

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
import { Upload, FileText, Shield, LogOut, Eye, Download, CheckCircle, Clock, AlertCircle, Search } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/components/auth-provider"
import { useRouter } from "next/navigation"

interface Certificate {
  id: string
  fileName: string
  uploadDate: string
  status: "processing" | "completed" | "failed"
  extractedData?: {
    name: string
    rollNo: string
    certificateId: string
    marks: string
    institution: string
  }
  hash?: string
}

export default function AdminDashboard() {
  const { user, logout } = useAuth()
  const router = useRouter()
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isUploading, setIsUploading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [certificates, setCertificates] = useState<Certificate[]>([
    {
      id: "1",
      fileName: "degree_certificate_001.pdf",
      uploadDate: "2024-01-15",
      status: "completed",
      extractedData: {
        name: "John Smith",
        rollNo: "CS2021001",
        certificateId: "CERT-2024-001",
        marks: "85%",
        institution: "University of Technology",
      },
      hash: "a1b2c3d4e5f6...",
    },
    {
      id: "2",
      fileName: "diploma_certificate_002.jpg",
      uploadDate: "2024-01-14",
      status: "processing",
    },
    {
      id: "3",
      fileName: "transcript_003.pdf",
      uploadDate: "2024-01-13",
      status: "failed",
    },
  ])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
    }
  }

  const handleUpload = async () => {
    if (!selectedFile) return

    setIsUploading(true)
    setUploadProgress(0)

    // Simulate upload progress
    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval)
          setIsUploading(false)

          // Add new certificate to list
          const newCert: Certificate = {
            id: Date.now().toString(),
            fileName: selectedFile.name,
            uploadDate: new Date().toISOString().split("T")[0],
            status: "processing",
          }
          setCertificates((prev) => [newCert, ...prev])
          setSelectedFile(null)

          return 100
        }
        return prev + 10
      })
    }, 200)
  }

  const getStatusIcon = (status: Certificate["status"]) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "processing":
        return <Clock className="h-4 w-4 text-yellow-500" />
      case "failed":
        return <AlertCircle className="h-4 w-4 text-red-500" />
    }
  }

  const getStatusBadge = (status: Certificate["status"]) => {
    const variants = {
      completed: "default",
      processing: "secondary",
      failed: "destructive",
    } as const

    return (
      <Badge variant={variants[status]} className="capitalize">
        {status}
      </Badge>
    )
  }

  if (!user || user.role !== "admin") {
    router.push("/auth")
    return null
  }

  return (
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
              <h1 className="text-xl font-bold">EasyAuth Admin</h1>
              <p className="text-sm opacity-80">Welcome, {user.name}</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <Link href="/" className="hover:text-accent transition-colors">
              Home
            </Link>
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
          <Tabs defaultValue="upload" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="upload">Upload Document</TabsTrigger>
              <TabsTrigger value="manage">Manage Documents</TabsTrigger>
            </TabsList>

            <TabsContent value="upload" className="space-y-6">
              {/* Upload Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Upload className="h-5 w-5 mr-2" />
                    Upload New Document
                  </CardTitle>
                  <CardDescription>Upload PDF or image files for OCR processing and verification</CardDescription>
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
                        <span>Uploading...</span>
                        <span>{uploadProgress}%</span>
                      </div>
                      <Progress value={uploadProgress} />
                    </div>
                  )}

                  <Button onClick={handleUpload} disabled={!selectedFile || isUploading} className="w-full">
                    {isUploading ? "Processing..." : "Upload & Process Document"}
                  </Button>
                </CardContent>
              </Card>

              {/* Processing Info */}
              <Card>
                <CardHeader>
                  <CardTitle>Processing Pipeline</CardTitle>
                  <CardDescription>How your documents are processed</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="text-center p-4 border rounded-lg">
                      <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                        <span className="text-primary font-bold">1</span>
                      </div>
                      <h4 className="font-medium mb-2">Image Preprocessing</h4>
                      <p className="text-sm text-muted-foreground">OpenCV cleans and optimizes the image</p>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                        <span className="text-primary font-bold">2</span>
                      </div>
                      <h4 className="font-medium mb-2">OCR Extraction</h4>
                      <p className="text-sm text-muted-foreground">Tesseract + LayoutLMv3 extract text fields</p>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                        <span className="text-primary font-bold">3</span>
                      </div>
                      <h4 className="font-medium mb-2">Secure Storage</h4>
                      <p className="text-sm text-muted-foreground">Data stored with SHA-256 hash in MongoDB</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="manage" className="space-y-6">
              {/* Search and Filters */}
              <Card>
                <CardContent className="pt-6">
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input placeholder="Search documents..." className="pl-10" />
                    </div>
                    <Button variant="outline">Filter by Status</Button>
                  </div>
                </CardContent>
              </Card>

              {/* Certificates List */}
              <div className="space-y-4">
                {certificates.map((cert) => (
                  <motion.div
                    key={cert.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Card>
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-4 flex-1">
                            <FileText className="h-8 w-8 text-primary mt-1" />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center space-x-2 mb-2">
                                <h3 className="font-medium truncate">{cert.fileName}</h3>
                                {getStatusIcon(cert.status)}
                                {getStatusBadge(cert.status)}
                              </div>
                              <p className="text-sm text-muted-foreground mb-3">Uploaded on {cert.uploadDate}</p>

                              {cert.extractedData && (
                                <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-sm">
                                  <div>
                                    <span className="font-medium">Name:</span>
                                    <p className="text-muted-foreground">{cert.extractedData.name}</p>
                                  </div>
                                  <div>
                                    <span className="font-medium">Roll No:</span>
                                    <p className="text-muted-foreground">{cert.extractedData.rollNo}</p>
                                  </div>
                                  <div>
                                    <span className="font-medium">Cert ID:</span>
                                    <p className="text-muted-foreground">{cert.extractedData.certificateId}</p>
                                  </div>
                                  <div>
                                    <span className="font-medium">Marks:</span>
                                    <p className="text-muted-foreground">{cert.extractedData.marks}</p>
                                  </div>
                                  <div>
                                    <span className="font-medium">Institution:</span>
                                    <p className="text-muted-foreground">{cert.extractedData.institution}</p>
                                  </div>
                                </div>
                              )}

                              {cert.hash && (
                                <div className="mt-2">
                                  <span className="text-xs font-medium">Hash:</span>
                                  <p className="text-xs text-muted-foreground font-mono">{cert.hash}</p>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center space-x-2 ml-4">
                            <Button size="sm" variant="outline">
                              <Eye className="h-4 w-4 mr-1" />
                              View
                            </Button>
                            {cert.status === "completed" && (
                              <Button size="sm" variant="outline">
                                <Download className="h-4 w-4 mr-1" />
                                Export
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </div>
  )
}
