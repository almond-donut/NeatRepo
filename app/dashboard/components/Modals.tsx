import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { GitHubRepo } from '../types';
import { Trash2, Plus, Edit, RefreshCw } from 'lucide-react';

interface ModalsProps {
    showDeleteConfirm: boolean;
    repoToDelete: GitHubRepo | null;
    isDeleting: boolean;
    onConfirmDelete: () => void;
    onCancelDelete: () => void;



    showAddRepoModal: boolean;
    newRepoName: string;
    newRepoDescription: string;
    isCreatingRepo: boolean;
    onNewRepoNameChange: (value: string) => void;
    onNewRepoDescriptionChange: (value: string) => void;
    onCreateRepo: () => void;
    onCloseAddRepo: () => void;
    
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
    showAddRepoModal, newRepoName, newRepoDescription, isCreatingRepo, onNewRepoNameChange, onNewRepoDescriptionChange, onCreateRepo, onCloseAddRepo,
    showRenameModal, repoToRename, newRepoNameForRename, isRenamingRepo, onNewRepoNameForRenameChange, onRenameRepo, onCloseRenameRepo
}: ModalsProps) {

  return (
    <>
      {/* Delete Confirmation Modal */}
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