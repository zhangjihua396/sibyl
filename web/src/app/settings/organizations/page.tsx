'use client';

import { Users } from '@/components/ui/icons';

export default function OrganizationsPage() {
  return (
    <div className="space-y-6">
      <div className="bg-sc-bg-base rounded-lg border border-sc-fg-subtle/10 p-6">
        <div className="flex items-center gap-3 mb-4">
          <Users width={20} height={20} className="text-sc-purple" />
          <h2 className="text-lg font-semibold text-sc-fg-primary">Organizations</h2>
        </div>
        <p className="text-sc-fg-muted">View and manage your organization memberships.</p>
        <div className="mt-6 p-4 bg-sc-bg-highlight rounded-lg border border-sc-fg-subtle/10">
          <p className="text-sm text-sc-fg-subtle">
            Organization settings coming soon. This will include organization listing, member
            management, and organization settings.
          </p>
        </div>
      </div>
    </div>
  );
}
