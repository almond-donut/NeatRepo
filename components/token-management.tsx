import React, { useState } from 'react';
import { Settings, Trash2, Plus, AlertTriangle, CheckCircle, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import GitHubTokenPopup from './github-token-popup';

interface TokenManagementProps {
  currentToken?: string;
  onTokenUpdate: (token: string) => void;
  onTokenDelete: () => void;
}

export default function TokenManagement({ currentToken, onTokenUpdate, onTokenDelete }: TokenManagementProps) {
  const [showTokenPopup, setShowTokenPopup] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleDeleteToken = async () => {
    setIsDeleting(true);
    try {
      await onTokenDelete();
      setShowDeleteConfirm(false);
    } catch (error) {
      console.error('Error deleting token:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleTokenSubmit = async (token: string) => {
    setIsSubmitting(true);
    try {
      await onTokenUpdate(token);
      setShowTokenPopup(false);
    } catch (error) {
      console.error('Error updating token:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const maskedToken = currentToken ? `${currentToken.substring(0, 8)}${'*'.repeat(32)}` : 'No token set';

  return (
    <>
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            <CardTitle>GitHub Token Management</CardTitle>
          </div>
          <CardDescription>
            Manage your GitHub Personal Access Token for repository operations
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Current Token Status */}
          <div className="space-y-3">
            <h3 className="font-medium">Current Token Status</h3>
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div className="flex items-center gap-3">
                {currentToken ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <AlertTriangle className="h-5 w-5 text-yellow-500" />
                )}
                <div>
                  <p className="font-mono text-sm">{maskedToken}</p>
                  <p className="text-xs text-muted-foreground">
                    {currentToken ? 'Token is active' : 'No token configured'}
                  </p>
                </div>
              </div>
              {currentToken && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setShowDeleteConfirm(true)}
                  disabled={isDeleting}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              )}
            </div>
          </div>

          {/* Token Permissions Check */}
          {currentToken && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Having issues with delete functionality?</strong> Your token might be missing required scopes. 
                Generate a new token with all required permissions.
              </AlertDescription>
            </Alert>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              onClick={() => setShowTokenPopup(true)}
              className="flex-1"
              variant={currentToken ? "outline" : "default"}
            >
              <Plus className="h-4 w-4 mr-2" />
              {currentToken ? 'Update Token' : 'Add Token'}
            </Button>
            
            <Button
              variant="outline"
              onClick={() => window.open('https://github.com/settings/tokens', '_blank')}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              GitHub Settings
            </Button>
          </div>

          {/* Help Section */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">
              🔧 Token Issues? Common Solutions:
            </h4>
            <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
              <li>• <strong>Lost access after system update?</strong> Recent authentication improvements may require re-entering your PAT</li>
              <li>• <strong>Delete not working?</strong> Generate new token with all 4 scopes</li>
              <li>• <strong>Wrong scopes selected?</strong> Delete current token and create new one</li>
              <li>• <strong>Token expired?</strong> GitHub tokens can expire, create a fresh one</li>
              <li>• <strong>Permission denied?</strong> Make sure you have admin access to repositories</li>
            </ul>
          </div>

          {/* Recovery Notice */}
          {!currentToken && (
            <Alert className="border-amber-200 bg-amber-50 dark:bg-amber-900/20">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-800 dark:text-amber-200">
                <strong>Need to re-enter your PAT?</strong> Recent system improvements may have reset authentication settings.
                This is a one-time setup to restore your repository access. Your data is safe and secure.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
          <div className="bg-card text-card-foreground rounded-lg shadow-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="h-6 w-6 text-red-500" />
              <h3 className="text-lg font-semibold">Delete GitHub Token</h3>
            </div>
            <p className="text-muted-foreground mb-6">
              Are you sure you want to delete your GitHub token? You'll need to add a new one to continue using repository features.
            </p>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteToken}
                disabled={isDeleting}
                className="flex-1"
              >
                {isDeleting ? 'Deleting...' : 'Delete Token'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Token Popup */}
      {showTokenPopup && (
        <GitHubTokenPopup
          onTokenSubmit={handleTokenSubmit}
          isSubmitting={isSubmitting}
          onClose={() => setShowTokenPopup(false)}
        />
      )}
    </>
  );
}
