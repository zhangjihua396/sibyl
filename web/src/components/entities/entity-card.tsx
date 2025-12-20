'use client';

import Link from 'next/link';
import { EntityBadge } from '@/components/ui/badge';
import { getEntityStyles } from '@/lib/constants';

interface Entity {
  id: string;
  entity_type: string;
  name: string;
  description?: string | null;
  source_file?: string | null;
}

interface EntityCardProps {
  entity: Entity;
  onDelete?: (id: string) => void;
  showActions?: boolean;
}

export function EntityCard({ entity, onDelete, showActions = true }: EntityCardProps) {
  const styles = getEntityStyles(entity.entity_type);

  return (
    <div
      className={`
        bg-sc-bg-base border border-sc-fg-subtle/20 rounded-xl p-4
        transition-all duration-200 group
        hover:shadow-lg
        ${styles.card}
      `}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <EntityBadge type={entity.entity_type} />
          </div>
          <Link
            href={`/entities/${entity.id}`}
            className="block group-hover:text-sc-purple transition-colors"
          >
            <h3 className="text-lg font-semibold text-sc-fg-primary truncate">
              {entity.name}
            </h3>
          </Link>
          {entity.description && (
            <p className="text-sc-fg-muted text-sm mt-1 line-clamp-2">
              {entity.description}
            </p>
          )}
          {entity.source_file && (
            <p className="text-sc-fg-subtle text-xs mt-2 font-mono truncate">
              {entity.source_file}
            </p>
          )}
        </div>
        {showActions && (
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Link
              href={`/entities/${entity.id}`}
              className="p-2 text-sc-fg-muted hover:text-sc-cyan rounded-lg hover:bg-sc-bg-highlight transition-colors"
              title="View details"
            >
              ⧉
            </Link>
            {onDelete && (
              <button
                type="button"
                onClick={() => onDelete(entity.id)}
                className="p-2 text-sc-fg-muted hover:text-sc-red rounded-lg hover:bg-sc-red/10 transition-colors"
                title="Delete"
              >
                ✕
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Compact version for lists
interface EntityListItemProps {
  entity: Entity;
  onClick?: () => void;
}

export function EntityListItem({ entity, onClick }: EntityListItemProps) {
  const styles = getEntityStyles(entity.entity_type);

  const content = (
    <div className="flex items-center gap-3">
      <span className={`w-2 h-2 rounded-full ${styles.dot}`} />
      <span className="text-sc-fg-primary font-medium truncate flex-1">
        {entity.name}
      </span>
      <span className="text-xs text-sc-fg-subtle capitalize">
        {entity.entity_type.replace(/_/g, ' ')}
      </span>
    </div>
  );

  const className = `
    block w-full text-left bg-sc-bg-base border border-sc-fg-subtle/20 rounded-lg p-3
    transition-all duration-200 hover:shadow-md ${styles.card}
  `;

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={className}>
        {content}
      </button>
    );
  }

  return (
    <Link href={`/entities/${entity.id}`} className={className}>
      {content}
    </Link>
  );
}
