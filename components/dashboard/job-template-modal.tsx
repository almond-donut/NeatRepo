import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Target, Sparkles } from 'lucide-react';
import { useUIStore } from '@/stores';
import { useAIChat } from '@/hooks/dashboard';

interface JobTemplateModalProps {
  repositories: any[];
}

export const JobTemplateModal: React.FC<JobTemplateModalProps> = ({ repositories }) => {
  const { 
    showJobTemplateModal, 
    jobTitle, 
    jobDescription,
    isProcessing,
    setJobTemplateModal,
    setJobTitle,
    setJobDescription,
    setProcessing,
    resetJobForm
  } = useUIStore();

  const { generateJobRecommendations } = useAIChat();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!jobTitle.trim()) {
      return;
    }

    try {
      setProcessing(true);
      await generateJobRecommendations(jobTitle, repositories);
      resetJobForm();
    } catch (error) {
      console.error('Error generating job recommendations:', error);
    } finally {
      setProcessing(false);
    }
  };

  const handleClose = () => {
    if (!isProcessing) {
      resetJobForm();
    }
  };

  return (
    <Dialog open={showJobTemplateModal} onOpenChange={setJobTemplateModal}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Job-Specific Portfolio Optimization
          </DialogTitle>
          <DialogDescription>
            Get AI-powered recommendations for tailoring your GitHub profile to a specific job role.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="jobTitle">Job Title or Role</Label>
            <Input
              id="jobTitle"
              type="text"
              placeholder="e.g., Frontend Developer, Full Stack Engineer, React Developer"
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              disabled={isProcessing}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="jobDescription">Job Description (Optional)</Label>
            <Textarea
              id="jobDescription"
              placeholder="Paste the job description here for more specific recommendations..."
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              disabled={isProcessing}
              rows={4}
            />
          </div>

          <div className="bg-muted p-4 rounded-lg">
            <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              What you'll get:
            </h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Repository recommendations to highlight</li>
              <li>• Skills gaps analysis</li>
              <li>• Profile improvement suggestions</li>
              <li>• Interview talking points</li>
            </ul>
          </div>

          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!jobTitle.trim() || isProcessing}
            >
              {isProcessing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent mr-2" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Get Recommendations
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
