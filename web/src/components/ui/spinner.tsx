type SpinnerSize = 'sm' | 'md' | 'lg' | 'xl';

interface SpinnerProps {
  size?: SpinnerSize;
  color?: 'purple' | 'cyan' | 'white' | 'current';
  className?: string;
}

const sizes: Record<SpinnerSize, string> = {
  sm: 'w-4 h-4 border-2',
  md: 'w-6 h-6 border-2',
  lg: 'w-8 h-8 border-2',
  xl: 'w-12 h-12 border-3',
};

const colors: Record<NonNullable<SpinnerProps['color']>, string> = {
  purple: 'border-sc-purple border-t-transparent',
  cyan: 'border-sc-cyan border-t-transparent',
  white: 'border-white border-t-transparent',
  current: 'border-current border-t-transparent',
};

export function Spinner({ size = 'md', color = 'purple', className = '' }: SpinnerProps) {
  return (
    <div
      className={`
        rounded-full animate-spin
        ${sizes[size]}
        ${colors[color]}
        ${className}
      `}
      role="status"
      aria-label="Loading"
    />
  );
}

// Centered loading state for full sections
interface LoadingStateProps {
  size?: SpinnerSize;
  message?: string;
}

export function LoadingState({ size = 'lg', message }: LoadingStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <Spinner size={size} />
      {message && (
        <p className="mt-4 text-sc-fg-muted text-sm">{message}</p>
      )}
    </div>
  );
}

// Skeleton loaders for content placeholders
interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className = '' }: SkeletonProps) {
  return (
    <div
      className={`
        bg-sc-bg-highlight rounded animate-pulse
        ${className}
      `}
    />
  );
}

export function SkeletonCard() {
  return (
    <div className="bg-sc-bg-base border border-sc-fg-subtle/20 rounded-xl p-6 space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-5 w-5 rounded-full" />
      </div>
      <Skeleton className="h-8 w-32" />
      <Skeleton className="h-4 w-20" />
    </div>
  );
}

export function SkeletonList({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-sc-bg-base border border-sc-fg-subtle/20 rounded-xl p-4">
          <div className="flex items-start gap-4">
            <Skeleton className="h-6 w-16 rounded" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-4 w-full" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
