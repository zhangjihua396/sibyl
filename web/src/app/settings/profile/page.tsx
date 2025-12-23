'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { EditableText } from '@/components/editable';
import { User } from '@/components/ui/icons';

interface UserProfile {
  id: string;
  email: string | null;
  name: string | null;
  bio: string | null;
  timezone: string | null;
  avatar_url: string | null;
  email_verified_at: string | null;
  created_at: string;
}

async function fetchProfile(): Promise<UserProfile> {
  const response = await fetch('/api/users/me/profile');
  if (!response.ok) {
    throw new Error('Failed to fetch profile');
  }
  return response.json();
}

async function updateProfile(data: Partial<UserProfile>): Promise<UserProfile> {
  const response = await fetch('/api/users/me/profile', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error('Failed to update profile');
  }
  return response.json();
}

function ProfileSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="bg-sc-bg-base rounded-lg border border-sc-fg-subtle/10 p-6">
        <div className="flex items-start gap-6">
          <div className="w-20 h-20 rounded-full bg-sc-bg-highlight" />
          <div className="flex-1 space-y-3">
            <div className="h-6 w-48 bg-sc-bg-highlight rounded" />
            <div className="h-4 w-32 bg-sc-bg-highlight rounded" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const queryClient = useQueryClient();

  const {
    data: profile,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['user', 'profile'],
    queryFn: fetchProfile,
  });

  const updateMutation = useMutation({
    mutationFn: updateProfile,
    onSuccess: data => {
      queryClient.setQueryData(['user', 'profile'], data);
      toast.success('Profile updated');
    },
    onError: () => {
      toast.error('Failed to update profile');
    },
  });

  if (isLoading) {
    return <ProfileSkeleton />;
  }

  if (error || !profile) {
    return (
      <div className="bg-sc-bg-base rounded-lg border border-sc-red/20 p-6">
        <p className="text-sc-red">Failed to load profile. Please try again.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Avatar and Name */}
      <div className="bg-sc-bg-base rounded-lg border border-sc-fg-subtle/10 p-6">
        <div className="flex items-start gap-6">
          {/* Avatar */}
          <div className="relative shrink-0">
            {profile.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt={profile.name || 'Avatar'}
                className="w-20 h-20 rounded-full border-2 border-sc-purple/30"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-sc-bg-highlight border-2 border-sc-fg-subtle/20 flex items-center justify-center">
                <User width={32} height={32} className="text-sc-fg-muted" />
              </div>
            )}
          </div>

          {/* Name and Email */}
          <div className="flex-1 min-w-0 space-y-3">
            <div>
              <span className="block text-xs text-sc-fg-subtle uppercase tracking-wide mb-1">
                Name
              </span>
              <EditableText
                value={profile.name || ''}
                onSave={async name => {
                  await updateMutation.mutateAsync({ name });
                }}
                placeholder="Enter your name"
                className="text-lg font-semibold text-sc-fg-primary"
              />
            </div>

            <div>
              <span className="block text-xs text-sc-fg-subtle uppercase tracking-wide mb-1">
                Email
              </span>
              <p className="text-sc-fg-muted">
                {profile.email || 'No email set'}
                {profile.email_verified_at && (
                  <span className="ml-2 text-xs text-sc-green">(verified)</span>
                )}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Bio */}
      <div className="bg-sc-bg-base rounded-lg border border-sc-fg-subtle/10 p-6">
        <span className="block text-xs text-sc-fg-subtle uppercase tracking-wide mb-2">Bio</span>
        <EditableText
          value={profile.bio || ''}
          onSave={async bio => {
            await updateMutation.mutateAsync({ bio });
          }}
          placeholder="Tell us about yourself..."
          className="text-sc-fg-secondary"
          multiline
          rows={4}
        />
      </div>

      {/* Timezone */}
      <div className="bg-sc-bg-base rounded-lg border border-sc-fg-subtle/10 p-6">
        <span className="block text-xs text-sc-fg-subtle uppercase tracking-wide mb-2">
          Timezone
        </span>
        <EditableText
          value={profile.timezone || ''}
          onSave={async timezone => {
            await updateMutation.mutateAsync({ timezone });
          }}
          placeholder="e.g., America/Los_Angeles"
          className="text-sc-fg-secondary"
        />
        <p className="text-xs text-sc-fg-subtle mt-2">
          Used for displaying dates and times in your local timezone.
        </p>
      </div>

      {/* Account Info */}
      <div className="bg-sc-bg-base rounded-lg border border-sc-fg-subtle/10 p-6">
        <h3 className="text-sm font-medium text-sc-fg-primary mb-4">Account Information</h3>
        <dl className="space-y-3 text-sm">
          <div className="flex justify-between">
            <dt className="text-sc-fg-muted">User ID</dt>
            <dd className="font-mono text-sc-coral text-xs">{profile.id}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-sc-fg-muted">Member since</dt>
            <dd className="text-sc-fg-secondary">
              {new Date(profile.created_at).toLocaleDateString(undefined, {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
