"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { 
  Trash2, 
  User, 
  Clock,
  AlertTriangle
} from "lucide-react"
import { useAccountSwitcher } from "@/hooks/useAccountSwitcher"
import { useAuth } from "@/components/auth-provider"

interface AccountManagementDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function AccountManagementDialog({ 
  open, 
  onOpenChange 
}: AccountManagementDialogProps) {
  const { user } = useAuth()
  const { accounts, removeAccount, isLoading, error } = useAccountSwitcher()
  const [removingAccountId, setRemovingAccountId] = useState<string | null>(null)

  const handleRemoveAccount = async (accountId: string) => {
    if (accountId === user?.id) return
    
    setRemovingAccountId(accountId)
    try {
      removeAccount(accountId)
    } finally {
      setRemovingAccountId(null)
    }
  }

  const formatLastUsed = (lastUsed: string) => {
    const date = new Date(lastUsed)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays} days ago`
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
    return date.toLocaleDateString()
  }

  const otherAccounts = accounts.filter(acc => acc.id !== user?.id)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Manage Accounts</DialogTitle>
          <DialogDescription>
            Manage your saved GitHub accounts. You can remove accounts you no longer use.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="flex items-center space-x-2 p-3 bg-red-50 border border-red-200 rounded-lg">
            <AlertTriangle className="w-4 h-4 text-red-500" />
            <span className="text-sm text-red-700">{error}</span>
          </div>
        )}

        <div className="space-y-4">
          {/* Current Account */}
          {user && (
            <div>
              <h4 className="text-sm font-medium mb-2">Current Account</h4>
              <div className="flex items-center space-x-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                {accounts.find(acc => acc.id === user.id)?.avatar_url ? (
                  <img 
                    src={accounts.find(acc => acc.id === user.id)?.avatar_url} 
                    alt="Avatar"
                    className="w-8 h-8 rounded-full"
                  />
                ) : (
                  <User className="w-8 h-8 text-gray-400" />
                )}
                <div className="flex-1">
                  <p className="text-sm font-medium">
                    {accounts.find(acc => acc.id === user.id)?.username || 'Current User'}
                  </p>
                  <p className="text-xs text-gray-500">
                    {accounts.find(acc => acc.id === user.id)?.email || user.email}
                  </p>
                </div>
                <Badge variant="secondary" className="text-xs">
                  Active
                </Badge>
              </div>
            </div>
          )}

          {/* Other Accounts */}
          {otherAccounts.length > 0 && (
            <div>
              <h4 className="text-sm font-medium mb-2">Saved Accounts</h4>
              <div className="space-y-2">
                {otherAccounts.map((account) => (
                  <div 
                    key={account.id}
                    className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50"
                  >
                    {account.avatar_url ? (
                      <img 
                        src={account.avatar_url} 
                        alt={account.username}
                        className="w-8 h-8 rounded-full"
                      />
                    ) : (
                      <User className="w-8 h-8 text-gray-400" />
                    )}
                    <div className="flex-1">
                      <p className="text-sm font-medium">{account.username}</p>
                      <p className="text-xs text-gray-500">{account.email}</p>
                      <div className="flex items-center space-x-1 mt-1">
                        <Clock className="w-3 h-3 text-gray-400" />
                        <span className="text-xs text-gray-400">
                          {formatLastUsed(account.last_used)}
                        </span>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveAccount(account.id)}
                      disabled={isLoading || removingAccountId === account.id}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      {removingAccountId === account.id ? (
                        <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {otherAccounts.length === 0 && (
            <div className="text-center py-6">
              <User className="w-12 h-12 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-500">No other accounts saved</p>
              <p className="text-xs text-gray-400 mt-1">
                Add another account to see it here
              </p>
            </div>
          )}
        </div>

        <Separator />

        <div className="flex justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}