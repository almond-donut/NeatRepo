import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { AppError } from './types';

interface ErrorState {
  // Error tracking
  errors: AppError[];
  lastError: AppError | null;
  
  // Actions
  addError: (error: Omit<AppError, 'timestamp'>) => void;
  removeError: (timestamp: Date) => void;
  clearErrors: () => void;
  clearLastError: () => void;
  
  // Convenience methods for different error types
  addWarning: (message: string, code?: string) => void;
  addInfo: (message: string, code?: string) => void;
  addCriticalError: (message: string, code?: string) => void;
}

export const useErrorStore = create<ErrorState>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    errors: [],
    lastError: null,
    
    // Add error
    addError: (errorData) => set((state) => {
      const error: AppError = {
        ...errorData,
        timestamp: new Date()
      };
      
      return {
        errors: [...state.errors, error],
        lastError: error
      };
    }),
    
    // Remove specific error
    removeError: (timestamp) => set((state) => ({
      errors: state.errors.filter(error => error.timestamp !== timestamp),
      lastError: state.lastError?.timestamp === timestamp ? null : state.lastError
    })),
    
    // Clear all errors
    clearErrors: () => set({
      errors: [],
      lastError: null
    }),
    
    // Clear last error
    clearLastError: () => set({ lastError: null }),
    
    // Convenience methods
    addWarning: (message, code) => {
      get().addError({ message, code, type: 'warning' });
    },
    
    addInfo: (message, code) => {
      get().addError({ message, code, type: 'info' });
    },
    
    addCriticalError: (message, code) => {
      get().addError({ message, code, type: 'error' });
    }
  }))
);

// Auto-cleanup old errors (keep only last 50)
useErrorStore.subscribe(
  (state) => state.errors,
  (errors) => {
    if (errors.length > 50) {
      useErrorStore.setState((state) => ({
        errors: state.errors.slice(-50)
      }));
    }
  }
);
