'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Check, Flash, RefreshDouble, WarningTriangle, Xmark } from '@/components/ui/icons';
import { Spinner } from '@/components/ui/spinner';
import { useSetupStatus, useValidateApiKeys } from '@/lib/hooks';

function ApiKeyCard({
  name,
  description,
  configured,
  valid,
  error,
  isValidating,
}: {
  name: string;
  description: string;
  configured: boolean;
  valid: boolean | null | undefined;
  error?: string | null;
  isValidating: boolean;
}) {
  let statusIcon: React.ReactNode;
  let statusColor: string;
  let statusBg: string;
  let statusText: string;

  if (!configured) {
    statusIcon = <Xmark width={16} height={16} />;
    statusColor = 'text-sc-red';
    statusBg = 'bg-sc-red/10 border-sc-red/20';
    statusText = 'Not configured';
  } else if (isValidating) {
    statusIcon = <Spinner size="sm" color="cyan" />;
    statusColor = 'text-sc-cyan';
    statusBg = 'bg-sc-cyan/10 border-sc-cyan/20';
    statusText = 'Validating...';
  } else if (valid === true) {
    statusIcon = <Check width={16} height={16} />;
    statusColor = 'text-sc-green';
    statusBg = 'bg-sc-green/10 border-sc-green/20';
    statusText = 'Active';
  } else if (valid === false) {
    statusIcon = <WarningTriangle width={16} height={16} />;
    statusColor = 'text-sc-red';
    statusBg = 'bg-sc-red/10 border-sc-red/20';
    statusText = error || 'Invalid';
  } else {
    statusIcon = <RefreshDouble width={16} height={16} />;
    statusColor = 'text-sc-fg-muted';
    statusBg = 'bg-sc-bg-highlight border-sc-fg-subtle/10';
    statusText = 'Not validated';
  }

  return (
    <div className="bg-sc-bg-base rounded-lg border border-sc-fg-subtle/10 p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <h3 className="font-semibold text-sc-fg-primary mb-1">{name}</h3>
          <p className="text-sm text-sc-fg-muted">{description}</p>
        </div>
        <div
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-medium ${statusBg} ${statusColor}`}
        >
          {statusIcon}
          <span>{statusText}</span>
        </div>
      </div>

      {/* Environment variable hint */}
      {!configured && (
        <div className="mt-4 p-3 rounded-lg bg-sc-bg-highlight/50 border border-sc-fg-subtle/10">
          <p className="text-xs text-sc-fg-muted mb-1">Set this environment variable:</p>
          <code className="text-xs font-mono text-sc-cyan">
            {name === 'OpenAI' ? 'SIBYL_OPENAI_API_KEY' : 'SIBYL_ANTHROPIC_API_KEY'}=sk-...
          </code>
        </div>
      )}

      {/* Error details */}
      {valid === false && error && (
        <div className="mt-4 p-3 rounded-lg bg-sc-red/5 border border-sc-red/10">
          <p className="text-xs text-sc-red">{error}</p>
        </div>
      )}
    </div>
  );
}

export default function AIServicesPage() {
  const { data: status, isLoading } = useSetupStatus({ validateKeys: false });
  const {
    data: validation,
    refetch: revalidate,
    isLoading: isValidateLoading,
  } = useValidateApiKeys({ enabled: false });
  const [isValidating, setIsValidating] = useState(false);

  const handleValidate = async () => {
    setIsValidating(true);
    try {
      const result = await revalidate();
      if (result.data?.openai_valid && result.data?.anthropic_valid) {
        toast.success('All API keys validated successfully');
      } else {
        toast.error('Some API keys failed validation');
      }
    } catch {
      toast.error('Failed to validate API keys');
    } finally {
      setIsValidating(false);
    }
  };

  // Use validation results if available, otherwise fall back to status
  const openaiValid = validation?.openai_valid ?? status?.openai_valid;
  const anthropicValid = validation?.anthropic_valid ?? status?.anthropic_valid;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="bg-sc-bg-base rounded-lg border border-sc-fg-subtle/10 p-6">
          <div className="flex items-center gap-3 mb-4">
            <Flash width={20} height={20} className="text-sc-yellow" />
            <h2 className="text-lg font-semibold text-sc-fg-primary">AI Services</h2>
          </div>
          <div className="flex items-center justify-center py-8">
            <Spinner size="md" color="purple" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-sc-bg-base rounded-lg border border-sc-fg-subtle/10 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Flash width={20} height={20} className="text-sc-yellow" />
            <h2 className="text-lg font-semibold text-sc-fg-primary">AI Services</h2>
          </div>
          <button
            type="button"
            onClick={handleValidate}
            disabled={isValidating || isValidateLoading}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-sc-bg-highlight border border-sc-fg-subtle/20 text-sm font-medium text-sc-fg-secondary hover:bg-sc-bg-base transition-colors disabled:opacity-50"
          >
            {isValidating || isValidateLoading ? (
              <>
                <Spinner size="sm" color="current" />
                Validating...
              </>
            ) : (
              <>
                <RefreshDouble width={14} height={14} />
                Validate All
              </>
            )}
          </button>
        </div>
        <p className="text-sc-fg-muted">
          Sibyl uses external AI services for semantic search and entity extraction. API keys are
          configured via environment variables.
        </p>
      </div>

      {/* API Key Cards */}
      <div className="grid gap-4">
        <ApiKeyCard
          name="OpenAI"
          description="Powers vector embeddings for semantic search. Uses text-embedding-3-small model."
          configured={status?.openai_configured ?? false}
          valid={openaiValid}
          error={validation?.openai_error}
          isValidating={isValidating}
        />
        <ApiKeyCard
          name="Anthropic"
          description="Powers entity extraction and built-in agents. Uses Claude Haiku for extraction."
          configured={status?.anthropic_configured ?? false}
          valid={anthropicValid}
          error={validation?.anthropic_error}
          isValidating={isValidating}
        />
      </div>

      {/* Instructions */}
      <div className="bg-sc-bg-base rounded-lg border border-sc-fg-subtle/10 p-6">
        <h3 className="font-semibold text-sc-fg-primary mb-3">Configuration</h3>
        <div className="space-y-4 text-sm text-sc-fg-muted">
          <p>API keys are read from environment variables at server startup. To update them:</p>
          <ol className="list-decimal list-inside space-y-2 pl-2">
            <li>
              Set the environment variables in your <code className="text-sc-cyan">.env</code> file
              or deployment configuration
            </li>
            <li>Restart the Sibyl server for changes to take effect</li>
            <li>Return here and click "Validate All" to verify the keys work</li>
          </ol>
          <div className="mt-4 p-4 rounded-lg bg-sc-bg-highlight/50 font-mono text-xs">
            <p className="text-sc-fg-muted mb-2"># Example .env configuration</p>
            <p className="text-sc-cyan">SIBYL_OPENAI_API_KEY=sk-proj-...</p>
            <p className="text-sc-cyan">SIBYL_ANTHROPIC_API_KEY=sk-ant-api03-...</p>
          </div>
        </div>
      </div>
    </div>
  );
}
