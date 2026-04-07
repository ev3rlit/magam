'use client';

import { useEffect, useRef } from 'react';
import type { CodeEditorHandle } from '@/src/demo/contracts';
import { createCodeMirrorEditorPort } from '@/src/demo/editor/codemirror-editor-port';

interface ScratchEditorProps {
  value: string;
  onChange?: (value: string) => void;
  readOnly?: boolean;
  autoFocus?: boolean;
}

const codeEditorPort = createCodeMirrorEditorPort();

export function ScratchEditor({
  value,
  onChange,
  readOnly = false,
  autoFocus = !readOnly,
}: ScratchEditorProps) {
  const editorHostRef = useRef<HTMLDivElement | null>(null);
  const editorHandleRef = useRef<CodeEditorHandle | null>(null);
  const onChangeRef = useRef(onChange);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    if (!editorHostRef.current) {
      return undefined;
    }

    const handle = codeEditorPort.mount({
      element: editorHostRef.current,
      value,
      readOnly,
      language: 'tsx',
      onChange: (nextValue) => {
        onChangeRef.current?.(nextValue);
      },
    });

    editorHandleRef.current = handle;
    if (autoFocus) {
      handle.focus();
    }

    return () => {
      handle.dispose();
      editorHandleRef.current = null;
    };
  }, [autoFocus, readOnly]);

  useEffect(() => {
    const handle = editorHandleRef.current;

    if (!handle || handle.getValue() === value) {
      return;
    }

    handle.setValue(value);
  }, [value]);

  return <div className="demo-editor-host" ref={editorHostRef} />;
}
