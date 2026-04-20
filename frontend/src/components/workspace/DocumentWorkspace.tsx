import { useCapabilities } from '@/core/capabilities/useCapabilities';
import { useAnnotationStore } from '@/core/annotations/store';
import { loadAnnotationsFromIDB, saveAnnotationsToIDB, loadAnnotationsFromServer, saveAnnotationsToServer } from '@/core/annotations/persistence';
import { useSessionStore } from '@/core/session/store';
import React from 'react';
import { UploadCloud } from 'lucide-react';

export const DocumentWorkspace: React.FC = () => {
  const { annotations, setAnnotations } = useAnnotationStore();
  const { fileId, fileName } = useSessionStore();
  const { mode } = useCapabilities();

  React.useEffect(() => {
    if (!fileId) return;
    const fetchAnns = async () => {
        if (mode === 'preview') {
             const anns = await loadAnnotationsFromIDB(fileId);
             setAnnotations(anns);
        } else {
             const anns = await loadAnnotationsFromServer(fileId);
             setAnnotations(anns);
        }
    };
    fetchAnns();
  }, [fileId, mode, setAnnotations]);

  React.useEffect(() => {
     if (!fileId) return;
     const saveAnns = async () => {
        if (mode === 'preview') {
             await saveAnnotationsToIDB(fileId, annotations);
        } else {
             await saveAnnotationsToServer(fileId, annotations);
        }
     };
     // Debounce or save on interaction
     const timer = setTimeout(() => { saveAnns(); }, 1000);
     return () => clearTimeout(timer);
  }, [annotations, fileId, mode]);

  const hasDocument = !!fileId;

  if (!hasDocument) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-slate-100 dark:bg-slate-950/50">
        <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center mb-6">
            <UploadCloud className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">
            Open a PDF to begin
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-8">
            Drag and drop a PDF file here, or click to browse your computer.
          </p>
          <button className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium transition-colors">
            Browse Files
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-slate-200 dark:bg-slate-950 overflow-auto">
      {/* Scroll container for virtual page list will go here */}
      <div className="min-h-full flex flex-col items-center py-8">
        <div className="w-[800px] h-[1000px] bg-white dark:bg-slate-900 shadow-md mb-8"></div>
        <div className="w-[800px] h-[1000px] bg-white dark:bg-slate-900 shadow-md mb-8"></div>
      </div>
    </div>
  );
};
