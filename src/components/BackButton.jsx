import React from 'react';
import { ChevronLeft } from 'lucide-react';

/**
 * Global Reusable BackButton
 * Circular light-shaded container with tactile press feedback
 * 36px x 36px, rounded-full
 */
const BackButton = ({
  onClick,
  className = '',
  icon: Icon = ChevronLeft,
  size = 20,
  strokeWidth = 2.4,
  variant = 'soft-blue', // 'soft-blue' | 'white' | 'default'
  ariaLabel = 'Go back',
  ...props
}) => {
  const isWhite = variant === 'white';
  const sizeClass = 'w-[38px] h-[38px] min-w-[38px] min-h-[38px]';

  const variantStyles = isWhite
    ? 'bg-[rgba(255,255,255,0.16)] border-[rgba(255,255,255,0.2)] text-white hover:bg-[rgba(255,255,255,0.22)] active:bg-[rgba(255,255,255,0.28)]'
    : 'bg-white dark:bg-[rgba(30,41,59,0.92)] border-[rgba(37,99,235,0.2)] dark:border-[rgba(96,165,250,0.24)] shadow-[0_2px_6px_rgba(30,58,138,0.08)] dark:shadow-[0_2px_6px_rgba(0,0,0,0.28)] text-[#0F172A] dark:text-[#F8FAFC] hover:bg-blue-50/50 dark:hover:bg-[#253347] active:bg-blue-50 dark:active:bg-[#2e3e57]';

  const handleClick = (e) => {
    if (typeof document !== 'undefined' && document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    if (onClick) {
      onClick(e);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={ariaLabel}
      className={`app-back-btn app-header-back-btn ${sizeClass} rounded-full inline-flex items-center justify-center flex-shrink-0 border shadow-sm transition-[transform,background-color] duration-150 ease-out active:scale-[0.92] cursor-pointer select-none ${variant === 'white' ? 'app-back-btn-white' : ''} ${variantStyles} ${className}`}
      {...props}
    >
      <Icon
        size={size}
        strokeWidth={strokeWidth}
        className={`pointer-events-none ${Icon === ChevronLeft ? '-ml-0.5' : ''}`}
      />
    </button>
  );
};

export default BackButton;
