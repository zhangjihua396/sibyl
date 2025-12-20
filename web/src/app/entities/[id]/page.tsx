'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';

import { useDeleteEntity, useEntity, useUpdateEntity } from '@/lib/hooks';

const entityColors: Record<string, string> = {
  pattern: 'bg-[#e135ff]/20 text-[#e135ff] border-[#e135ff]/30',
  rule: 'bg-[#ff6363]/20 text-[#ff6363] border-[#ff6363]/30',
  template: 'bg-[#80ffea]/20 text-[#80ffea] border-[#80ffea]/30',
  tool: 'bg-[#f1fa8c]/20 text-[#f1fa8c] border-[#f1fa8c]/30',
  language: 'bg-[#ff6ac1]/20 text-[#ff6ac1] border-[#ff6ac1]/30',
  topic: 'bg-[#ff00ff]/20 text-[#ff00ff] border-[#ff00ff]/30',
  episode: 'bg-[#50fa7b]/20 text-[#50fa7b] border-[#50fa7b]/30',
  knowledge_source: 'bg-[#8b85a0]/20 text-[#8b85a0] border-[#8b85a0]/30',
  config_file: 'bg-[#f1fa8c]/20 text-[#f1fa8c] border-[#f1fa8c]/30',
  slash_command: 'bg-[#80ffea]/20 text-[#80ffea] border-[#80ffea]/30',
};

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
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-sc-purple border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !entity) {
    return (
      <div className="text-center py-12">
        <p className="text-sc-red text-lg">Entity not found</p>
        <p className="text-sc-fg-muted text-sm mt-1">
          {error?.message || 'The requested entity does not exist'}
        </p>
        <Link
          href="/entities"
          className="inline-block mt-4 px-4 py-2 bg-sc-purple/20 text-sc-purple rounded-lg hover:bg-sc-purple/30 transition-colors"
        >
          ← Back to Entities
        </Link>
      </div>
    );
  }

  const colorClasses = entityColors[entity.entity_type] || entityColors.knowledge_source;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-sc-fg-muted">
        <Link href="/entities" className="hover:text-sc-purple transition-colors">
          Entities
        </Link>
        <span>/</span>
        <span className="text-sc-fg-primary">{entity.name}</span>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <span className={`px-3 py-1 text-sm rounded border capitalize ${colorClasses}`}>
              {entity.entity_type.replace(/_/g, ' ')}
            </span>
          </div>
          {isEditing ? (
            <input
              type="text"
              value={editedName}
              onChange={e => setEditedName(e.target.value)}
              className="text-2xl font-bold bg-sc-bg-highlight border border-sc-fg-subtle/20 rounded-lg px-3 py-1 text-sc-fg-primary w-full focus:border-sc-cyan focus:outline-none"
            />
          ) : (
            <h1 className="text-2xl font-bold text-sc-fg-primary">{entity.name}</h1>
          )}
        </div>

        <div className="flex items-center gap-2">
          {isEditing ? (
            <>
              <button
                type="button"
                onClick={handleCancel}
                className="px-4 py-2 rounded-lg border border-sc-fg-subtle/20 text-sc-fg-muted hover:text-sc-fg-primary transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={updateEntity.isPending}
                className="px-4 py-2 bg-sc-green/20 text-sc-green rounded-lg hover:bg-sc-green/30 disabled:opacity-50 transition-colors"
              >
                {updateEntity.isPending ? 'Saving...' : 'Save'}
              </button>
            </>
          ) : (
            <>
              <Link
                href={`/graph?selected=${entityId}`}
                className="px-4 py-2 bg-sc-purple/20 text-sc-purple rounded-lg hover:bg-sc-purple/30 transition-colors"
              >
                ⬡ View in Graph
              </Link>
              <button
                type="button"
                onClick={handleStartEdit}
                className="px-4 py-2 bg-sc-cyan/20 text-sc-cyan rounded-lg hover:bg-sc-cyan/30 transition-colors"
              >
                Edit
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleteEntity.isPending}
                className="px-4 py-2 bg-sc-red/20 text-sc-red rounded-lg hover:bg-sc-red/30 disabled:opacity-50 transition-colors"
              >
                {deleteEntity.isPending ? 'Deleting...' : 'Delete'}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Content Section */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          <div className="bg-sc-bg-base border border-sc-fg-subtle/20 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-sc-fg-primary mb-4">Description</h2>
            {isEditing ? (
              <textarea
                value={editedDescription}
                onChange={e => setEditedDescription(e.target.value)}
                rows={3}
                className="w-full bg-sc-bg-highlight border border-sc-fg-subtle/20 rounded-lg px-4 py-3 text-sc-fg-primary placeholder:text-sc-fg-subtle focus:border-sc-cyan focus:outline-none resize-none"
                placeholder="Enter description..."
              />
            ) : (
              <p className="text-sc-fg-muted whitespace-pre-wrap">
                {entity.description || 'No description available'}
              </p>
            )}
          </div>

          {/* Content */}
          <div className="bg-sc-bg-base border border-sc-fg-subtle/20 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-sc-fg-primary mb-4">Content</h2>
            {isEditing ? (
              <textarea
                value={editedContent}
                onChange={e => setEditedContent(e.target.value)}
                rows={12}
                className="w-full font-mono text-sm bg-sc-bg-highlight border border-sc-fg-subtle/20 rounded-lg px-4 py-3 text-sc-fg-primary placeholder:text-sc-fg-subtle focus:border-sc-cyan focus:outline-none resize-none"
                placeholder="Enter content..."
              />
            ) : (
              <pre className="font-mono text-sm text-sc-fg-muted whitespace-pre-wrap overflow-x-auto">
                {entity.content || 'No content available'}
              </pre>
            )}
          </div>
        </div>

        {/* Metadata Sidebar */}
        <div className="space-y-6">
          {/* Details */}
          <div className="bg-sc-bg-base border border-sc-fg-subtle/20 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-sc-fg-primary mb-4">Details</h2>
            <dl className="space-y-3">
              <div>
                <dt className="text-xs text-sc-fg-subtle uppercase tracking-wide">ID</dt>
                <dd className="text-sc-fg-muted font-mono text-sm mt-1 break-all">{entity.id}</dd>
              </div>
              {entity.source_file && (
                <div>
                  <dt className="text-xs text-sc-fg-subtle uppercase tracking-wide">Source File</dt>
                  <dd className="text-sc-fg-muted font-mono text-sm mt-1 break-all">
                    {entity.source_file}
                  </dd>
                </div>
              )}
              {entity.created_at && (
                <div>
                  <dt className="text-xs text-sc-fg-subtle uppercase tracking-wide">Created</dt>
                  <dd className="text-sc-fg-muted text-sm mt-1">
                    {new Date(entity.created_at).toLocaleString()}
                  </dd>
                </div>
              )}
              {entity.updated_at && (
                <div>
                  <dt className="text-xs text-sc-fg-subtle uppercase tracking-wide">Updated</dt>
                  <dd className="text-sc-fg-muted text-sm mt-1">
                    {new Date(entity.updated_at).toLocaleString()}
                  </dd>
                </div>
              )}
            </dl>
          </div>

          {/* Metadata */}
          {entity.metadata && Object.keys(entity.metadata).length > 0 && (
            <div className="bg-sc-bg-base border border-sc-fg-subtle/20 rounded-xl p-6">
              <h2 className="text-lg font-semibold text-sc-fg-primary mb-4">Metadata</h2>
              <pre className="font-mono text-xs text-sc-fg-muted whitespace-pre-wrap overflow-x-auto">
                {JSON.stringify(entity.metadata, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
