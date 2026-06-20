import { useState, useEffect } from 'react';
import type { ModelOption } from '../../types/metrics';

const MODEL_OPTIONS: ModelOption[] = [
  { id: 'gpt-4o', label: 'GPT-4o', provider: 'OpenAI', tier: 'smart' },
  { id: 'gpt-4o-mini', label: 'GPT-4o Mini', provider: 'OpenAI', tier: 'fast' },
  { id: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo', provider: 'OpenAI', tier: 'cheap' },
  { id: 'claude-3-5-sonnet-20241022', label: 'Claude 3.5 Sonnet', provider: 'Anthropic', tier: 'smart' },
  { id: 'claude-3-haiku-20240307', label: 'Claude 3 Haiku', provider: 'Anthropic', tier: 'fast' },
];

const STORAGE_KEY = 'ai-reviewer:model';

export function useModelPreference(): [string, (model: string) => void] {
  const [model, setModelState] = useState(() => {
    if (typeof window === 'undefined') return 'gpt-4o';
    return localStorage.getItem(STORAGE_KEY) ?? 'gpt-4o';
  });

  const setModel = (newModel: string) => {
    localStorage.setItem(STORAGE_KEY, newModel);
    setModelState(newModel);
  };

  return [model, setModel];
}

export function ModelSwitcher() {
  const [selectedModel, setModel] = useModelPreference();

  const selected = MODEL_OPTIONS.find((m) => m.id === selectedModel) ?? MODEL_OPTIONS[0];

  const tierLabels = {
    smart: '✦ Premium Quality',
    fast: '⚡ Fast Response',
    cheap: '💰 Cost-Effective',
  };

  const tierColors = {
    smart: 'text-indigo-400',
    fast: 'text-emerald-400',
    cheap: 'text-yellow-400',
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur-md p-6 min-h-[270px] flex flex-col justify-between relative overflow-hidden group">
      <div>
        <h3 className="text-sm font-semibold text-white/80">AI Model Preferences</h3>
        <p className="text-xs text-white/30 mt-1 mb-6">Select the LLM model to run for your reviews</p>

        <div className="relative">
          <select
            value={selectedModel}
            onChange={(e) => setModel(e.target.value)}
            className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-sm text-white/80 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 cursor-pointer appearance-none hover:bg-white/[0.05] transition-all duration-300 font-mono"
          >
            {MODEL_OPTIONS.map((option) => (
              <option key={option.id} value={option.id} className="bg-[#121218] text-white">
                {option.label} ({option.provider})
              </option>
            ))}
          </select>
          {/* Custom chevron indicator */}
          <div className="absolute top-1/2 right-4 -translate-y-1/2 pointer-events-none text-white/30 text-xs">
            ▼
          </div>
        </div>
      </div>

      <div className="border-t border-white/10 pt-3 mt-4 flex items-center justify-between">
        <span className="text-[10px] text-white/20 font-semibold uppercase tracking-wider font-mono">
          Model Attributes
        </span>
        <div className="flex items-center gap-1.5">
          <span className={`text-xs font-semibold ${tierColors[selected.tier]} font-mono`}>
            {tierLabels[selected.tier]}
          </span>
          <span className="text-xs text-white/20 font-mono">· {selected.provider}</span>
        </div>
      </div>
    </div>
  );
}
