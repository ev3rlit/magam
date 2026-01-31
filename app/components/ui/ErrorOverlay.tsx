import { useGraphStore } from '@/store/graph';
import { AlertCircle, X, ChevronDown, ChevronRight, FileCode } from 'lucide-react';
import { useState } from 'react';

export function ErrorOverlay() {
  const { error, setError } = useGraphStore();
  const [isStackOpen, setIsStackOpen] = useState(false);

  if (!error) return null;

  const handleDismiss = () => {
    setError(null);
  };

  const hasLocation = error.location && (error.location.file || error.location.line);
  const locationString = error.location
    ? `${error.location.file ? error.location.file.split('/').pop() : 'Unknown file'}:${error.location.line || '?'}:${error.location.column || '?'}`
    : '';

  return (
    <div className="absolute bottom-4 left-4 right-4 z-50 flex flex-col animate-in slide-in-from-bottom-5 duration-300">
      <div className="bg-red-50 border border-red-200 rounded-lg shadow-lg overflow-hidden max-w-4xl mx-auto w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-4 bg-red-100/50 border-b border-red-200">
          <div className="flex items-center gap-2 text-red-700">
            <AlertCircle className="w-5 h-5" />
            <h3 className="font-semibold text-lg">
              {error.type || 'Error'}
            </h3>
          </div>
          <button
            onClick={handleDismiss}
            className="p-1 hover:bg-red-200/50 rounded-full text-red-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 space-y-3">
          {/* Main Message */}
          <div className="text-red-900 font-mono text-sm whitespace-pre-wrap break-words">
            {error.message}
          </div>

          {/* Location Info */}
          {hasLocation && (
            <div className="flex items-center gap-2 p-2 bg-white rounded border border-red-100 text-sm font-mono text-slate-600">
              <FileCode className="w-4 h-4 text-slate-400" />
              <span className="font-semibold text-slate-800">{locationString}</span>
              {error.location?.lineText && (
                <span className="ml-2 text-slate-500 border-l border-slate-200 pl-2 italic">
                  "{error.location.lineText.trim()}"
                </span>
              )}
            </div>
          )}

          {/* Stack Trace / Details Toggle */}
          {error.details && (
            <div className="mt-2">
              <button
                onClick={() => setIsStackOpen(!isStackOpen)}
                className="flex items-center gap-1 text-xs font-semibold text-red-700 hover:text-red-800 transition-colors"
              >
                {isStackOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                {isStackOpen ? 'Hide Details' : 'Show Details'}
              </button>

              {isStackOpen && (
                <div className="mt-2 p-3 bg-slate-900 text-slate-200 rounded text-xs font-mono overflow-auto max-h-48 whitespace-pre custom-scrollbar">
                  {typeof error.details === 'string'
                    ? error.details
                    : JSON.stringify(error.details, null, 2)}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
