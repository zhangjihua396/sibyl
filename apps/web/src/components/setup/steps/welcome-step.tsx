'use client';

interface WelcomeStepProps {
  onNext: () => void;
}

export function WelcomeStep({ onNext }: WelcomeStepProps) {
  return (
    <div className="p-8">
      {/* Icon */}
      <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-sc-purple/20 to-sc-cyan/20 flex items-center justify-center">
        <svg
          className="w-8 h-8 text-sc-purple"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
          />
        </svg>
      </div>

      {/* Content */}
      <div className="text-center mb-8">
        <h2 className="text-2xl font-semibold text-sc-fg-primary mb-3">Welcome to Sibyl</h2>
        <p className="text-sc-fg-muted leading-relaxed max-w-md mx-auto">
          Sibyl is your AI-powered knowledge oracle. It gives Claude Code persistent memory, shared
          context, and task orchestration across your development sessions.
        </p>
      </div>

      {/* Features */}
      <div className="grid gap-4 mb-8">
        <Feature
          icon={
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
                strokeWidth={1.5}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          }
          title="Knowledge Graph"
          description="Capture patterns, decisions, and learnings in a persistent knowledge base"
        />
        <Feature
          icon={
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
                strokeWidth={1.5}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
              />
            </svg>
          }
          title="Task Tracking"
          description="Manage development tasks with full lifecycle tracking and learnings capture"
        />
        <Feature
          icon={
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
                strokeWidth={1.5}
                d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          }
          title="Claude Code Integration"
          description="Seamlessly connects to Claude Code via MCP for enhanced AI assistance"
        />
      </div>

      {/* CTA */}
      <button
        type="button"
        onClick={onNext}
        className="w-full py-3 px-4 rounded-lg bg-sc-purple text-white font-medium transition-all duration-200 hover:bg-sc-purple/90 hover:shadow-lg hover:shadow-sc-purple/25 active:scale-[0.98]"
      >
        Let's Get Started
      </button>
    </div>
  );
}

function Feature({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex gap-4 p-4 rounded-xl bg-sc-bg-base/50 border border-sc-fg-subtle/10">
      <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-sc-purple/10 flex items-center justify-center text-sc-purple">
        {icon}
      </div>
      <div>
        <h3 className="font-medium text-sc-fg-primary mb-0.5">{title}</h3>
        <p className="text-sm text-sc-fg-muted">{description}</p>
      </div>
    </div>
  );
}
