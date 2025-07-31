import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { GitHubRepo } from '../types';
import { Trash2, Target, Plus, Edit, X, RefreshCw, Sparkles, CheckCircle } from 'lucide-react';

interface ModalsProps {
    showDeleteConfirm: boolean;
    repoToDelete: GitHubRepo | null;
    isDeleting: boolean;
    onConfirmDelete: () => void;
    onCancelDelete: () => void;

    showJobTemplateModal: boolean;
    jobTitle: string;
    isGeneratingTemplate: boolean;
    templateResults: GitHubRepo[];
    onJobTitleChange: (value: string) => void;
    onGenerateJobTemplate: () => void;
    onCloseJobTemplate: () => void;

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
    showJobTemplateModal, jobTitle, isGeneratingTemplate, templateResults, onJobTitleChange, onGenerateJobTemplate, onCloseJobTemplate,
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

      {/* Job Template Modal */}
      {showJobTemplateModal && (
          <Dialog open={showJobTemplateModal} onOpenChange={onCloseJobTemplate}>
              <DialogContent>
                  <DialogHeader><DialogTitle className="flex items-center gap-2"><Target /> Generate Job Template</DialogTitle></DialogHeader>
                  <Input placeholder="e.g., Frontend Developer" value={jobTitle} onChange={(e) => onJobTitleChange(e.target.value)} />
                  {templateResults.length > 0 && (
                      <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                          <h3 className="font-medium mb-2 flex items-center gap-2"><CheckCircle className="text-green-500" /> Selected Repos</h3>
                          <ul className="space-y-1">{templateResults.map(r => <li key={r.id}>{r.name}</li>)}</ul>
                      </div>
                  )}
                  <DialogFooter>
                      <Button variant="outline" onClick={onCloseJobTemplate}>Cancel</Button>
                      <Button onClick={onGenerateJobTemplate} disabled={!jobTitle.trim() || isGeneratingTemplate}>
                          {isGeneratingTemplate ? <><RefreshCw className="animate-spin mr-2" /> Generating...</> : <><Sparkles className="mr-2" /> Generate</>}
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