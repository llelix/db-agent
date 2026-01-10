'use client';

import { StreamingSteps } from './StreamingSteps';

interface ReActStep {
  thought?: string;
  action?: string;
  observation?: string;
}

interface ReActFlowProps {
  steps: ReActStep[];
  isStreaming?: boolean;
}

export function ReActFlow({ steps, isStreaming = false }: ReActFlowProps) {
  if (steps.length === 0) return null;

  return (
    <StreamingSteps
      steps={steps}
      isStreaming={isStreaming}
      showHeader={true}
    />
  );
}
