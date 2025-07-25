'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Upload, Send, ArrowLeft, Bug, Camera, AlertCircle, Mail, Github } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useAuth } from '@/components/auth-provider'
import AuthForms from '@/components/auth-forms'

export default function BugReportPage() {
  const router = useRouter()
  const { user, loading } = useAuth()
  const [showAuthForms, setShowAuthForms] = useState(false)
  const [formData, setFormData] = useState({
    userEmail: '',
    bugTitle: '',
    bugDescription: '',
    stepsToReproduce: '',
    expectedBehavior: '',
    actualBehavior: '',
    browserInfo: '',
    additionalInfo: ''
  })
  const [screenshots, setScreenshots] = useState<File[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [authError, setAuthError] = useState<string | null>(null)

  // Auto-detect browser info and handle user email
  useEffect(() => {
    const browserInfo = `${navigator.userAgent} | Screen: ${screen.width}x${screen.height} | Viewport: ${window.innerWidth}x${window.innerHeight}`
    setFormData(prev => ({ ...prev, browserInfo }))
  }, [])

  // Handle user authentication and email detection
  useEffect(() => {
    if (user) {
      // Check if user has email (email login) or only OAuth
      if (user.email && !user.email.includes('github')) {
        // User logged in with email - use that email
        setFormData(prev => ({ ...prev, userEmail: user.email || '' }))
        setAuthError(null)
      } else {
        // User logged in with GitHub OAuth - need email login
        setAuthError('Please sign in with your email account to submit bug reports')
      }
    }
  }, [user])

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleScreenshotUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    setScreenshots(prev => [...prev, ...files].slice(0, 5)) // Max 5 screenshots
  }

  const removeScreenshot = (index: number) => {
    setScreenshots(prev => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setSubmitStatus('idle')

    try {
      const formDataToSend = new FormData()
      
      // Add form fields
      Object.entries(formData).forEach(([key, value]) => {
        formDataToSend.append(key, value)
      })
      
      // Add screenshots
      screenshots.forEach((file, index) => {
        formDataToSend.append(`screenshot_${index}`, file)
      })
      
      // Add timestamp and additional metadata
      formDataToSend.append('timestamp', new Date().toISOString())
      formDataToSend.append('url', window.location.href)
      formDataToSend.append('referrer', document.referrer)

      const response = await fetch('/api/bug-report', {
        method: 'POST',
        body: formDataToSend
      })

      if (response.ok) {
        setSubmitStatus('success')
        // Reset form after successful submission
        setTimeout(() => {
          router.push('/dashboard')
        }, 3000)
      } else {
        throw new Error('Failed to submit bug report')
      }
    } catch (error) {
      console.error('Error submitting bug report:', error)
      setSubmitStatus('error')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Show auth forms modal if needed
  if (showAuthForms) {
    return <AuthForms onClose={() => setShowAuthForms(false)} />
  }

  // Show OAuth user needs email login
  if (authError && user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Mail className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Email Account Required</h2>
            <p className="text-muted-foreground mb-4">
              To submit bug reports, please sign in with your email account instead of GitHub OAuth.
            </p>
            <div className="flex items-center justify-center gap-2 mb-4 text-sm text-muted-foreground">
              <Github className="w-4 h-4" />
              <span>Currently signed in with GitHub</span>
            </div>
            <div className="space-y-3">
              <Button
                onClick={() => setShowAuthForms(true)}
                className="w-full"
              >
                <Mail className="w-4 h-4 mr-2" />
                Sign In with Email
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push('/dashboard')}
                className="w-full"
              >
                Back to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (submitStatus === 'success') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Send className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Bug Report Sent!</h2>
            <p className="text-muted-foreground mb-4">
              Thank you for helping us improve NeatRepo. We'll review your report and get back to you if needed.
            </p>
            <p className="text-sm text-muted-foreground">
              Redirecting to dashboard in 3 seconds...
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 dark:bg-red-900/20 rounded-lg flex items-center justify-center">
              <Bug className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Report a Bug</h1>
              <p className="text-muted-foreground">Help us improve NeatRepo by reporting issues</p>
            </div>
          </div>
        </div>

        {submitStatus === 'error' && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Failed to submit bug report. Please try again or contact support directly.
            </AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Contact Information</CardTitle>
                  <CardDescription>
                    We'll use this to follow up if needed
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="userEmail">Your Email Address *</Label>
                    <Input
                      id="userEmail"
                      type="email"
                      placeholder="your.email@example.com"
                      value={formData.userEmail}
                      onChange={(e) => handleInputChange('userEmail', e.target.value)}
                      required
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Bug Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="bugTitle">Bug Title *</Label>
                    <Input
                      id="bugTitle"
                      placeholder="Brief description of the issue"
                      value={formData.bugTitle}
                      onChange={(e) => handleInputChange('bugTitle', e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="bugDescription">Detailed Description *</Label>
                    <Textarea
                      id="bugDescription"
                      placeholder="Describe what happened in detail..."
                      rows={4}
                      value={formData.bugDescription}
                      onChange={(e) => handleInputChange('bugDescription', e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="stepsToReproduce">Steps to Reproduce</Label>
                    <Textarea
                      id="stepsToReproduce"
                      placeholder="1. Go to...&#10;2. Click on...&#10;3. See error..."
                      rows={4}
                      value={formData.stepsToReproduce}
                      onChange={(e) => handleInputChange('stepsToReproduce', e.target.value)}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Camera className="w-5 h-5" />
                    Screenshots
                  </CardTitle>
                  <CardDescription>
                    Upload screenshots to help us understand the issue (max 5 files)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                      <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                      <Label htmlFor="screenshots" className="cursor-pointer">
                        <span className="text-sm font-medium">Click to upload screenshots</span>
                        <Input
                          id="screenshots"
                          type="file"
                          accept="image/*"
                          multiple
                          className="hidden"
                          onChange={handleScreenshotUpload}
                        />
                      </Label>
                      <p className="text-xs text-muted-foreground mt-1">
                        PNG, JPG, GIF up to 10MB each
                      </p>
                    </div>

                    {screenshots.length > 0 && (
                      <div className="space-y-2">
                        <Label>Uploaded Screenshots:</Label>
                        {screenshots.map((file, index) => (
                          <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                            <span className="text-sm truncate">{file.name}</span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeScreenshot(index)}
                            >
                              Remove
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Expected vs Actual Behavior</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="expectedBehavior">What should happen?</Label>
                    <Textarea
                      id="expectedBehavior"
                      placeholder="Describe the expected behavior..."
                      rows={3}
                      value={formData.expectedBehavior}
                      onChange={(e) => handleInputChange('expectedBehavior', e.target.value)}
                    />
                  </div>

                  <div>
                    <Label htmlFor="actualBehavior">What actually happened?</Label>
                    <Textarea
                      id="actualBehavior"
                      placeholder="Describe what actually happened..."
                      rows={3}
                      value={formData.actualBehavior}
                      onChange={(e) => handleInputChange('actualBehavior', e.target.value)}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Additional Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="additionalInfo">Any other details?</Label>
                    <Textarea
                      id="additionalInfo"
                      placeholder="Browser version, device type, frequency of issue, etc..."
                      rows={3}
                      value={formData.additionalInfo}
                      onChange={(e) => handleInputChange('additionalInfo', e.target.value)}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end pt-6">
            <Button
              type="submit"
              disabled={isSubmitting || !formData.userEmail || !formData.bugTitle || !formData.bugDescription}
              className="min-w-[150px]"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Send Bug Report
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
