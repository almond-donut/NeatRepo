import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { GitHubRepo } from '../types';
import { Trash2, Plus, Edit, RefreshCw, AlertTriangle } from 'lucide-react';

interface ModalsProps {
    // Single repo delete
    showDeleteConfirm: boolean;
    repoToDelete: GitHubRepo | null;
    isDeleting: boolean;
    onConfirmDelete: () => void;
    onCancelDelete: () => void;

    // ✨ NEW: Props for Bulk Delete Confirmation ✨
    showBulkDeleteConfirm: boolean;
    selectedReposCount: number;
    onConfirmBulkDelete: () => void;
    onCancelBulkDelete: () => void;

    // Add repo
    showAddRepoModal: boolean;
    newRepoName: string;
    newRepoDescription: string;
    isCreatingRepo: boolean;
    onNewRepoNameChange: (value: string) => void;
    onNewRepoDescriptionChange: (value: string) => void;
    onCreateRepo: () => void;
    onCloseAddRepo: () => void;
    
    // Rename repo
    showRenameModal: boolean;
    repoToRename: GitHubRepo | null;
    newRepoNameForRename: string;
    isRenamingRepo: boolean;
    onNewRepoNameForRenameChange: (value: string) => void;
    onRenameRepo: () => void;
    onCloseRenameRepo: () => void;
}

export function Modals({
    showDeleteConfirm, repoToDelete, isDeleting, onConfirmDelete, onCancelDelete,
    showBulkDeleteConfirm, selectedReposCount, onConfirmBulkDelete, onCancelBulkDelete,
    showAddRepoModal, newRepoName, newRepoDescription, isCreatingRepo, onNewRepoNameChange, onNewRepoDescriptionChange, onCreateRepo, onCloseAddRepo,
    showRenameModal, repoToRename, newRepoNameForRename, isRenamingRepo, onNewRepoNameForRenameChange, onRenameRepo, onCloseRenameRepo
}: ModalsProps) {

  return (
    <>
      {/* Single Delete Confirmation Modal */}
      {showDeleteConfirm && repoToDelete && (
        <Dialog open={showDeleteConfirm} onOpenChange={onCancelDelete}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2"><Trash2/> Delete Repository</DialogTitle>
            </DialogHeader>
            <p>Are you sure you want to permanently delete <strong>"{repoToDelete.name}"</strong>? This action cannot be undone.</p>
            <DialogFooter>
              <Button variant="outline" onClick={onCancelDelete} disabled={isDeleting}>Cancel</Button>
              <Button variant="destructive" onClick={onConfirmDelete} disabled={isDeleting}>
                {isDeleting ? <><RefreshCw className="animate-spin mr-2" /> Deleting...</> : "Delete Forever"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* ✨ NEW: Bulk Delete Confirmation Modal ✨ */}
      {showBulkDeleteConfirm && (
        <Dialog open={showBulkDeleteConfirm} onOpenChange={onCancelBulkDelete}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertTriangle className="text-destructive" />
                Confirm Bulk Deletion
              </DialogTitle>
              <DialogDescription>
                This action is irreversible and will permanently remove the selected repositories from your GitHub account.
              </DialogDescription>
            </DialogHeader>
            <p>
              Are you sure you want to permanently delete <strong>{selectedReposCount} selected repositories</strong>?
            </p>
            <DialogFooter>
              <Button variant="outline" onClick={onCancelBulkDelete} disabled={isDeleting}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={onConfirmBulkDelete} disabled={isDeleting}>
                {isDeleting ? <><RefreshCw className="animate-spin mr-2" /> Deleting...</> : `Delete ${selectedReposCount} Repositories`}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Add Repository Modal */}
      {showAddRepoModal && (
          <Dialog open={showAddRepoModal} onOpenChange={onCloseAddRepo}>
              <DialogContent>
                  <DialogHeader><DialogTitle className="flex items-center gap-2"><Plus /> Create New Repository</DialogTitle></DialogHeader>
                  <Input placeholder="Repository Name" value={newRepoName} onChange={(e) => onNewRepoNameChange(e.target.value)} />
                  <Input placeholder="Description (Optional)" value={newRepoDescription} onChange={(e) => onNewRepoDescriptionChange(e.target.value)} />
                  <DialogFooter>
                      <Button variant="outline" onClick={onCloseAddRepo}>Cancel</Button>
                      <Button onClick={onCreateRepo} disabled={!newRepoName.trim() || isCreatingRepo}>
                          {isCreatingRepo ? <><RefreshCw className="animate-spin mr-2" /> Creating...</> : "Create"}
                      </Button>
                  </DialogFooter>
              </DialogContent>
          </Dialog>
      )}

      {/* Rename Repository Modal */}
      {showRenameModal && repoToRename && (
          <Dialog open={showRenameModal} onOpenChange={onCloseRenameRepo}>
              <DialogContent>
                  <DialogHeader><DialogTitle className="flex items-center gap-2"><Edit /> Rename Repository</DialogTitle></DialogHeader>
                  <p className="text-sm text-muted-foreground">Current name: {repoToRename.name}</p>
                  <Input value={newRepoNameForRename} onChange={(e) => onNewRepoNameForRenameChange(e.target.value)} />
                  <DialogFooter>
                      <Button variant="outline" onClick={onCloseRenameRepo}>Cancel</Button>
                      <Button onClick={onRenameRepo} disabled={!newRepoNameForRename.trim() || isRenamingRepo}>
                          {isRenamingRepo ? <><RefreshCw className="animate-spin mr-2" /> Renaming...</> : "Rename"}
                      </Button>
                  </DialogFooter>
              </DialogContent>
          </Dialog>
      )}
    </>
  );
}