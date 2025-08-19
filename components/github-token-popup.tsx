import React, { useState } from 'react';
import { GithubIcon, X, ExternalLink, AlertTriangle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';

interface GitHubTokenPopupProps {
  onTokenSubmit: (token: string) => void;
  isSubmitting: boolean;
  onClose: () => void;
  onSkip: () => void;
}

export default function GitHubTokenPopup({ onTokenSubmit, isSubmitting, onClose, onSkip }: GitHubTokenPopupProps) {
  const [token, setToken] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (token.trim()) {
      onTokenSubmit(token.trim());
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-background border rounded-lg shadow-lg max-w-lg w-full max-h-[90vh] overflow-y-auto relative">
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="absolute top-4 right-4 h-8 w-8"
        >
          <X className="h-4 w-4" />
        </Button>

        <div className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-muted rounded-lg">
              <GithubIcon className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">Connect GitHub Account</h2>
              <p className="text-sm text-muted-foreground">Set up your Personal Access Token</p>
            </div>
          </div>
          <Alert className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Required Permissions:</strong> The following scopes are needed for full functionality.
            </AlertDescription>
          </Alert>

          <div className="grid grid-cols-2 gap-2 mb-4">
            <Badge variant="secondary" className="justify-center">
              <CheckCircle className="h-3 w-3 mr-1" />
              repo
            </Badge>
            <Badge variant="secondary" className="justify-center">
              <CheckCircle className="h-3 w-3 mr-1" />
              delete_repo
            </Badge>
            <Badge variant="secondary" className="justify-center">
              <CheckCircle className="h-3 w-3 mr-1" />
              admin:org
            </Badge>
            <Badge variant="secondary" className="justify-center">
              <CheckCircle className="h-3 w-3 mr-1" />
              user
            </Badge>
          </div>

          <div className="space-y-3 mb-6 text-sm text-muted-foreground">
            <div className="flex items-start gap-2">
              <span className="flex-shrink-0 w-5 h-5 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-medium">1</span>
              <span>Click the button below to open GitHub token page</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="flex-shrink-0 w-5 h-5 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-medium">2</span>
              <span>Name your token "NeatRepo" in the Note field</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="flex-shrink-0 w-5 h-5 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-medium">3</span>
              <span>Select all 4 required scopes shown above</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="flex-shrink-0 w-5 h-5 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-medium">4</span>
              <span>Generate and copy the token</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="flex-shrink-0 w-5 h-5 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-medium">5</span>
              <span>Paste the token in the field below</span>
            </div>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="github-token">GitHub Personal Access Token</Label>
              <Input
                id="github-token"
                type="password"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
              />
            </div>

            <Button
              type="button"
              variant="outline"
              className="w-full"
              asChild
            >
              <a
                href="https://github.com/settings/tokens/new?scopes=repo,delete_repo,admin:org,user&description=NeatRepo%20-%20Full%20Access"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2"
              >
                <ExternalLink className="h-4 w-4" />
                Open GitHub & Auto-Select Scopes
              </a>
            </Button>
            <div className="flex flex-col gap-2">
              <Button
                type="submit"
                disabled={isSubmitting || !token.trim()}
                className="w-full"
              >
                {isSubmitting ? 'Saving...' : 'Save and Continue'}
              </Button>

              <Button
                type="button"
                variant="ghost"
                onClick={onSkip}
                disabled={isSubmitting}
                className="w-full text-muted-foreground"
              >
                Skip for now (Limited functionality)
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
