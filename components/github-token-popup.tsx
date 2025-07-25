import React, { useState } from 'react';
import { GithubIcon, X } from 'lucide-react';

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4">
      <div className="bg-card text-card-foreground rounded-lg shadow-lg max-w-md w-full max-h-[80vh] overflow-y-auto relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground z-10">
          <X className="h-6 w-6" />
        </button>
        <div className="p-8">
          <div className="flex items-center gap-4 mb-6">
            <GithubIcon className="h-8 w-8 text-muted-foreground flex-shrink-0" />
            <h2 className="text-2xl font-bold">Connect Your GitHub Account</h2>
          </div>
          <div className="text-muted-foreground mb-6 space-y-4">
            <p className="text-sm">
              🚀 <strong>Quick Setup!</strong> Follow these simple steps to enable one-click repository deletion and full features:
            </p>

            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
              <h3 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-2 text-sm">⚠️ IMPORTANT: Select ALL These Scopes</h3>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex items-center gap-1">
                  <span className="text-green-600">✅</span>
                  <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">repo</code>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-green-600">✅</span>
                  <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">delete_repo</code>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-green-600">✅</span>
                  <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">admin:org</code>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-green-600">✅</span>
                  <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">user</code>
                </div>
              </div>
            </div>

            <ol className="list-decimal list-inside space-y-2 text-xs bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
              <li><strong>Click the button below</strong> → Opens GitHub token page</li>
              <li><strong>Name your token</strong> → Type "NeatRepo" in the Note field</li>
              <li><strong>⚠️ CRITICAL:</strong> Check ALL 4 scopes above (repo, delete_repo, admin:org, user)</li>
              <li><strong>Generate token</strong> → Click green "Generate token" button</li>
              <li><strong>Copy & paste</strong> → Copy the token and paste it below</li>
            </ol>

            <p className="text-xs text-green-600 dark:text-green-400">
              ✅ With correct scopes: One-click delete will work perfectly!
            </p>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label htmlFor="github-token" className="block text-sm font-medium text-muted-foreground mb-2">GitHub Personal Access Token</label>
              <input
                id="github-token"
                type="password"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                className="w-full px-3 py-2 bg-input border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="temp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
              />
            </div>
            <a
              href="https://github.com/settings/tokens/new?scopes=repo,delete_repo,admin:org,user&description=NeatRepo%20-%20Full%20Access"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-md font-medium text-center block mb-4 transition-colors"
            >
              🚀 Open GitHub & Auto-Select Scopes
            </a>
            <div className="space-y-2">
              <button
                type="submit"
                disabled={isSubmitting || !token.trim()}
                className="w-full bg-primary text-primary-foreground py-2 px-4 rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Saving...' : 'Save and Continue'}
              </button>

              <button
                type="button"
                onClick={onSkip}
                disabled={isSubmitting}
                className="w-full bg-gray-500 hover:bg-gray-600 text-white py-2 px-4 rounded-md disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                Skip for now (Limited functionality)
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
