'use client';

/**
 * UserQuestionMessage - Inline question UI in agent chat.
 *
 * Displays when an agent calls AskUserQuestion, presenting
 * options for the user to choose from.
 */

import { formatDistanceToNow } from 'date-fns';
import { memo, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Check, Clock, InfoCircle } from '@/components/ui/icons';
import { Spinner } from '@/components/ui/spinner';
import { useAnswerQuestion } from '@/lib/hooks';

// Question option from AskUserQuestion tool
export interface QuestionOption {
  label: string;
  description?: string;
}

// Single question structure matching Claude's AskUserQuestion tool
export interface Question {
  question: string;
  header: string;
  options: QuestionOption[];
  multiSelect?: boolean;
}

export interface UserQuestionMessageProps {
  questionId: string;
  questions: Question[];
  expiresAt?: string;
  status?: 'pending' | 'answered' | 'expired';
  answers?: Record<string, string>;
}

export const UserQuestionMessage = memo(function UserQuestionMessage({
  questionId,
  questions,
  expiresAt,
  status = 'pending',
  answers,
}: UserQuestionMessageProps) {
  const answerMutation = useAnswerQuestion();
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [customInputs, setCustomInputs] = useState<Record<string, string>>({});

  const isPending = status === 'pending';
  const isExpiredTime = expiresAt && new Date(expiresAt) < new Date();
  const isResolved = !isPending || isExpiredTime;

  const handleOptionSelect = (questionIndex: number, optionLabel: string) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionIndex]: optionLabel,
    }));
    // Clear custom input when selecting an option
    setCustomInputs((prev) => {
      const next = { ...prev };
      delete next[questionIndex];
      return next;
    });
  };

  const handleCustomInput = (questionIndex: number, value: string) => {
    setCustomInputs((prev) => ({
      ...prev,
      [questionIndex]: value,
    }));
    // Clear selected option when typing custom
    setSelectedAnswers((prev) => {
      const next = { ...prev };
      delete next[questionIndex];
      return next;
    });
  };

  const handleSubmit = () => {
    // Build final answers - prefer custom input over selected option
    const finalAnswers: Record<string, string> = {};
    questions.forEach((q, i) => {
      const key = q.header || `q${i}`;
      if (customInputs[i]) {
        finalAnswers[key] = customInputs[i];
      } else if (selectedAnswers[i]) {
        finalAnswers[key] = selectedAnswers[i];
      }
    });

    answerMutation.mutate({
      id: questionId,
      request: { answers: finalAnswers },
    });
  };

  // Check if all questions have answers
  const allAnswered = questions.every(
    (_, i) => selectedAnswers[i] !== undefined || customInputs[i]
  );

  // Border/background colors based on status
  const statusStyles = isPending
    ? 'border-sc-cyan/50 bg-sc-cyan/5'
    : 'border-sc-green/30 bg-sc-green/5';

  return (
    <div className={`rounded-lg border p-3 transition-all duration-200 ${statusStyles}`}>
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <InfoCircle className="h-4 w-4 flex-shrink-0 text-sc-cyan" />
        <span className="text-[10px] px-1.5 py-0.5 rounded font-medium uppercase text-sc-cyan bg-sc-cyan/10">
          Question
        </span>
        <span className="text-sm text-sc-fg-muted flex-1">The agent needs your input</span>
        {/* Status indicator */}
        {isResolved && (
          <span className="text-xs flex items-center gap-1 text-sc-green">
            <Check className="h-3 w-3" /> Answered
          </span>
        )}
      </div>

      {/* Questions */}
      <div className="space-y-4">
        {questions.map((q, qIndex) => (
          <div key={q.header || qIndex} className="space-y-2">
            {/* Question text */}
            <div className="text-sm font-medium text-sc-fg-primary">{q.question}</div>

            {/* Options */}
            {isPending && !isExpiredTime ? (
              <div className="space-y-2">
                <div className="grid gap-2">
                  {q.options.map((opt, oIndex) => {
                    const isSelected = selectedAnswers[qIndex] === opt.label;
                    return (
                      <button
                        type="button"
                        key={opt.label}
                        onClick={() => handleOptionSelect(qIndex, opt.label)}
                        className={`text-left p-2 rounded-md border transition-all ${
                          isSelected
                            ? 'border-sc-purple bg-sc-purple/10 text-sc-fg-primary'
                            : 'border-sc-fg-subtle/20 hover:border-sc-fg-subtle/40 text-sc-fg-muted hover:text-sc-fg-primary'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all ${
                              isSelected ? 'border-sc-purple bg-sc-purple' : 'border-sc-fg-subtle'
                            }`}
                          >
                            {isSelected && <Check className="h-2.5 w-2.5 text-white" />}
                          </div>
                          <span className="text-sm font-medium">{opt.label}</span>
                          {oIndex === 0 && (
                            <span className="text-[10px] px-1 py-0.5 rounded bg-sc-purple/20 text-sc-purple">
                              Recommended
                            </span>
                          )}
                        </div>
                        {opt.description && (
                          <div className="text-xs text-sc-fg-subtle mt-1 ml-6">
                            {opt.description}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Custom input (Other option) */}
                <div className="mt-2">
                  <input
                    type="text"
                    placeholder="Or type a custom answer..."
                    value={customInputs[qIndex] || ''}
                    onChange={(e) => handleCustomInput(qIndex, e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-md border border-sc-fg-subtle/20 bg-sc-bg-dark text-sc-fg-primary placeholder:text-sc-fg-subtle focus:border-sc-purple focus:outline-none"
                  />
                </div>
              </div>
            ) : (
              // Resolved state - show answer
              <div className="text-sm text-sc-fg-primary bg-sc-bg-dark p-2 rounded">
                {answers?.[q.header] || answers?.[`q${qIndex}`] || 'No answer provided'}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Submit button for pending */}
      {isPending && !isExpiredTime && (
        <div className="mt-4 flex items-center gap-2">
          <Button
            size="sm"
            variant="primary"
            onClick={handleSubmit}
            disabled={!allAnswered || answerMutation.isPending}
            className="flex-1"
          >
            {answerMutation.isPending ? <Spinner size="sm" /> : <Check className="h-4 w-4 mr-1" />}
            Submit Answer{questions.length > 1 ? 's' : ''}
          </Button>
        </div>
      )}

      {/* Expiry countdown for pending */}
      {isPending && expiresAt && !isExpiredTime && (
        <div className="mt-2 flex items-center gap-1 text-xs text-sc-fg-subtle">
          <Clock className="h-3 w-3" />
          Expires {formatDistanceToNow(new Date(expiresAt), { addSuffix: true })}
        </div>
      )}
    </div>
  );
});
