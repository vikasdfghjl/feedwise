import React from 'react';
import { cn } from '@/lib/utils';

interface SpinnerProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  color?: string;
}

export const Spinner = ({ 
  className, 
  size = 'md', 
  color 
}: SpinnerProps) => {
  const sizeMap = {
    sm: '20px',
    md: '35px',
    lg: '50px'
  };

  const spinnerSize = sizeMap[size];
  const spinnerColor = color || '#5D3FD3';

  return (
    <div 
      className={cn("three-body", className)} 
      style={{ 
        '--uib-size': spinnerSize, 
        '--uib-color': spinnerColor 
      } as React.CSSProperties}
    >
      <div className="three-body__dot"></div>
      <div className="three-body__dot"></div>
      <div className="three-body__dot"></div>
    </div>
  );
};