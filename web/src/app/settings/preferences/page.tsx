'use client';

import { Settings } from '@/components/ui/icons';

export default function PreferencesPage() {
  return (
    <div className="space-y-6">
      <div className="bg-sc-bg-base rounded-lg border border-sc-fg-subtle/10 p-6">
        <div className="flex items-center gap-3 mb-4">
          <Settings width={20} height={20} className="text-sc-purple" />
          <h2 className="text-lg font-semibold text-sc-fg-primary">Preferences</h2>
        </div>
        <p className="text-sc-fg-muted">
          Configure your display preferences, theme, and behavior settings.
        </p>
        <div className="mt-6 p-4 bg-sc-bg-highlight rounded-lg border border-sc-fg-subtle/10">
          <p className="text-sm text-sc-fg-subtle">
            Preferences settings coming soon. This will include theme selection, locale settings,
            and display options.
          </p>
        </div>
      </div>
    </div>
  );
}
