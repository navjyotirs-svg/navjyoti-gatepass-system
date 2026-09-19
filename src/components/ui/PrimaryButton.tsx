import React from 'react';
import { LucideIcon } from 'lucide-react';

interface PrimaryButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon?: LucideIcon;
  isLoading?: boolean;
  loadingText?: string;
  variant?: 'primary' | 'secondary' | 'danger';
}

export function PrimaryButton({ 
  children, 
  icon: Icon, 
  isLoading, 
  loadingText, 
  variant = 'primary',
  className = '',
  ...props 
}: PrimaryButtonProps) {
  
  const baseClasses = "flex-1 min-h-[48px] sm:min-h-[52px] h-auto py-3 px-3 rounded-xl text-xs sm:text-sm font-bold uppercase tracking-wider flex items-center justify-center gap-2 active:scale-[0.98] transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 shadow-sm break-words";
  
  let variantClasses = "";
  switch(variant) {
    case 'primary':
      variantClasses = "bg-primary text-on-primary hover:bg-primary/90 focus:ring-primary";
      break;
    case 'secondary':
      variantClasses = "bg-surface-container-lowest border-2 border-outline-variant text-on-surface hover:bg-surface-container-low focus:ring-outline";
      break;
    case 'danger':
      variantClasses = "bg-error text-white hover:bg-error/90 focus:ring-error";
      break;
  }

  return (
    <button className={`${baseClasses} ${variantClasses} ${className}`} disabled={isLoading || props.disabled} {...props}>
      {isLoading ? (
        <span className="break-words">{loadingText || 'Loading...'}</span>
      ) : (
        <>
          <span className="break-words">{children}</span>
          {Icon && <Icon className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />}
        </>
      )}
    </button>
  );
}
