"use client"

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Github, CheckCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

export default function SignoutPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [countdown, setCountdown] = useState(3);
  
  // Get user info from URL parameters
  const username = searchParams.get('username') || 'User';
  const email = searchParams.get('email') || '';
  const avatar = searchParams.get('avatar') || '';

  useEffect(() => {
    // Countdown timer
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          // Redirect to landing page
          router.push('/');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [router]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <Github className="h-8 w-8 text-primary" />
            <div className="flex flex-col">
              <span className="text-xl font-bold">NeatRepo</span>
              <Badge variant="outline" className="text-xs">
                Multi-Account
              </Badge>
            </div>
          </div>
          <h1 className="text-2xl font-bold">Account signed out</h1>
          <p className="text-muted-foreground">
            You have been successfully signed out
          </p>
        </div>

        {/* Signed out account card */}
        <Card className="border-2">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              {/* Avatar */}
              <div className="relative">
                {avatar ? (
                  <img 
                    src={avatar} 
                    alt={username}
                    className="w-12 h-12 rounded-full"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                    <Github className="h-6 w-6 text-muted-foreground" />
                  </div>
                )}
                {/* Signed out badge */}
                <div className="absolute -top-1 -right-1">
                  <Badge variant="secondary" className="text-xs px-2 py-1 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Signed out
                  </Badge>
                </div>
              </div>

              {/* Account info */}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{username}</p>
                {email && (
                  <p className="text-xs text-muted-foreground truncate">{email}</p>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  GitHub account
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Status message */}
        <div className="text-center space-y-3">
          <div className="flex items-center justify-center space-x-2">
            <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
            <span className="text-sm text-muted-foreground">
              Logging out...
            </span>
          </div>
          
          <p className="text-xs text-muted-foreground">
            Redirecting to homepage in {countdown} second{countdown !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Additional options */}
        <div className="text-center space-y-2">
          <button
            onClick={() => router.push('/')}
            className="text-sm text-primary hover:underline"
          >
            Go to homepage now
          </button>
          
          <div className="text-xs text-muted-foreground">
            Want to sign in with a different account?{' '}
            <button
              onClick={() => router.push('/')}
              className="text-primary hover:underline"
            >
              Sign in here
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
