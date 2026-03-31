"use client";

import { useState, useCallback } from "react";
import { Logo } from "@/components/shared/Logo";
import {
  CalendarDays,
  Sparkles,
  BookOpen,
  Plus,
  Users,
  Heart,
} from "lucide-react";

interface OnboardingFlowProps {
  onComplete: () => void;
}

const steps = [
  {
    id: "welcome",
    title: "Welcome to Set the Table!",
    description:
      "Your personal kitchen planning assistant. Let\u2019s show you around.",
    gradient: "from-blue-500 to-blue-600",
    icons: null as null,
  },
  {
    id: "planner",
    title: "Plan Your Week",
    description:
      "See your full week at a glance. Tap any day to add a meal. We\u2019ll suggest meals that complement what you\u2019ve already planned.",
    gradient: "from-blue-400 to-indigo-500",
    icons: [CalendarDays, Sparkles] as const,
  },
  {
    id: "catalog",
    title: "Build Your Catalog",
    description:
      "Add meals you love. Just type the name and ingredients \u2014 we\u2019ll handle the rest. Import ideas from Instagram or TikTok links.",
    gradient: "from-indigo-400 to-blue-500",
    icons: [BookOpen, Plus] as const,
  },
  {
    id: "share",
    title: "Cook Together",
    description:
      "Invite your partner to plan meals together. Share the same weekly plan and catalog. Head to Settings to send an invite.",
    gradient: "from-blue-500 to-sky-400",
    icons: [Users, Heart] as const,
  },
];

export function OnboardingFlow({ onComplete }: OnboardingFlowProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [direction, setDirection] = useState<"next" | "prev">("next");
  const [isAnimating, setIsAnimating] = useState(false);

  const step = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;

  const finishOnboarding = useCallback(async () => {
    try {
      await fetch("/api/user/onboarded", { method: "POST" });
    } catch {
      // silently fail — user can still use the app
    }
    onComplete();
  }, [onComplete]);

  const handleNext = useCallback(() => {
    if (isAnimating) return;
    if (isLastStep) {
      finishOnboarding();
      return;
    }
    setDirection("next");
    setIsAnimating(true);
    setTimeout(() => {
      setCurrentStep((s) => s + 1);
      setIsAnimating(false);
    }, 200);
  }, [isLastStep, isAnimating, finishOnboarding]);

  const handleSkip = useCallback(() => {
    finishOnboarding();
  }, [finishOnboarding]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div
        className={`relative mx-4 w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl transition-all duration-200 ${
          isAnimating
            ? direction === "next"
              ? "translate-x-4 opacity-0"
              : "-translate-x-4 opacity-0"
            : "translate-x-0 opacity-100"
        }`}
      >
        {/* Illustration area */}
        <div
          className={`flex items-center justify-center bg-gradient-to-br ${step.gradient} px-8 py-12`}
        >
          {step.id === "welcome" ? (
            <div className="flex flex-col items-center gap-4">
              <div className="flex h-24 w-24 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
                <Logo className="h-14 w-14" />
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-6">
              {step.icons?.map((Icon, i) => (
                <div
                  key={i}
                  className="flex h-20 w-20 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm"
                >
                  <Icon className="h-10 w-10 text-white" strokeWidth={1.5} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="px-8 pb-8 pt-6">
          <h2 className="text-center text-2xl font-bold text-stone-800">
            {step.title}
          </h2>
          <p className="mt-3 text-center leading-relaxed text-stone-500">
            {step.description}
          </p>

          {/* Step indicator dots */}
          <div className="mt-6 flex items-center justify-center gap-2">
            {steps.map((_, i) => (
              <div
                key={i}
                className={`h-2 rounded-full transition-all duration-300 ${
                  i === currentStep
                    ? "w-6 bg-blue-600"
                    : "w-2 bg-stone-200"
                }`}
              />
            ))}
          </div>

          {/* Actions */}
          <div className="mt-6 flex flex-col items-center gap-3">
            <button
              onClick={handleNext}
              className="w-full rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-700 active:bg-blue-800"
            >
              {isLastStep ? "Get Started" : "Next"}
            </button>
            {!isLastStep && (
              <button
                onClick={handleSkip}
                className="text-sm font-medium text-stone-400 transition-colors hover:text-stone-600"
              >
                Skip
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
