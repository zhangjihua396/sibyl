'use client';

import { Settings } from '@/components/ui/icons';

export default function SecurityPage() {
  return (
    <div className="space-y-6">
      <div className="bg-sc-bg-base rounded-lg border border-sc-fg-subtle/10 p-6">
        <div className="flex items-center gap-3 mb-4">
          <Settings width={20} height={20} className="text-sc-purple" />
          <h2 className="text-lg font-semibold text-sc-fg-primary">Security</h2>
        </div>
        <p className="text-sc-fg-muted">Manage your password, active sessions, and API keys.</p>
        <div className="mt-6 p-4 bg-sc-bg-highlight rounded-lg border border-sc-fg-subtle/10">
          <p className="text-sm text-sc-fg-subtle">
            Security settings coming soon. This will include password management, session
            management, and API key generation.
          </p>
        </div>
      </div>
    </div>
  );
}
