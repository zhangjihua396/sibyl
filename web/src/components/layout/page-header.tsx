import type { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  description?: string;
  action?: ReactNode;
  meta?: ReactNode;
}

export function PageHeader({ title, description, action, meta }: PageHeaderProps) {
  return (
    <div className="flex items-start justify-between gap-4 mb-6">
      <div>
        <h1 className="text-2xl font-bold text-sc-fg-primary">{title}</h1>
        {description && (
          <p className="text-sc-fg-muted mt-1">{description}</p>
        )}
      </div>
      <div className="flex items-center gap-3">
        {meta && (
          <div className="text-sc-fg-subtle text-sm">{meta}</div>
        )}
        {action}
      </div>
    </div>
  );
}

// Breadcrumb navigation
interface BreadcrumbProps {
  items: { label: string; href?: string }[];
}

export function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <nav className="flex items-center gap-2 text-sm text-sc-fg-muted mb-4">
      {items.map((item, index) => (
        <span key={item.label} className="flex items-center gap-2">
          {index > 0 && <span className="text-sc-fg-subtle">/</span>}
          {item.href ? (
            <a
              href={item.href}
              className="hover:text-sc-purple transition-colors"
            >
              {item.label}
            </a>
          ) : (
            <span className="text-sc-fg-primary">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
