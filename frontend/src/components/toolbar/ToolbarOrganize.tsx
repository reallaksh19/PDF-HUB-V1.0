import React from 'react';
import { Button } from '@/components/ui/Button';
import { Layers, Scissors, PlusSquare, Trash2, RotateCw } from 'lucide-react';
import { Tooltip } from '@/components/ui/Tooltip';

export const ToolbarOrganize: React.FC = () => {
  return (
    <div className="flex items-center space-x-1 border-r border-slate-200 dark:border-slate-800 pr-2 mr-2">
      <Tooltip content="Merge Files">
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Layers className="w-4 h-4" />
        </Button>
      </Tooltip>
      <Tooltip content="Split File">
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Scissors className="w-4 h-4" />
        </Button>
      </Tooltip>
      <Tooltip content="Insert Page">
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <PlusSquare className="w-4 h-4" />
        </Button>
      </Tooltip>
      <Tooltip content="Delete Page">
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Trash2 className="w-4 h-4" />
        </Button>
      </Tooltip>
      <Tooltip content="Rotate Page">
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <RotateCw className="w-4 h-4" />
        </Button>
      </Tooltip>
    </div>
  );
};
