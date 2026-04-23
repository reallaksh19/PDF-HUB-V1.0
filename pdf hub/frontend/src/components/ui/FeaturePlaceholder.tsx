import React from 'react';

interface FeaturePlaceholderProps {
  name: string;
  description?: string;
  icon?: React.ReactNode;
}

export const FeaturePlaceholder: React.FC<FeaturePlaceholderProps> = ({ 
  name, 
  description,
  icon 
}) => {
  return (
    <div className="flex flex-col items-center justify-center h-full p-8 text-center text-slate-500 dark:text-slate-400 space-y-4">
      {icon ? (
        <div className="w-12 h-12 text-slate-400 dark:text-slate-500">
          {icon}
        </div>
      ) : (
        <svg className="w-12 h-12 text-slate-400 dark:text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
        </svg>
      )}
      <div>
        <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100">{name}</h3>
        {description && <p className="mt-1 text-sm">{description}</p>}
        <p className="mt-2 text-xs uppercase tracking-wider font-semibold text-slate-400 dark:text-slate-500">Coming soon</p>
      </div>
    </div>
  );
};
