"use client"

import { Github } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import AccountSwitcher from "@/components/account-switcher"
import { Badge } from "@/components/ui/badge"

export default function DashboardHeader() {
  return (
    <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Logo & Brand */}
          <div className="flex items-center space-x-3">
            <Github className="h-8 w-8 text-primary" />
            <div className="flex flex-col">
              <span className="text-xl font-bold">NeatRepo</span>
              <div className="flex items-center space-x-2">
                <Badge variant="secondary" className="text-xs">
                  Dashboard
                </Badge>
                <Badge variant="outline" className="text-xs">
                  Multi-Account
                </Badge>
              </div>
            </div>
          </div>

          {/* Navigation Actions */}
          <div className="flex items-center space-x-4">
            <ThemeToggle />
            <AccountSwitcher />
          </div>
        </div>
      </div>
    </header>
  )
}
