"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu"
import { 
  ChevronDown, 
  Plus, 
  Settings, 
  LogOut, 
  Check,
  User,
  AlertTriangle,
  Loader2
} from "lucide-react"
import { useAuth } from "@/components/auth-provider"
import { useAccountSwitcher } from "@/hooks/useAccountSwitcher"
import AccountManagementDialog from "./account-management-dialog"

export default function AccountSwitcher() {
  const { user, profile } = useAuth()
  const { 
    accounts, 
    currentAccount, 
    isLoading, 
    error, 
    switchAccount, 
    addAccount, 
    signOutAll 
  } = useAccountSwitcher()
  const [isOpen, setIsOpen] = useState(false)
  const [showManageDialog, setShowManageDialog] = useState(false)

  const handleAddAccount = async () => {
    setIsOpen(false)
    await addAccount()
  }

  const handleSwitchAccount = async (accountId: string) => {
    if (accountId === user?.id) return
    setIsOpen(false)
    await switchAccount(accountId)
  }

  const handleSignOutAll = async () => {
    setIsOpen(false)
    await signOutAll()
  }

  const handleManageAccounts = () => {
    setIsOpen(false)
    setShowManageDialog(true)
  }

  // 🚨 TEMPORARY DEBUG: Show debug info instead of returning null
  if (!user || !profile) {
    console.log("🚨 ACCOUNT SWITCHER DEBUG:", {
      user: !!user,
      profile: !!profile,
      userId: user?.id,
      userMetadata: user?.user_metadata
    });
    return (
      <div className="text-red-500 text-xs p-2 border border-red-300 rounded">
        DEBUG: user={!!user}, profile={!!profile}
      </div>
    );
  }

  // Use currentAccount from hook or fallback
  const displayAccount = currentAccount || {
    id: user.id,
    email: user.email || '',
    username: profile.github_username || 'Unknown',
    avatar_url: user.user_metadata?.avatar_url,
    last_used: new Date().toISOString()
  }

  return (
    <>
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="ghost" 
            className="flex items-center space-x-2 px-3 py-2 h-auto"
            disabled={isLoading}
          >
            {displayAccount.avatar_url ? (
              <img 
                src={displayAccount.avatar_url} 
                alt={displayAccount.username}
                className="w-6 h-6 rounded-full"
              />
            ) : (
              <User className="w-6 h-6" />
            )}
            <div className="flex flex-col items-start">
              <span className="text-sm font-medium">{displayAccount.username}</span>
              <span className="text-xs text-muted-foreground">{displayAccount.email}</span>
            </div>
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </Button>
        </DropdownMenuTrigger>
        
        <DropdownMenuContent align="end" className="w-80">
          <div className="p-3">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium">GitHub Accounts</p>
              {accounts.length > 1 && (
                <Badge variant="secondary" className="text-xs">
                  {accounts.length} accounts
                </Badge>
              )}
            </div>

            {/* Error Display */}
            {error && (
              <div className="flex items-center space-x-2 p-2 mb-2 bg-red-50 border border-red-200 rounded-lg">
                <AlertTriangle className="w-4 h-4 text-red-500" />
                <span className="text-xs text-red-700">{error}</span>
              </div>
            )}
            
            {/* Current Account */}
            <div className="flex items-center space-x-3 p-2 rounded-lg bg-muted/50">
              {displayAccount.avatar_url ? (
                <img 
                  src={displayAccount.avatar_url} 
                  alt={displayAccount.username}
                  className="w-8 h-8 rounded-full"
                />
              ) : (
                <User className="w-8 h-8" />
              )}
              <div className="flex-1">
                <p className="text-sm font-medium">{displayAccount.username}</p>
                <p className="text-xs text-muted-foreground">{displayAccount.email}</p>
              </div>
              <Check className="w-4 h-4 text-green-500" />
            </div>
            
            {/* Other Accounts */}
            {accounts.filter(acc => acc.id !== user.id).map((account) => (
              <button
                key={account.id}
                onClick={() => handleSwitchAccount(account.id)}
                disabled={isLoading}
                className="flex items-center space-x-3 p-2 rounded-lg hover:bg-muted/50 w-full text-left mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {account.avatar_url ? (
                  <img 
                    src={account.avatar_url} 
                    alt={account.username}
                    className="w-8 h-8 rounded-full"
                  />
                ) : (
                  <User className="w-8 h-8" />
                )}
                <div className="flex-1">
                  <p className="text-sm font-medium">{account.username}</p>
                  <p className="text-xs text-muted-foreground">{account.email}</p>
                </div>
                {isLoading && (
                  <Loader2 className="w-4 h-4 animate-spin" />
                )}
              </button>
            ))}

            {/* No other accounts message */}
            {accounts.filter(acc => acc.id !== user.id).length === 0 && (
              <div className="text-center py-4">
                <p className="text-xs text-muted-foreground">
                  No other accounts saved
                </p>
              </div>
            )}
          </div>
          
          <DropdownMenuSeparator />
          
          <DropdownMenuItem 
            onClick={handleAddAccount} 
            className="cursor-pointer"
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Plus className="w-4 h-4 mr-2" />
            )}
            Add another account
          </DropdownMenuItem>
          
          <DropdownMenuItem 
            onClick={handleManageAccounts}
            className="cursor-pointer"
            disabled={isLoading}
          >
            <Settings className="w-4 h-4 mr-2" />
            Manage accounts
          </DropdownMenuItem>
          
          <DropdownMenuSeparator />
          
          <DropdownMenuItem 
            onClick={handleSignOutAll} 
            className="cursor-pointer text-red-600"
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <LogOut className="w-4 h-4 mr-2" />
            )}
            Sign out all accounts
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AccountManagementDialog 
        open={showManageDialog}
        onOpenChange={setShowManageDialog}
      />
    </>
  )
}
