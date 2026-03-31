"use client";

import { useState } from "react";
import { OnboardingFlow } from "@/components/onboarding/OnboardingFlow";

interface HomeClientProps {
  showOnboarding: boolean;
  children: React.ReactNode;
}

export function HomeClient({ showOnboarding, children }: HomeClientProps) {
  const [onboarding, setOnboarding] = useState(showOnboarding);

  return (
    <>
      {children}
      {onboarding && (
        <OnboardingFlow onComplete={() => setOnboarding(false)} />
      )}
    </>
  );
}
