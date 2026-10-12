"use client";

import { useState } from "react";

export type QuestionnaireAnswers = {
  companySize: string;
  primaryFunction: string;
  teamSize: string;
  timeline: string;
  priority: string;
};

const QUESTIONS = [
  {
    id: "companySize" as const,
    label: "How large is your company?",
    sublabel: "Global headcount",
    options: [
      { value: "200-500", label: "200 – 500" },
      { value: "500-1000", label: "500 – 1,000" },
      { value: "1000-2000", label: "1,000 – 2,000" },
    ],
  },
  {
    id: "primaryFunction" as const,
    label: "Primary function for the GCC?",
    sublabel: "What will the team mainly do?",
    options: [
      { value: "engineering", label: "Software Engineering" },
      { value: "data-ai", label: "Data & AI" },
      { value: "finance", label: "Finance & Accounting" },
      { value: "customer-ops", label: "Customer Operations" },
      { value: "multi", label: "Multi-function" },
    ],
  },
  {
    id: "teamSize" as const,
    label: "Target team size in Year 1?",
    sublabel: "India headcount by month 12",
    options: [
      { value: "10-30", label: "10 – 30" },
      { value: "30-75", label: "30 – 75" },
      { value: "75-150", label: "75 – 150" },
    ],
  },
  {
    id: "timeline" as const,
    label: "Timeline to first hire?",
    sublabel: "When do you need boots on the ground?",
    options: [
      { value: "under-3", label: "Under 3 months" },
      { value: "3-6", label: "3 – 6 months" },
      { value: "6-12", label: "6 – 12 months" },
    ],
  },
  {
    id: "priority" as const,
    label: "What matters most?",
    sublabel: "Pick the one that would break the deal",
    options: [
      { value: "cost", label: "Cost" },
      { value: "talent", label: "Talent depth" },
      { value: "speed", label: "Speed to launch" },
      { value: "ip", label: "IP protection" },
    ],
  },
] as const;

interface QuestionnaireProps {
  onSubmit: (answers: QuestionnaireAnswers) => void;
  isLoading: boolean;
}

export function Questionnaire({ onSubmit, isLoading }: QuestionnaireProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Partial<QuestionnaireAnswers>>({});

  const currentQuestion = QUESTIONS[currentStep];
  const progress = ((currentStep) / QUESTIONS.length) * 100;
  const isLastStep = currentStep === QUESTIONS.length - 1;
  const currentAnswer = answers[currentQuestion.id];

  const handleSelect = (value: string) => {
    const updated = { ...answers, [currentQuestion.id]: value };
    setAnswers(updated);

    if (!isLastStep) {
      // Auto-advance after a brief pause so the selection registers visually
      setTimeout(() => setCurrentStep((s) => s + 1), 200);
    }
  };

  const handleSubmit = () => {
    if (Object.keys(answers).length === QUESTIONS.length) {
      onSubmit(answers as QuestionnaireAnswers);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) setCurrentStep((s) => s - 1);
  };

  return (
    <section
      id="questionnaire"
      className="pb-12 pt-8 sm:pb-16"
    >
      {/* Section header */}
      <div className="mb-8">
        <h2 className="mb-2 font-headline text-ink">
          Get your Entry Brief
        </h2>
        <p className="text-sm text-ink-muted sm:text-base">
          Five questions. Thirty seconds. A sourced brief tailored to your scenario.
        </p>
      </div>

      {/* Progress bar */}
      <div className="mb-8">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs font-medium text-ink-faint">
            {currentStep + 1} of {QUESTIONS.length}
          </span>
          {currentStep > 0 && (
            <button
              onClick={handleBack}
              className="text-xs font-medium text-ink-muted transition-editorial hover:text-ink"
            >
              ← Back
            </button>
          )}
        </div>
        <div className="h-1 w-full overflow-hidden rounded-full bg-border">
          <div
            className="h-full rounded-full bg-accent transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Question card */}
      <div className="rounded-lg border border-border bg-bg-elevated p-6 shadow-sm">
        <h3 className="mb-1 font-headline text-lg font-medium text-ink">
          {currentQuestion.label}
        </h3>
        <p className="mb-5 text-sm text-ink-muted">
          {currentQuestion.sublabel}
        </p>

        {/* Options */}
        <div className="flex flex-col gap-2.5">
          {currentQuestion.options.map((option) => {
            const isSelected = currentAnswer === option.value;
            return (
              <button
                key={option.value}
                onClick={() => handleSelect(option.value)}
                disabled={isLoading}
                className={`group relative w-full rounded-md border px-4 py-3 text-left text-sm font-medium transition-editorial ${
                  isSelected
                    ? "border-accent bg-accent-light/50 text-accent-dark"
                    : "border-border bg-bg text-ink hover:border-border-strong hover:bg-bg-elevated"
                } ${isLoading ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}
              >
                <span className="flex items-center gap-3">
                  <span
                    className={`flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full border transition-editorial ${
                      isSelected
                        ? "border-accent bg-accent"
                        : "border-ink-faint group-hover:border-ink-muted"
                    }`}
                  >
                    {isSelected && (
                      <span className="h-1.5 w-1.5 rounded-full bg-white" />
                    )}
                  </span>
                  {option.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Submit button (only on last step when answered) */}
      {isLastStep && currentAnswer && (
        <div className="mt-6">
          <button
            onClick={handleSubmit}
            disabled={isLoading}
            className={`w-full rounded-md px-6 py-3 text-sm font-semibold transition-editorial sm:w-auto ${
              isLoading
                ? "cursor-not-allowed bg-ink-faint text-bg"
                : "bg-ink text-bg hover:bg-accent-dark"
            }`}
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
                Generating your brief…
              </span>
            ) : (
              "Generate my Entry Brief →"
            )}
          </button>
        </div>
      )}
    </section>
  );
}
