import type { HTMLAttributes, ReactNode } from 'react';

type CardVariant = 'default' | 'elevated' | 'interactive' | 'bordered';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  glow?: boolean;
  children: ReactNode;
}

const variants: Record<CardVariant, string> = {
  default: 'bg-sc-bg-base border border-sc-fg-subtle/20',
  elevated: 'bg-sc-bg-elevated border border-sc-fg-subtle/10 shadow-xl shadow-black/20',
  interactive:
    'bg-sc-bg-base border border-sc-fg-subtle/20 hover:border-sc-purple/30 transition-all duration-200 cursor-pointer hover:shadow-lg hover:shadow-sc-purple/5',
  bordered: 'bg-transparent border-2 border-sc-fg-subtle/30',
};

export function Card({
  variant = 'default',
  glow = false,
  children,
  className = '',
  ...props
}: CardProps) {
  return (
    <div
      className={`
        rounded-xl p-6
        ${variants[variant]}
        ${glow ? 'animate-pulse-glow' : ''}
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  );
}

interface CardHeaderProps {
  title: string;
  description?: string;
  action?: ReactNode;
  icon?: ReactNode;
}

export function CardHeader({ title, description, action, icon }: CardHeaderProps) {
  return (
    <div className="flex items-start justify-between gap-4 mb-4">
      <div className="flex items-start gap-3">
        {icon && (
          <div className="flex-shrink-0 text-sc-purple text-xl">{icon}</div>
        )}
        <div>
          <h3 className="text-lg font-semibold text-sc-fg-primary">{title}</h3>
          {description && (
            <p className="text-sm text-sc-fg-muted mt-0.5">{description}</p>
          )}
        </div>
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  sublabel?: string;
  loading?: boolean;
}

export function StatCard({ label, value, icon, trend, sublabel, loading }: StatCardProps) {
  const trendColors = {
    up: 'text-sc-green',
    down: 'text-sc-red',
    neutral: 'text-sc-fg-subtle',
  };

  return (
    <Card variant="default" className="relative overflow-hidden group">
      {/* Subtle gradient accent on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-sc-purple/0 to-sc-purple/5 opacity-0 group-hover:opacity-100 transition-opacity" />

      <div className="relative">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-sm font-medium text-sc-fg-muted">{label}</h4>
          {icon && <span className="text-sc-purple">{icon}</span>}
        </div>
        <div className="text-2xl font-bold text-sc-fg-primary">
          {loading ? (
            <div className="h-8 w-16 bg-sc-bg-highlight rounded animate-pulse" />
          ) : (
            value
          )}
        </div>
        {sublabel && (
          <p className={`text-sm mt-1 ${trend ? trendColors[trend] : 'text-sc-fg-subtle'}`}>
            {sublabel}
          </p>
        )}
      </div>
    </Card>
  );
}
