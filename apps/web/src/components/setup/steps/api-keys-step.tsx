'use client';

import { useState } from 'react';
import { Spinner } from '@/components/ui/spinner';
import type { SetupStatus } from '@/lib/api';
import { useValidateApiKeys } from '@/lib/hooks';

interface ApiKeysStepProps {
  initialStatus: SetupStatus | undefined;
  onBack: () => void;
  onValidated: (valid: boolean) => void;
}

export function ApiKeysStep({ initialStatus, onBack, onValidated }: ApiKeysStepProps) {
  const [isValidating, setIsValidating] = useState(false);
  const { data: validation, refetch, isLoading } = useValidateApiKeys({ enabled: false });

  const openaiConfigured = initialStatus?.openai_configured ?? false;
  const anthropicConfigured = initialStatus?.anthropic_configured ?? false;
  const bothConfigured = openaiConfigured && anthropicConfigured;

  const openaiValid = validation?.openai_valid ?? initialStatus?.openai_valid;
  const anthropicValid = validation?.anthropic_valid ?? initialStatus?.anthropic_valid;
  const bothValid = openaiValid === true && anthropicValid === true;

  const handleValidate = async () => {
    setIsValidating(true);
    try {
      const result = await refetch();
      if (result.data?.openai_valid && result.data?.anthropic_valid) {
        onValidated(true);
      }
    } finally {
      setIsValidating(false);
    }
  };

  const handleContinue = () => {
    if (bothValid) {
      onValidated(true);
    }
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-sc-cyan/20 to-sc-purple/20 flex items-center justify-center">
          <svg
            className="w-7 h-7 text-sc-cyan"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
            />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-sc-fg-primary mb-2">Verify API Keys</h2>
        <p className="text-sc-fg-muted text-sm max-w-md mx-auto">
          Sibyl needs API keys for semantic search (OpenAI) and entity extraction (Anthropic). Let's
          verify they're configured correctly.
        </p>
      </div>

      {/* API Key Status */}
      <div className="space-y-4 mb-8">
        <ApiKeyStatus
          name="OpenAI"
          description="Used for embeddings and semantic search"
          configured={openaiConfigured}
          valid={openaiValid}
          error={validation?.openai_error}
          isValidating={isValidating}
        />
        <ApiKeyStatus
          name="Anthropic"
          description="Used for entity extraction and agents"
          configured={anthropicConfigured}
          valid={anthropicValid}
          error={validation?.anthropic_error}
          isValidating={isValidating}
        />
      </div>

      {/* Configuration Instructions */}
      {!bothConfigured && (
        <div className="mb-6 p-4 rounded-xl bg-sc-yellow/10 border border-sc-yellow/20">
          <div className="flex gap-3">
            <svg
              className="w-5 h-5 text-sc-yellow flex-shrink-0 mt-0.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <div>
              <p className="text-sm font-medium text-sc-yellow mb-1">API Keys Not Configured</p>
              <p className="text-sm text-sc-fg-muted">
                Set these environment variables and restart the server:
              </p>
              <code className="block mt-2 text-xs font-mono text-sc-fg-secondary bg-sc-bg-base/50 p-2 rounded">
                SIBYL_OPENAI_API_KEY=sk-...
                <br />
                SIBYL_ANTHROPIC_API_KEY=sk-ant-...
              </code>
            </div>
          </div>
        </div>
      )}

      {/* Buttons */}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={onBack}
          className="flex-1 py-2.5 px-4 rounded-lg border border-sc-fg-subtle/20 text-sc-fg-secondary font-medium text-sm transition-colors hover:bg-sc-bg-base"
        >
          Back
        </button>

        {bothValid ? (
          <button
            type="button"
            onClick={handleContinue}
            className="flex-1 py-2.5 px-4 rounded-lg bg-sc-purple text-white font-medium text-sm transition-all hover:bg-sc-purple/90 hover:shadow-lg hover:shadow-sc-purple/25"
          >
            Continue
          </button>
        ) : bothConfigured ? (
          <button
            type="button"
            onClick={handleValidate}
            disabled={isValidating || isLoading}
            className="flex-1 py-2.5 px-4 rounded-lg bg-sc-cyan text-sc-bg-dark font-medium text-sm transition-all hover:bg-sc-cyan/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isValidating || isLoading ? (
              <>
                <Spinner size="sm" color="current" />
                Validating...
              </>
            ) : (
              'Validate Keys'
            )}
          </button>
        ) : (
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="flex-1 py-2.5 px-4 rounded-lg bg-sc-fg-subtle/20 text-sc-fg-secondary font-medium text-sm transition-colors hover:bg-sc-fg-subtle/30"
          >
            Refresh
          </button>
        )}
      </div>
    </div>
  );
}

function ApiKeyStatus({
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
  error: string | null | undefined;
  isValidating: boolean;
}) {
  let statusIcon: React.ReactNode;
  let statusColor: string;
  let statusText: string;

  if (!configured) {
    statusIcon = (
      <svg
        aria-hidden="true"
        className="w-5 h-5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M6 18L18 6M6 6l12 12"
        />
      </svg>
    );
    statusColor = 'text-sc-red';
    statusText = 'Not configured';
  } else if (isValidating) {
    statusIcon = <Spinner size="sm" color="cyan" />;
    statusColor = 'text-sc-cyan';
    statusText = 'Validating...';
  } else if (valid === true) {
    statusIcon = (
      <svg
        aria-hidden="true"
        className="w-5 h-5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
    );
    statusColor = 'text-sc-green';
    statusText = 'Valid';
  } else if (valid === false) {
    statusIcon = (
      <svg
        aria-hidden="true"
        className="w-5 h-5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
        />
      </svg>
    );
    statusColor = 'text-sc-red';
    statusText = error || 'Invalid';
  } else {
    statusIcon = (
      <svg
        aria-hidden="true"
        className="w-5 h-5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    );
    statusColor = 'text-sc-fg-muted';
    statusText = 'Not validated';
  }

  return (
    <div className="flex items-center justify-between p-4 rounded-xl bg-sc-bg-base/50 border border-sc-fg-subtle/10">
      <div>
        <h3 className="font-medium text-sc-fg-primary">{name}</h3>
        <p className="text-sm text-sc-fg-muted">{description}</p>
      </div>
      <div className={`flex items-center gap-2 ${statusColor}`}>
        {statusIcon}
        <span className="text-sm font-medium">{statusText}</span>
      </div>
    </div>
  );
}
