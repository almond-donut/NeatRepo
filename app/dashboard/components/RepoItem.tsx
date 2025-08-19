import React, { useState } from 'react';
import { Draggable, DraggableProvided, DraggableStateSnapshot } from "@hello-pangea/dnd";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GitHubRepo } from '../types';
import { GripVertical, ChevronDown, ChevronRight, Folder, Star, GitFork, Clock, Eye, Code, Zap, Edit, Trash2, ExternalLink } from "lucide-react";

interface RepoItemProps {
  repo: GitHubRepo;
  index: number;
  isDeleteMode: boolean;
  isSelected: boolean;
  onToggleSelection: (id: number) => void;
  onDelete: (repo: GitHubRepo) => void;
  onRename: (repo: GitHubRepo) => void;
}

const formatTimeAgo = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  let interval = seconds / 31536000;
  if (interval > 1) return `${Math.floor(interval)} years ago`;
  interval = seconds / 2592000;
  if (interval > 1) return `${Math.floor(interval)} months ago`;
  interval = seconds / 86400;
  if (interval > 1) return `${Math.floor(interval)} days ago`;
  return "today";
};

export function RepoItem({ repo, index, isDeleteMode, isSelected, onToggleSelection, onDelete, onRename }: RepoItemProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <Draggable draggableId={repo.id.toString()} index={index}>
      {(provided: DraggableProvided, snapshot: DraggableStateSnapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          className={`p-3 rounded-lg transition-all duration-200 bg-card border ${
            snapshot.isDragging
              ? "opacity-90 shadow-2xl scale-105 border-primary/50 bg-primary/5 z-50"
              : "border-border/50 hover:border-border hover:shadow-md"
          }`}
        >
          <div className="flex items-center justify-between min-w-0">
             {/* Main Repo Info */}
             <div className="flex items-center min-w-0 flex-1 mr-4">
               {isDeleteMode ? (
                  <div className="mr-3 flex items-center">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => onToggleSelection(repo.id)}
                      className="w-4 h-4 text-destructive bg-background border-border rounded focus:ring-destructive focus:ring-2"
                      title="Select for deletion"
                    />
                  </div>
                ) : (
                  <div {...provided.dragHandleProps} className={`mr-3 cursor-grab text-muted-foreground hover:text-foreground`}>
                    <GripVertical className="h-5 w-5" />
                  </div>
                )}
                <button onClick={() => setIsExpanded(!isExpanded)} className="mr-2">
                  {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </button>
                <Folder className="h-4 w-4 text-muted-foreground mr-3" />
                <div className="flex-1 min-w-0">
                    <span className="font-semibold truncate">{repo.name}</span>
                </div>
             </div>
             <div className="flex items-center space-x-2 flex-shrink-0">
                <div className="text-xs text-muted-foreground">Updated {formatTimeAgo(repo.updated_at)}</div>
             </div>
          </div>

          {/* Expanded View */}
          {isExpanded && (
            <div className="pl-10 mt-2 space-y-2">
              <p className="text-sm text-muted-foreground">{repo.description || "No description."}</p>
              <div className="flex items-center space-x-4 text-xs text-muted-foreground mt-1">
                {repo.language && <span>{repo.language}</span>}
                <div className="flex items-center"><Star className="h-3 w-3 mr-1" /> {repo.stargazers_count}</div>
                <div className="flex items-center"><GitFork className="h-3 w-3 mr-1" /> {repo.forks_count}</div>
              </div>
              <div className="flex space-x-2 pt-2">
                  <Button variant="outline" size="sm" onClick={() => window.open(repo.html_url, "_blank")}><ExternalLink className="h-4 w-4 mr-2" /> View</Button>
                  <Button variant="outline" size="sm" onClick={() => onRename(repo)}><Edit className="h-4 w-4 mr-2" /> Rename</Button>
                  <Button variant="destructive" size="sm" onClick={() => onDelete(repo)}><Trash2 className="h-4 w-4 mr-2" /> Delete</Button>
              </div>
            </div>
          )}
        </div>
      )}
    </Draggable>
  );
}