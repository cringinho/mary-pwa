import React from 'react';

export function MemoryFeedSkeleton() {
  return (
    <div className="space-y-5" aria-busy="true" aria-label="Carregando memórias">
      {[1, 2].map((i) => (
        <div
          key={i}
          className="glass-panel rounded-3xl p-5 border border-pink-500/15 space-y-4 overflow-hidden relative animate-pulse"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-pink-500/25 to-purple-500/25" />
            <div className="space-y-2 flex-1">
              <div className="h-3 w-36 rounded-lg bg-white/10" />
              <div className="h-2.5 w-24 rounded-lg bg-white/5" />
            </div>
            <div className="h-5 w-16 rounded-full bg-pink-500/15" />
          </div>
          <div className="space-y-2">
            <div className="h-4 w-2/3 rounded-lg bg-white/15" />
            <div className="h-3 w-full rounded-lg bg-white/10" />
            <div className="h-3 w-4/5 rounded-lg bg-white/10" />
          </div>
          <div className="h-44 w-full rounded-2xl bg-gradient-to-r from-white/5 via-pink-500/10 to-white/5" />
        </div>
      ))}
    </div>
  );
}

