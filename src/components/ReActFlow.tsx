'use client';

import { useState, useEffect } from 'react';

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
  const [displayedSteps, setDisplayedSteps] = useState<ReActStep[]>([]);

  useEffect(() => {
    // 流式显示步骤
    if (isStreaming) {
      let index = 0;
      const interval = setInterval(() => {
        if (index < steps.length) {
          setDisplayedSteps((prev) => [...prev, steps[index]]);
          index++;
        } else {
          clearInterval(interval);
        }
      }, 300);
      return () => clearInterval(interval);
    } else {
      setDisplayedSteps(steps);
    }
  }, [steps, isStreaming]);

  if (steps.length === 0) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="h-px bg-gray-200 flex-1" />
        <span className="text-sm font-medium text-gray-600">ReAct 思考过程</span>
        <div className="h-px bg-gray-200 flex-1" />
      </div>

      <div className="space-y-3">
        {displayedSteps.map((step, idx) => (
          <div
            key={idx}
            className="border border-gray-200 rounded-lg p-4 bg-white"
          >
            <div className="flex items-start gap-3">
              {/* Step Number */}
              <div className="flex-shrink-0">
                <div className="h-8 w-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-sm font-bold">
                  {idx + 1}
                </div>
              </div>

              {/* Step Content */}
              <div className="flex-1 min-w-0">
                {/* Thought */}
                {step.thought && (
                  <div className="mb-2">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-semibold text-blue-700">💡 思考</span>
                    </div>
                    <div className="text-sm text-gray-800 bg-blue-50 rounded p-2">
                      {step.thought}
                    </div>
                  </div>
                )}

                {/* Action */}
                {step.action && (
                  <div className="mb-2">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-semibold text-orange-700">⚡ 动作</span>
                    </div>
                    <pre className="text-xs text-gray-700 bg-orange-50 rounded p-2 overflow-x-auto">
                      <code>{step.action}</code>
                    </pre>
                  </div>
                )}

                {/* Observation */}
                {step.observation && (
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-semibold text-green-700">📊 观察</span>
                    </div>
                    <pre className="text-xs text-gray-700 bg-green-50 rounded p-2 overflow-x-auto max-h-32">
                      <code>{step.observation}</code>
                    </pre>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}

        {/* Streaming Indicator */}
        {isStreaming && displayedSteps.length < steps.length && (
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <div className="h-2 w-2 bg-blue-500 rounded-full animate-pulse" />
            <span>正在思考中...</span>
          </div>
        )}
      </div>
    </div>
  );
}
