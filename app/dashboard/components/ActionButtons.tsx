import React from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RefreshCw, Trash2, Plus, Calendar } from "lucide-react";

interface ActionButtonsProps {
    isLoadingRepos: boolean;
    isDeleteMode: boolean;
    selectedReposCount: number;
    dateSortOrder: 'newest' | 'oldest' | 'default';
    onRefresh: () => void;
    onDateSort: (order: 'newest' | 'oldest' | 'default') => void;
    onAddRepo: () => void;

    onToggleDeleteMode: () => void;
    onBulkDelete: () => void;
}

export function ActionButtons({
    isLoadingRepos, isDeleteMode, selectedReposCount, dateSortOrder,
    onRefresh, onDateSort, onAddRepo, onToggleDeleteMode, onBulkDelete
}: ActionButtonsProps) {
  return (
    <div className="flex items-center justify-between gap-4 mb-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" onClick={onRefresh} disabled={isLoadingRepos}>
          <RefreshCw className={`h-4 w-4 ${isLoadingRepos ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </Button>
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <Select value={dateSortOrder} onValueChange={onDateSort}>
            <SelectTrigger className="w-[140px] h-9"><SelectValue placeholder="Sort by Date" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="default">Default Order</SelectItem>
              <SelectItem value="newest">Newest First</SelectItem>
              <SelectItem value="oldest">Oldest First</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button variant="outline" size="icon" onClick={onAddRepo} title="Add Repository">
          <Plus className="h-4 w-4" />
        </Button>

      </div>
      <div className="flex items-center gap-4">
        <Button variant={isDeleteMode ? "destructive" : "outline"} size="sm" onClick={onToggleDeleteMode}>
          <Trash2 className="h-4 w-4" />
          <span>{isDeleteMode ? "Exit Delete Mode" : "Enter Delete Mode"}</span>
        </Button>
        {isDeleteMode && selectedReposCount > 0 && (
          <Button variant="destructive" size="sm" onClick={onBulkDelete}>
            <Trash2 className="h-4 w-4" />
            <span>Delete {selectedReposCount}</span>
          </Button>
        )}
      </div>
    </div>
  );
}