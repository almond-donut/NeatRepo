'use client'

import { useState } from 'react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { AlertTriangle, Github, X, Trash2, Zap } from 'lucide-react'

interface GitHubTokenWarningProps {
  onSetupToken: () => void
}

export default function GitHubTokenWarning({ onSetupToken }: GitHubTokenWarningProps) {
  const [isDismissed, setIsDismissed] = useState(false)

  if (isDismissed) {
    return null
  }

  return (
    <Alert className="border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20 dark:border-yellow-800 mb-6">
      <AlertTriangle className="h-4 w-4 text-yellow-600" />
      <AlertDescription className="flex items-center justify-between w-full">
        <div className="flex-1 pr-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="font-medium text-yellow-800 dark:text-yellow-200">
              GitHub Token Not Configured
            </span>
            <Badge variant="outline" className="text-xs border-yellow-300 text-yellow-700">
              Limited Features
            </Badge>
          </div>
          
          <p className="text-sm text-yellow-700 dark:text-yellow-300 mb-3">
            Some features are disabled without a GitHub token. Set up your token to unlock:
          </p>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
            <div className="flex items-center gap-2 text-xs text-yellow-700 dark:text-yellow-300">
              <Trash2 className="w-3 h-3" />
              <span>Bulk Delete Repositories</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-yellow-700 dark:text-yellow-300">
              <Zap className="w-3 h-3" />
              <span>Advanced Repository Management</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-yellow-700 dark:text-yellow-300">
              <Github className="w-3 h-3" />
              <span>Private Repository Access</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-yellow-700 dark:text-yellow-300">
              <Zap className="w-3 h-3" />
              <span>Real-time Repository Sync</span>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button 
              onClick={onSetupToken}
              size="sm" 
              className="bg-yellow-600 hover:bg-yellow-700 text-white"
            >
              <Github className="w-3 h-3 mr-1" />
              Setup GitHub Token
            </Button>
            <Button 
              onClick={() => setIsDismissed(true)}
              variant="ghost" 
              size="sm"
              className="text-yellow-700 hover:text-yellow-800 hover:bg-yellow-100 dark:text-yellow-300 dark:hover:text-yellow-200 dark:hover:bg-yellow-800/30"
            >
              Dismiss
            </Button>
          </div>
        </div>
        
        <Button
          onClick={() => setIsDismissed(true)}
          variant="ghost"
          size="sm"
          className="text-yellow-600 hover:text-yellow-700 hover:bg-yellow-100 dark:text-yellow-400 dark:hover:text-yellow-300 dark:hover:bg-yellow-800/30 p-1"
        >
          <X className="w-4 h-4" />
        </Button>
      </AlertDescription>
    </Alert>
  )
}
