import React from 'react';
import { Button } from '@/components/ui/Button';
import { FolderOpen, Save, Download, FileOutput } from 'lucide-react';
import { Tooltip } from '@/components/ui/Tooltip';

export const ToolbarFile: React.FC = () => {
  return (
    <div className="flex items-center space-x-1 border-r border-slate-200 dark:border-slate-800 pr-2 mr-2">
      <Tooltip content="Open File">
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <FolderOpen className="w-4 h-4" />
        </Button>
      </Tooltip>
      <Tooltip content="Save">
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Save className="w-4 h-4" />
        </Button>
      </Tooltip>
      <Tooltip content="Export">
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <FileOutput className="w-4 h-4" />
        </Button>
      </Tooltip>
      <Tooltip content="Download">
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Download className="w-4 h-4" />
        </Button>
      </Tooltip>
    </div>
  );
};
