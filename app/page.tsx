"use client"

import { useState, useEffect, useCallback, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ThemeToggle } from "@/components/theme-toggle"
import AuthForms from "@/components/auth-forms"
import { useAuth } from "@/components/auth-provider"
import {
  Github,
  Star,
  TrendingUp,
  Zap,
  Shield,
  FileText,
  GitBranch,
  CheckCircle,
  ArrowRight,
  AlertCircle,
  X,
  RefreshCw,
} from "lucide-react"

// Separate component for search params logic to avoid hydration issues
function SearchParamsHandler({ onError }: { onError: (error: string) => void }) {
  const searchParams = useSearchParams()

  useEffect(() => {
    const oauthError = searchParams.get("oauth_error")
    if (oauthError) {
      onError(`OAuth Error: ${decodeURIComponent(oauthError)}`)
      console.error("OAuth Error from URL:", oauthError)
    }
  }, [searchParams, onError])

  return null
}

function HomePageContent() {
  const { user, loading } = useAuth()
  const [showAuthForms, setShowAuthForms] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [debugInfo, setDebugInfo] = useState<any>(null)
  const [isRedirecting, setIsRedirecting] = useState(false)

  // Redirect to dashboard if user is already authenticated
  useEffect(() => {
    if (user && !loading) {
      setIsRedirecting(true)
      // Use a small delay to ensure auth state is stable
      const timer = setTimeout(() => {
        window.location.href = '/dashboard'
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [user, loading])

  // Show loading state while auth is loading or redirecting
  if (loading || isRedirecting) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">
            {isRedirecting ? 'Redirecting to dashboard...' : 'Loading...'}
          </p>
        </div>
      </div>
    )
  }

  const initializeDebugInfo = useCallback(() => {
    if (typeof window !== "undefined") {
      return {
        currentUrl: window.location.href,
        origin: window.location.origin,
        clientId: process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString(),
      }
    }
    return null
  }, [])

  useEffect(() => {
    if (!debugInfo) {
      setDebugInfo(initializeDebugInfo())
    }
  }, [debugInfo, initializeDebugInfo])

  const handleError = useCallback((errorMessage: string) => {
    setError(errorMessage)
  }, [])



  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Error Alert */}
      {error && (
        <div className="fixed top-4 right-4 z-50 max-w-md">
          <Alert className="bg-destructive/20 border-destructive text-destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="pr-8">{error}</AlertDescription>
            <button
              onClick={() => setError(null)}
              className="absolute top-2 right-2 text-destructive hover:text-destructive/80"
            >
              <X className="h-4 w-4" />
            </button>
          </Alert>
        </div>
      )}

      {/* Auth Forms Modal */}
      {showAuthForms && (
        <AuthForms onClose={() => setShowAuthForms(false)} />
      )}

      {/* Navigation */}
      <nav className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Github className="h-8 w-8" />
            <span className="text-xl font-bold">NeatRepo</span>
            <Badge variant="secondary" className="bg-secondary text-secondary-foreground">
              Production Ready
            </Badge>
          </div>
          <div className="flex items-center space-x-4">
            <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors">
              Features
            </a>
            <a href="#demo" className="text-muted-foreground hover:text-foreground transition-colors">
              Demo
            </a>
            <ThemeToggle />
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                onClick={() => setShowAuthForms(true)}
                className="text-muted-foreground hover:text-foreground"
              >
                Sign In
              </Button>
              <Button
                onClick={() => setShowAuthForms(true)}
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                Sign Up
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <Github className="h-16 w-16 mx-auto mb-6" />
          </div>

          <h1 className="text-5xl md:text-7xl font-bold mb-6">Professional GitHub Repository Management</h1>

          <p className="text-xl md:text-2xl text-muted-foreground mb-4">
            Organize, create, rename, and delete repositories with lightning-fast bulk operations
          </p>

          <p className="text-lg text-muted-foreground mb-12">We're here to help.</p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button
              size="lg"
              onClick={() => setShowAuthForms(true)}
              className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-4 text-lg font-semibold"
            >
              <Github className="h-5 w-5 mr-2" />
              Get Started
            </Button>
            <Button size="lg" variant="outline" className="px-8 py-4 text-lg bg-transparent">
              Watch Demo
              <ArrowRight className="h-5 w-5 ml-2" />
            </Button>
          </div>



          {/* Social Proof */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-2xl mx-auto">
            <div className="text-center">
              <div className="text-2xl font-bold">1,247</div>
              <div className="text-muted-foreground">developers hired</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">5,000+</div>
              <div className="text-muted-foreground">repos cleaned</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">94%</div>
              <div className="text-muted-foreground">job success rate</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="container mx-auto px-4 py-20 bg-accent/20">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4">Features GitHub doesn't offer</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Professional repository management tools for developers who care about organization
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          <Card>
            <CardHeader>
              <Zap className="h-8 w-8 mb-2" />
              <CardTitle>Lightning-Fast Bulk Operations</CardTitle>
              <CardDescription>
                Delete multiple repositories at once - a feature GitHub doesn't offer natively
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <FileText className="h-8 w-8 mb-2" />
              <CardTitle>Smart README Generation</CardTitle>
              <CardDescription>
                Automatically generate professional README files that showcase your projects effectively
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <GitBranch className="h-8 w-8 mb-2" />
              <CardTitle>Visual Repository Organization</CardTitle>
              <CardDescription>
                Drag & drop reordering and professional presentation - GitHub only has alphabetical sorting
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Shield className="h-8 w-8 mb-2" />
              <CardTitle>Security Scanning</CardTitle>
              <CardDescription>Identify and fix security vulnerabilities before they become a problem</CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <TrendingUp className="h-8 w-8 mb-2" />
              <CardTitle>Portfolio Scoring</CardTitle>
              <CardDescription>
                Get a comprehensive score for each repository and track your improvement over time
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <CheckCircle className="h-8 w-8 mb-2" />
              <CardTitle>Complete Repository Management</CardTitle>
              <CardDescription>
                Create, rename, and manage repositories without switching to GitHub - all in one place
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* Testimonials */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4">Loved by developers worldwide</h2>
          <p className="text-xl text-muted-foreground">See what our users have to say</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center mb-4">
                <div className="flex text-yellow-500">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-current" />
                  ))}
                </div>
              </div>
              <p className="text-muted-foreground mb-4">
                "NeatRepo helped me organize my GitHub perfectly! The bulk operations saved me hours of work."
              </p>
              <div className="flex items-center">
                <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-semibold">
                  S
                </div>
                <div className="ml-3">
                  <div className="font-semibold">Sarah Chen</div>
                  <div className="text-sm text-muted-foreground">Frontend Developer</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center mb-4">
                <div className="flex text-yellow-500">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-current" />
                  ))}
                </div>
              </div>
              <p className="text-muted-foreground mb-4">
                "Finally! Bulk delete saved me hours of cleaning up old repositories. NeatRepo is a game-changer!"
              </p>
              <div className="flex items-center">
                <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-semibold">
                  M
                </div>
                <div className="ml-3">
                  <div className="font-semibold">Marcus Johnson</div>
                  <div className="text-sm text-muted-foreground">Full Stack Developer</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center mb-4">
                <div className="flex text-yellow-500">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-current" />
                  ))}
                </div>
              </div>
              <p className="text-muted-foreground mb-4">
                "The drag & drop organization is so intuitive. My GitHub looks professional now!"
              </p>
              <div className="flex items-center">
                <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-semibold">
                  A
                </div>
                <div className="ml-3">
                  <div className="font-semibold">Alex Rivera</div>
                  <div className="text-sm text-muted-foreground">Backend Developer</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Final CTA */}
      <section className="container mx-auto px-4 py-20 bg-accent/20">
        <div className="text-center max-w-3xl mx-auto">
          <h2 className="text-4xl font-bold mb-6">Ready to organize your repositories?</h2>
          <p className="text-xl text-muted-foreground mb-8">
            Join developers who use NeatRepo for professional GitHub repository management
          </p>
          <Button
            size="lg"
            onClick={() => setShowAuthForms(true)}
            className="bg-primary hover:bg-primary/90 text-primary-foreground px-12 py-4 text-xl font-semibold"
          >
            <Github className="h-6 w-6 mr-3" />
            Start Free Today
          </Button>
        </div>
      </section>

      {/* Search Params Handler */}
      <Suspense fallback={null}>
        <SearchParamsHandler onError={handleError} />
      </Suspense>

      {/* Footer */}
      <footer className="border-t border-border bg-card">
        <div className="container mx-auto px-4 py-12">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Github className="h-6 w-6" />
                <span className="text-lg font-bold">NeatRepo</span>
              </div>
              <p className="text-muted-foreground">
                Professional GitHub repository management with lightning-fast bulk operations.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-muted-foreground">
                <li>
                  <a href="#features" className="hover:text-foreground transition-colors">
                    Features
                  </a>
                </li>
                <li>
                  <a href="#demo" className="hover:text-foreground transition-colors">
                    Demo
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    API
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    Integrations
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-muted-foreground">
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    About
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    Blog
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    Careers
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    Contact
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-muted-foreground">
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    Help Center
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    Documentation
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    Status
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    Privacy
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-border mt-8 pt-8 text-center text-muted-foreground">
            <p>&copy; 2025 NeatRepo. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default function HomePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    }>
      <HomePageContent />
    </Suspense>
  )
}
