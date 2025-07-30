import React from 'react';
import { AlertTriangle, CheckCircle, Info, X } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useErrorStore } from '@/stores';
import { AppError } from '@/stores/types';

interface ErrorDisplayProps {
  className?: string;
}

export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ className = '' }) => {
  const { errors, lastError, removeError, clearErrors } = useErrorStore();

  if (errors.length === 0) {
    return null;
  }

  const getErrorIcon = (type: AppError['type']) => {
    switch (type) {
      case 'error':
        return <AlertTriangle className="h-4 w-4" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4" />;
      case 'info':
        return <Info className="h-4 w-4" />;
      default:
        return <Info className="h-4 w-4" />;
    }
  };

  const getErrorVariant = (type: AppError['type']): 'default' | 'destructive' => {
    return type === 'error' ? 'destructive' : 'default';
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Show only the most recent error if there are multiple */}
      {lastError && (
        <Alert variant={getErrorVariant(lastError.type)} className="relative">
          {getErrorIcon(lastError.type)}
          <AlertDescription className="pr-8">
            {lastError.message}
            {lastError.code && (
              <span className="block text-xs mt-1 opacity-70">
                Error Code: {lastError.code}
              </span>
            )}
          </AlertDescription>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => removeError(lastError.timestamp)}
            className="absolute top-2 right-2 h-6 w-6 p-0"
          >
            <X className="h-3 w-3" />
          </Button>
        </Alert>
      )}

      {/* Show error count if there are multiple errors */}
      {errors.length > 1 && (
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            {errors.length - 1} more error{errors.length > 2 ? 's' : ''}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={clearErrors}
            className="h-6 text-xs"
          >
            Clear all
          </Button>
        </div>
      )}
    </div>
  );
};
