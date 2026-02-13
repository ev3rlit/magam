import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Copy, Download } from 'lucide-react';
import { cn } from '@/utils/cn';
import { useExportImage, type ExportOptions } from '@/hooks/useExportImage';
import { useGraphStore } from '@/store/graph';

interface ExportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  defaultArea: 'selection' | 'full';
  selectedNodeIds?: string[];
}

interface SelectFieldOption {
  value: string;
  label: string;
}

interface SelectFieldProps<T extends string> {
  label: string;
  value: T;
  options: Array<SelectFieldOption & { value: T }>;
  onChange: (value: T) => void;
}

function SelectField<T extends string>({ label, value, options, onChange }: SelectFieldProps<T>) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-sm text-slate-600 dark:text-slate-300">{label}</span>
      <select
        className="h-10 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-700 dark:text-slate-200"
        value={value}
        onChange={(event) => onChange(event.target.value as T)}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

interface FormatSelectorProps {
  value: ExportOptions['format'];
  onChange: (format: ExportOptions['format']) => void;
}

function FormatSelector({ value, onChange }: FormatSelectorProps) {
  return (
    <div className="space-y-2">
      <p className="text-sm text-slate-600 dark:text-slate-300">파일 유형</p>
      <div className="grid grid-cols-3 gap-2">
        {(['png', 'jpg', 'svg'] as const).map((format) => (
          <button
            type="button"
            key={format}
            onClick={() => onChange(format)}
            className={cn(
              'h-10 rounded-lg border text-sm font-medium',
              value === format
                ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-400'
                : 'border-slate-200 bg-white text-slate-600 dark:bg-slate-900/60 dark:border-slate-700 dark:text-slate-300',
            )}
          >
            {format.toUpperCase()}
          </button>
        ))}
      </div>
    </div>
  );
}

export function ExportDialog({
  isOpen,
  onClose,
  defaultArea,
  selectedNodeIds: selectedNodeIdsFromContext = [],
}: ExportDialogProps) {
  const [format, setFormat] = useState<ExportOptions['format']>('png');
  const [background, setBackground] = useState<ExportOptions['background']>('grid');
  const [area, setArea] = useState<ExportOptions['area']>(defaultArea);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const currentSelectedNodeIds = useGraphStore((state) => state.selectedNodeIds);
  const effectiveSelectionNodeIds = selectedNodeIdsFromContext.length > 0
    ? selectedNodeIdsFromContext
    : currentSelectedNodeIds;
  const { downloadImage, copyImageToClipboard, isExporting } = useExportImage();

  const canCopy =
    typeof window !== 'undefined'
    && typeof navigator !== 'undefined'
    && typeof navigator.clipboard !== 'undefined'
    && typeof navigator.clipboard.write === 'function'
    && typeof (window as Window & { ClipboardItem?: typeof ClipboardItem }).ClipboardItem !== 'undefined';

  useEffect(() => {
    if (isOpen) {
      setArea(defaultArea);
      setErrorMessage(null);
    }
  }, [isOpen, defaultArea]);

  if (!isOpen) return null;

  const handleDownload = async () => {
    setErrorMessage(null);
    const exportNodeIds = area === 'selection' && effectiveSelectionNodeIds.length > 0
      ? effectiveSelectionNodeIds
      : undefined;

    try {
      await downloadImage({ format, background, area }, undefined, exportNodeIds);
      onClose();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : '내보내기 중 오류가 발생했습니다.');
    }
  };

  const handleCopy = async () => {
    setErrorMessage(null);

    try {
      if (area === 'selection' && effectiveSelectionNodeIds.length > 0) {
        await copyImageToClipboard(effectiveSelectionNodeIds, {
          background,
          area,
        });
      } else {
        await copyImageToClipboard(undefined, {
          background,
          area,
        });
      }
      onClose();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : '클립보드 복사 중 오류가 발생했습니다.');
    }
  };

  const previewText =
    area === 'selection' ? '선택 항목' : '전체 캔버스';

  return createPortal(
    <div className="fixed inset-0 z-[300] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <div
        className={cn(
          'relative w-[440px] max-w-[calc(100vw-2rem)] bg-white dark:bg-slate-900',
          'rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700',
          'animate-in fade-in zoom-in-95 duration-200',
        )}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Export Image</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">
          <div className="w-full h-40 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center">
            <span className="text-sm text-slate-400">미리보기: {previewText} ({format.toUpperCase()}/{background})</span>
          </div>

          <FormatSelector value={format} onChange={setFormat} />

          <SelectField
            label="배경"
            value={background}
            onChange={setBackground}
            options={[
              { value: 'grid', label: '그리드' },
              { value: 'transparent', label: '투명' },
              { value: 'solid', label: '단색 (흰색)' },
            ]}
          />

          <SelectField
            label="내보내기 영역"
            value={area}
            onChange={setArea}
            options={[
              { value: 'selection', label: '선택 항목만' },
              { value: 'full', label: '전체 영역' },
            ]}
          />
        </div>

        {errorMessage && (
          <div className="px-6 py-3 text-sm text-red-600 dark:text-red-300 bg-red-50 dark:bg-red-900/20 border-t border-red-200 dark:border-red-700">
            {errorMessage}
          </div>
        )}

        <div className="flex gap-3 px-6 py-4 border-t border-slate-200 dark:border-slate-700">
          <button
            type="button"
            onClick={handleCopy}
            disabled={isExporting || !canCopy}
            title={canCopy ? 'PNG로 복사' : '클립보드 복사를 지원하지 않는 브라우저입니다.'}
            className={cn(
              'flex-1 flex items-center justify-center gap-2 px-4 py-2.5',
              'rounded-lg border border-slate-200 dark:border-slate-700',
              'text-sm font-medium text-slate-700 dark:text-slate-300',
              'hover:bg-slate-50 dark:hover:bg-slate-800',
              'disabled:opacity-50',
            )}
          >
            <Copy className="w-4 h-4" />
            클립보드 복사
          </button>
          <button
            type="button"
            onClick={handleDownload}
            disabled={isExporting}
            className={cn(
              'flex-1 flex items-center justify-center gap-2 px-4 py-2.5',
              'rounded-lg bg-blue-600 text-white text-sm font-medium',
              'hover:bg-blue-700',
              'disabled:opacity-50',
            )}
          >
            <Download className="w-4 h-4" />
            다운로드
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
