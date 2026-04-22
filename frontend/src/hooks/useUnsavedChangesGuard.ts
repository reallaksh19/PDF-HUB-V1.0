import { useEffect } from 'react';
import { useSessionStore } from '@/core/session/store';

export const useUnsavedChangesGuard = () => {
  const isDocumentDirty = useSessionStore((state) => state.isDocumentDirty);

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!useSessionStore.getState().isDocumentDirty) {
        return;
      }
      event.preventDefault();
      event.returnValue = '';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDocumentDirty]);
};