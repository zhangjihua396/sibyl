import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Spinner } from './spinner';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: ReactNode;
  children: ReactNode;
}

const variants: Record<ButtonVariant, string> = {
  primary:
    'bg-sc-purple text-white hover:bg-sc-purple/80 active:scale-[0.98] shadow-lg shadow-sc-purple/20',
  secondary:
    'bg-sc-bg-highlight border border-sc-fg-subtle/20 text-sc-fg-primary hover:border-sc-purple/50 hover:text-sc-purple',
  ghost:
    'bg-transparent text-sc-fg-muted hover:text-sc-fg-primary hover:bg-sc-bg-highlight',
  danger:
    'bg-sc-red/20 text-sc-red border border-sc-red/30 hover:bg-sc-red/30 hover:border-sc-red/50',
};

const sizes: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-sm rounded-lg gap-1.5',
  md: 'px-4 py-2 text-sm rounded-lg gap-2',
  lg: 'px-6 py-3 text-base rounded-xl gap-2.5',
};

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  disabled,
  children,
  className = '',
  ...props
}: ButtonProps) {
  return (
    <button
      type="button"
      disabled={disabled || loading}
      className={`
        inline-flex items-center justify-center font-medium
        transition-all duration-150 ease-out
        disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none
        focus-visible:outline focus-visible:outline-2 focus-visible:outline-sc-cyan focus-visible:outline-offset-2
        ${variants[variant]}
        ${sizes[size]}
        ${className}
      `}
      {...props}
    >
      {loading ? (
        <>
          <Spinner size={size === 'lg' ? 'md' : 'sm'} />
          <span className="ml-1">{children}</span>
        </>
      ) : (
        <>
          {icon && <span className="flex-shrink-0">{icon}</span>}
          {children}
        </>
      )}
    </button>
  );
}

// Specialized button variants for common patterns
interface ColorButtonProps extends Omit<ButtonProps, 'variant'> {
  color: 'purple' | 'cyan' | 'coral' | 'yellow' | 'green' | 'red';
}

const colorStyles: Record<ColorButtonProps['color'], string> = {
  purple: 'bg-sc-purple/20 text-sc-purple hover:bg-sc-purple/30 border border-sc-purple/30',
  cyan: 'bg-sc-cyan/20 text-sc-cyan hover:bg-sc-cyan/30 border border-sc-cyan/30',
  coral: 'bg-sc-coral/20 text-sc-coral hover:bg-sc-coral/30 border border-sc-coral/30',
  yellow: 'bg-sc-yellow/20 text-sc-yellow hover:bg-sc-yellow/30 border border-sc-yellow/30',
  green: 'bg-sc-green/20 text-sc-green hover:bg-sc-green/30 border border-sc-green/30',
  red: 'bg-sc-red/20 text-sc-red hover:bg-sc-red/30 border border-sc-red/30',
};

export function ColorButton({
  color,
  size = 'md',
  loading = false,
  icon,
  disabled,
  children,
  className = '',
  ...props
}: ColorButtonProps) {
  return (
    <button
      type="button"
      disabled={disabled || loading}
      className={`
        inline-flex items-center justify-center font-medium
        transition-all duration-150 ease-out
        disabled:opacity-50 disabled:cursor-not-allowed
        ${colorStyles[color]}
        ${sizes[size]}
        ${className}
      `}
      {...props}
    >
      {loading ? (
        <>
          <Spinner size={size === 'lg' ? 'md' : 'sm'} />
          <span className="ml-1">{children}</span>
        </>
      ) : (
        <>
          {icon && <span className="flex-shrink-0">{icon}</span>}
          {children}
        </>
      )}
    </button>
  );
}
