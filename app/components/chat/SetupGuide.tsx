'use client';

import React from 'react';

export const SetupGuide: React.FC = () => {
  return (
    <div className="mx-3 my-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-200">
      <p className="font-medium">No provider configured</p>
      <p className="mt-1">
        Configure at least one local model provider to enable chat.
      </p>
      {/* TODO: replace with setup deep-link/docs once backend setup endpoint is available. */}
    </div>
  );
};
