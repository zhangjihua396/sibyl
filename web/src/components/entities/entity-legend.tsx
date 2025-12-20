import { ENTITY_COLORS, ENTITY_TYPES } from '@/lib/constants';

interface LegendProps {
  types?: string[];
  compact?: boolean;
  className?: string;
}

export function EntityLegend({ types, compact = false, className = '' }: LegendProps) {
  const displayTypes = types ?? ENTITY_TYPES.filter(t =>
    !['config_file', 'slash_command', 'knowledge_source'].includes(t)
  );

  if (compact) {
    return (
      <div className={`flex flex-wrap gap-3 text-xs ${className}`}>
        {displayTypes.map(type => (
          <div key={type} className="flex items-center gap-1.5">
            <span
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: ENTITY_COLORS[type as keyof typeof ENTITY_COLORS] }}
            />
            <span className="text-sc-fg-subtle capitalize">{type.replace(/_/g, ' ')}</span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={`bg-sc-bg-base border border-sc-fg-subtle/20 rounded-lg p-4 ${className}`}>
      <div className="flex flex-wrap gap-4 text-sm">
        {displayTypes.map(type => (
          <div key={type} className="flex items-center gap-2">
            <span
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: ENTITY_COLORS[type as keyof typeof ENTITY_COLORS] }}
            />
            <span className="text-sc-fg-muted capitalize">{type.replace(/_/g, ' ')}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Stats breakdown by entity type
interface EntityBreakdownProps {
  counts: Record<string, number>;
  loading?: boolean;
}

export function EntityBreakdown({ counts, loading }: EntityBreakdownProps) {
  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="w-8 h-8 border-2 border-sc-purple border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const entries = Object.entries(counts);

  if (entries.length === 0) {
    return (
      <p className="text-sc-fg-muted text-center py-8">No entities yet</p>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
      {entries.map(([type, count]) => {
        const color = ENTITY_COLORS[type as keyof typeof ENTITY_COLORS] ?? '#8b85a0';
        return (
          <div
            key={type}
            className="bg-sc-bg-highlight rounded-lg p-4 border border-sc-fg-subtle/10 group hover:border-sc-fg-subtle/30 transition-colors"
          >
            <div className="flex items-center gap-2 mb-2">
              <span
                className="w-3 h-3 rounded-full transition-transform group-hover:scale-110"
                style={{ backgroundColor: color }}
              />
              <span className="text-sm font-medium text-sc-fg-muted capitalize">
                {type.replace(/_/g, ' ')}
              </span>
            </div>
            <p className="text-xl font-bold text-sc-fg-primary">{count}</p>
          </div>
        );
      })}
    </div>
  );
}
