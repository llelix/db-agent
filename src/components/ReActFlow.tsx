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
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="h-px bg-gradient-to-r from-transparent via-violet-300 to-transparent dark:via-violet-700 flex-1" />
        <span className="text-sm font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap">
          🧠 ReAct 推理过程
        </span>
        <div className="h-px bg-gradient-to-r from-transparent via-violet-300 to-transparent dark:via-violet-700 flex-1" />
      </div>

      {/* Steps */}
      <div className="space-y-4">
        {displayedSteps.map((step, idx) => (
          <div
            key={idx}
            className="glass rounded-xl p-5 border border-slate-200 dark:border-slate-700 animate-fade-in"
            style={{ animationDelay: `${idx * 0.1}s` }}
          >
            <div className="flex items-start gap-4">
              {/* Step Number */}
              <div className="flex-shrink-0">
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-violet-500 to-blue-500 text-white flex items-center justify-center font-bold shadow-lg">
                  {idx + 1}
                </div>
              </div>

              {/* Step Content */}
              <div className="flex-1 min-w-0 space-y-3">
                {/* Thought */}
                {step.thought && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-semibold text-violet-600 dark:text-violet-400 bg-violet-100 dark:bg-violet-900/30 px-2 py-1 rounded">
                        💡 思考
                      </span>
                    </div>
                    <div className="text-sm text-slate-800 dark:text-slate-200 bg-violet-50 dark:bg-violet-900/20 rounded-lg p-3 border border-violet-200 dark:border-violet-800/50">
                      {step.thought}
                    </div>
                  </div>
                )}

                {/* Action */}
                {step.action && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-semibold text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-900/30 px-2 py-1 rounded">
                        ⚡ 动作
                      </span>
                    </div>
                    <div className="bg-slate-900 rounded-lg p-3 overflow-x-auto border border-slate-700">
                      <pre className="text-xs text-orange-300 font-mono leading-relaxed whitespace-pre-wrap">
                        {step.action}
                      </pre>
                    </div>
                  </div>
                )}

                {/* Observation */}
                {step.observation && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/30 px-2 py-1 rounded">
                        📊 观察
                      </span>
                    </div>
                    <div className="bg-slate-900 rounded-lg p-3 overflow-x-auto max-h-48 border border-slate-700">
                      <pre className="text-xs text-emerald-300 font-mono leading-relaxed whitespace-pre-wrap">
                        {step.observation}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}

        {/* Streaming Indicator */}
        {isStreaming && displayedSteps.length < steps.length && (
          <div className="flex items-center gap-3 glass rounded-lg p-4 border border-violet-200 dark:border-violet-800/50">
            <div className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-violet-500"></span>
            </div>
            <span className="text-sm text-slate-600 dark:text-slate-400 font-medium">
              AI 正在思考中...
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
