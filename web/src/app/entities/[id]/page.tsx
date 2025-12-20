'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';

import { Card } from '@/components/ui/card';
import { Button, ColorButton } from '@/components/ui/button';
import { Input, Textarea } from '@/components/ui/input';
import { LoadingState } from '@/components/ui/spinner';
import { ErrorState } from '@/components/ui/tooltip';
import { EntityBadge } from '@/components/ui/badge';
import { Breadcrumb } from '@/components/layout/page-header';
import { useDeleteEntity, useEntity, useUpdateEntity } from '@/lib/hooks';
import { formatDateTime } from '@/lib/constants';

export default function EntityDetailPage() {
  const params = useParams();
  const router = useRouter();
  const entityId = params.id as string;

  const { data: entity, isLoading, error } = useEntity(entityId);
  const updateEntity = useUpdateEntity();
  const deleteEntity = useDeleteEntity();

  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState('');
  const [editedDescription, setEditedDescription] = useState('');
  const [editedContent, setEditedContent] = useState('');

  const handleStartEdit = () => {
    if (entity) {
      setEditedName(entity.name);
      setEditedDescription(entity.description || '');
      setEditedContent(entity.content || '');
      setIsEditing(true);
    }
  };

  const handleSave = async () => {
    await updateEntity.mutateAsync({
      id: entityId,
      updates: {
        name: editedName,
        description: editedDescription,
        content: editedContent,
      },
    });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this entity? This action cannot be undone.')) {
      await deleteEntity.mutateAsync(entityId);
      router.push('/entities');
    }
  };

  if (isLoading) {
    return <LoadingState message="Loading entity..." />;
  }

  if (error || !entity) {
    return (
      <ErrorState
        title="Entity not found"
        message={error?.message || 'The requested entity does not exist'}
        action={
          <Link href="/entities">
            <ColorButton color="purple">← Back to Entities</ColorButton>
          </Link>
        }
      />
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <Breadcrumb
        items={[
          { label: 'Entities', href: '/entities' },
          { label: entity.name },
        ]}
      />

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <EntityBadge type={entity.entity_type} size="md" />
          </div>
          {isEditing ? (
            <Input
              type="text"
              value={editedName}
              onChange={(e) => setEditedName(e.target.value)}
              className="text-2xl font-bold"
            />
          ) : (
            <h1 className="text-2xl font-bold text-sc-fg-primary">{entity.name}</h1>
          )}
        </div>

        <div className="flex items-center gap-2">
          {isEditing ? (
            <>
              <Button variant="secondary" onClick={handleCancel}>
                Cancel
              </Button>
              <ColorButton
                color="green"
                onClick={handleSave}
                disabled={updateEntity.isPending}
              >
                {updateEntity.isPending ? 'Saving...' : 'Save'}
              </ColorButton>
            </>
          ) : (
            <>
              <Link href={`/graph?selected=${entityId}`}>
                <ColorButton color="purple" icon="⬡">
                  View in Graph
                </ColorButton>
              </Link>
              <ColorButton color="cyan" onClick={handleStartEdit}>
                Edit
              </ColorButton>
              <ColorButton
                color="red"
                onClick={handleDelete}
                disabled={deleteEntity.isPending}
              >
                {deleteEntity.isPending ? 'Deleting...' : 'Delete'}
              </ColorButton>
            </>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Content Section */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          <Card>
            <h2 className="text-lg font-semibold text-sc-fg-primary mb-4">Description</h2>
            {isEditing ? (
              <Textarea
                value={editedDescription}
                onChange={(e) => setEditedDescription(e.target.value)}
                rows={3}
                placeholder="Enter description..."
              />
            ) : (
              <p className="text-sc-fg-muted whitespace-pre-wrap">
                {entity.description || 'No description available'}
              </p>
            )}
          </Card>

          {/* Content */}
          <Card>
            <h2 className="text-lg font-semibold text-sc-fg-primary mb-4">Content</h2>
            {isEditing ? (
              <Textarea
                value={editedContent}
                onChange={(e) => setEditedContent(e.target.value)}
                rows={12}
                monospace
                placeholder="Enter content..."
              />
            ) : (
              <pre className="font-mono text-sm text-sc-fg-muted whitespace-pre-wrap overflow-x-auto">
                {entity.content || 'No content available'}
              </pre>
            )}
          </Card>
        </div>

        {/* Metadata Sidebar */}
        <div className="space-y-6">
          {/* Details */}
          <Card>
            <h2 className="text-lg font-semibold text-sc-fg-primary mb-4">Details</h2>
            <dl className="space-y-3">
              <div>
                <dt className="text-xs text-sc-fg-subtle uppercase tracking-wide">ID</dt>
                <dd className="text-sc-fg-muted font-mono text-sm mt-1 break-all">
                  {entity.id}
                </dd>
              </div>
              {entity.source_file && (
                <div>
                  <dt className="text-xs text-sc-fg-subtle uppercase tracking-wide">
                    Source File
                  </dt>
                  <dd className="text-sc-fg-muted font-mono text-sm mt-1 break-all">
                    {entity.source_file}
                  </dd>
                </div>
              )}
              {entity.created_at && (
                <div>
                  <dt className="text-xs text-sc-fg-subtle uppercase tracking-wide">Created</dt>
                  <dd className="text-sc-fg-muted text-sm mt-1">
                    {formatDateTime(entity.created_at)}
                  </dd>
                </div>
              )}
              {entity.updated_at && (
                <div>
                  <dt className="text-xs text-sc-fg-subtle uppercase tracking-wide">Updated</dt>
                  <dd className="text-sc-fg-muted text-sm mt-1">
                    {formatDateTime(entity.updated_at)}
                  </dd>
                </div>
              )}
            </dl>
          </Card>

          {/* Metadata */}
          {entity.metadata && Object.keys(entity.metadata).length > 0 && (
            <Card>
              <h2 className="text-lg font-semibold text-sc-fg-primary mb-4">Metadata</h2>
              <pre className="font-mono text-xs text-sc-fg-muted whitespace-pre-wrap overflow-x-auto">
                {JSON.stringify(entity.metadata, null, 2)}
              </pre>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
