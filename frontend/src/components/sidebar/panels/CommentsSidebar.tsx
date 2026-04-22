import React from 'react';
import { MessageSquare } from 'lucide-react';
import { useSessionStore } from '@/core/session/store';
import { useAnnotationStore } from '@/core/annotations/store';
import { FeaturePlaceholder } from '@/components/ui/FeaturePlaceholder';

const CommentsSidebar: React.FC = () => {
  const { annotations, activeAnnotationId, setActiveAnnotationId } = useAnnotationStore();
  const { setPage } = useSessionStore();

  if (annotations.length === 0) {
    return (
      <FeaturePlaceholder
        name="Comments"
        description="Create annotations on the page to see them listed here."
        icon={<MessageSquare />}
      />
    );
  }

  return (
    <div className="p-3 space-y-2 overflow-y-auto h-full">
      {annotations
        .slice()
        .sort((a, b) => a.pageNumber - b.pageNumber || b.updatedAt - a.updatedAt)
        .map((annotation) => {
          const selected = annotation.id === activeAnnotationId;
          const text =
            typeof annotation.data.text === 'string' && annotation.data.text.trim()
              ? annotation.data.text
              : annotation.type.toUpperCase();

          return (
            <button
              key={annotation.id}
              className={`w-full text-left rounded-lg border p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                selected
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/30'
                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950'
              }`}
              onClick={() => {
                setActiveAnnotationId(annotation.id);
                setPage(annotation.pageNumber);
              }}
            >
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Page {annotation.pageNumber} · {annotation.type}
              </div>
              <div className="mt-1 text-sm text-slate-800 dark:text-slate-100 truncate">{text}</div>
            </button>
          );
        })}
    </div>
  );
};

export default CommentsSidebar;
