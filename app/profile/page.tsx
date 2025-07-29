"use client"

// Force dynamic rendering to avoid static generation issues with auth
export const dynamic = 'force-dynamic'

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth-provider';
import TokenManagement from '@/components/token-management';
import { ThemeToggle } from '@/components/theme-toggle';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
// import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  ArrowLeft, 
  User, 
  Settings, 
  Shield, 
  LogOut, 
  Github,
  Mail,
  Calendar,
  CheckCircle,
  AlertTriangle,
  Key
} from 'lucide-react';


export default function ProfilePage() {
  const router = useRouter();
  const { user, profile, loading, signOut, updateToken, deleteToken } = useAuth();
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateMessage, setUpdateMessage] = useState('');

  const handleTokenUpdate = async (token: string) => {
    if (!user) return;
    
    setIsUpdating(true);
    try {
      await updateToken(token);
      
      setUpdateMessage('✅ GitHub token updated successfully!');
      setTimeout(() => setUpdateMessage(''), 3000);
    } catch (error) {
      console.error('Error updating token:', error);
      setUpdateMessage('❌ Failed to update token. Please try again.');
      setTimeout(() => setUpdateMessage(''), 3000);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleTokenDelete = async () => {
    if (!user) return;
    
    setIsUpdating(true);
    try {
      await deleteToken();
      
      setUpdateMessage('✅ GitHub token deleted successfully!');
      setTimeout(() => setUpdateMessage(''), 3000);
    } catch (error) {
      console.error('Error deleting token:', error);
      setUpdateMessage('❌ Failed to delete token. Please try again.');
      setTimeout(() => setUpdateMessage(''), 3000);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  // Show loading while auth or profile is initializing
  if (loading || (user && !profile)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Loading...</h1>
          <p className="text-muted-foreground mb-4">Initializing your profile...</p>
        </div>
      </div>
    );
  }

  // If still no user after loading, show message (no automatic redirect)
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Not Authenticated</h1>
          <p className="text-muted-foreground mb-4">Please sign in to view your profile.</p>
          <p className="text-muted-foreground">Navigate manually to the homepage to sign in.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => router.push('/dashboard')}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
              <div className="flex items-center gap-2">
                <User className="h-5 w-5" />
                <h1 className="text-xl font-semibold">Profile Settings</h1>
              </div>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Update Message */}
        {updateMessage && (
          <Alert className="mb-6">
            <AlertDescription>{updateMessage}</AlertDescription>
          </Alert>
        )}

        <div className="grid gap-6">
          {/* Profile Information */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <User className="h-5 w-5" />
                <CardTitle>Profile Information</CardTitle>
              </div>
              <CardDescription>
                Your account information from GitHub
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage 
                    src={user.user_metadata?.avatar_url} 
                    alt={user.user_metadata?.name || 'User'} 
                  />
                  <AvatarFallback>
                    {user.user_metadata?.name?.[0] || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-lg font-semibold">
                    {user.user_metadata?.full_name || user.user_metadata?.name || 'Unknown User'}
                  </h3>
                  <p className="text-muted-foreground">
                    @{user.user_metadata?.user_name || 'unknown'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium">Email</label>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      value={user.email || 'Not provided'}
                      disabled
                      className="bg-muted"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="github" className="text-sm font-medium">GitHub Username</label>
                  <div className="flex items-center gap-2">
                    <Github className="h-4 w-4 text-muted-foreground" />
                    <Input
                      id="github"
                      value={user.user_metadata?.user_name || 'Not connected'}
                      disabled
                      className="bg-muted"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="joined" className="text-sm font-medium">Member Since</label>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <Input
                    id="joined"
                    value={new Date(user.created_at).toLocaleDateString()}
                    disabled
                    className="bg-muted"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* GitHub Token Management */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                <CardTitle>GitHub Access Token</CardTitle>
              </div>
              <CardDescription>
                Manage your GitHub Personal Access Token for repository operations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TokenManagement
                currentToken={profile?.github_pat_token}
                onTokenUpdate={handleTokenUpdate}
                onTokenDelete={handleTokenDelete}
              />
            </CardContent>
          </Card>

          {/* Account Security */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                <CardTitle>Account Security</CardTitle>
              </div>
              <CardDescription>
                Manage your account security settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <div>
                    <p className="font-medium">GitHub OAuth</p>
                    <p className="text-sm text-muted-foreground">
                      Connected via GitHub OAuth
                    </p>
                  </div>
                </div>
                <Badge variant="secondary">Active</Badge>
              </div>

              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Password Management:</strong> Your account is managed through GitHub OAuth. 
                  To change your password, please update it in your GitHub account settings.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          {/* Danger Zone */}
          <Card className="border-red-200 dark:border-red-800">
            <CardHeader>
              <CardTitle className="text-red-600 dark:text-red-400">Danger Zone</CardTitle>
              <CardDescription>
                Irreversible and destructive actions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between p-4 border border-red-200 dark:border-red-800 rounded-lg">
                <div>
                  <p className="font-medium">Sign Out</p>
                  <p className="text-sm text-muted-foreground">
                    Sign out of your account on this device
                  </p>
                </div>
                <Button 
                  variant="destructive" 
                  onClick={handleSignOut}
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
