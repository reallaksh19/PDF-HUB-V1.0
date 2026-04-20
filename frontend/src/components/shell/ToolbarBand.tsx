import React from 'react';
import { ToolbarFile } from '@/components/toolbar/ToolbarFile';
import { ToolbarOrganize } from '@/components/toolbar/ToolbarOrganize';
import { ToolbarComment } from '@/components/toolbar/ToolbarComment';
import { ToolbarOcr } from '@/components/toolbar/ToolbarOcr';
import { ToolbarView } from '@/components/toolbar/ToolbarView';

export const ToolbarBand: React.FC = () => {
  return (
    <div className="flex items-center px-4 h-12 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 overflow-x-auto overflow-y-hidden">
      <ToolbarFile />
      <ToolbarOrganize />
      <ToolbarComment />
      <ToolbarOcr />
      <ToolbarView />
    </div>
  );
};
