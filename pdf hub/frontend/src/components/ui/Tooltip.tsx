import React, { useState, useRef } from 'react';

interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactElement;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

export const Tooltip: React.FC<TooltipProps> = ({ children, content, position = 'bottom' }) => {
  const [isVisible, setIsVisible] = useState(false);
  const timeoutRef = useRef<number | null>(null);

  const show = () => {
    timeoutRef.current = window.setTimeout(() => setIsVisible(true), 300);
  };

  const hide = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsVisible(false);
  };

  const positionClasses = {
    top: 'bottom-full mb-2',
    bottom: 'top-full mt-2',
    left: 'right-full mr-2',
    right: 'left-full ml-2',
  };

  return (
    <div 
      className="relative inline-flex"
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
    >
      {children}
      {isVisible && (
        <div 
          role="tooltip"
          className={`absolute z-50 px-2 py-1 text-xs text-white bg-slate-900 dark:bg-slate-800 rounded shadow-md whitespace-nowrap ${positionClasses[position]}`}
          style={{
            left: position === 'top' || position === 'bottom' ? '50%' : undefined,
            top: position === 'left' || position === 'right' ? '50%' : undefined,
            transform: 
              position === 'top' || position === 'bottom' ? 'translateX(-50%)' : 
              position === 'left' || position === 'right' ? 'translateY(-50%)' : undefined
          }}
        >
          {content}
        </div>
      )}
    </div>
  );
};
