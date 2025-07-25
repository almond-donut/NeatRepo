'use client'

import React from 'react'
import { AlertTriangle, Settings } from 'lucide-react'
import { useAuth } from '@/components/auth-provider'

export default function TokenWarningBadge() {
  const { hasToken, showTokenPopup } = useAuth()

  // Don't show if user has token
  if (hasToken) return null

  return (
    <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3 mb-4">
      <div className="flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h3 className="font-semibold text-yellow-800 dark:text-yellow-200 text-sm mb-1">
            GitHub Token Not Configured
          </h3>
          <p className="text-yellow-700 dark:text-yellow-300 text-xs mb-3">
            Some features like <strong>bulk delete</strong>, <strong>repository creation</strong>, and <strong>advanced operations</strong> will not function properly without a GitHub Personal Access Token.
          </p>
          <button
            onClick={showTokenPopup}
            className="inline-flex items-center gap-2 bg-yellow-600 hover:bg-yellow-700 text-white px-3 py-1.5 rounded-md text-xs font-medium transition-colors"
          >
            <Settings className="h-3 w-3" />
            Configure Token Now
          </button>
        </div>
      </div>
    </div>
  )
}
