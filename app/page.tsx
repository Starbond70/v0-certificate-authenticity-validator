"use client"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Shield, FileCheck, Users, Lock } from "lucide-react"
import Link from "next/link"

export default function HomePage() {
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
            <h1 className="text-xl font-bold">CertValidator</h1>
          </div>
          <nav className="flex items-center space-x-6">
            <Link href="/auth" className="hover:text-accent transition-colors">
              Login
            </Link>
            <Button variant="secondary" size="sm" asChild>
              <Link href="/auth">Get Started</Link>
            </Button>
          </nav>
        </div>
      </motion.header>

      {/* Hero Section */}
      <motion.section
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.2 }}
        className="py-20 px-4"
      >
        <div className="container mx-auto text-center">
          <h2 className="text-4xl md:text-6xl font-bold text-foreground mb-6 text-balance">
            Academic Certificate
            <span className="text-primary block">Authenticity Validator</span>
          </h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto text-pretty">
            Secure, reliable, and instant verification of academic credentials using advanced OCR technology and
            blockchain-ready hashing.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild>
              <Link href="/verify">Verify Certificate</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/admin">Admin Dashboard</Link>
            </Button>
          </div>
        </div>
      </motion.section>

      {/* Features Section */}
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.4 }}
        className="py-16 px-4 bg-muted/30"
      >
        <div className="container mx-auto">
          <h3 className="text-3xl font-bold text-center mb-12 text-foreground">Why Choose CertValidator?</h3>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="text-center">
              <CardHeader>
                <FileCheck className="h-12 w-12 text-primary mx-auto mb-4" />
                <CardTitle>Advanced OCR</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Powered by Tesseract OCR and LayoutLMv3 for accurate field extraction from certificates
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <Lock className="h-12 w-12 text-primary mx-auto mb-4" />
                <CardTitle>Secure Hashing</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  SHA-256 hashing ensures data integrity and prepares for future blockchain integration
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <Users className="h-12 w-12 text-primary mx-auto mb-4" />
                <CardTitle>Multi-Role Access</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Separate interfaces for administrators and verifiers with role-based permissions
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </motion.section>

      {/* Footer */}
      <footer className="bg-primary text-primary-foreground py-8 px-4">
        <div className="container mx-auto text-center">
          <p className="text-sm opacity-80">© 2024 CertValidator. Secure academic credential verification.</p>
        </div>
      </footer>
    </div>
  )
}
