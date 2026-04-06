'use client';

import { useEffect, useRef } from 'react';
import type { CodeEditorHandle } from '@/src/demo/contracts';
import { createCodeMirrorEditorPort } from '@/src/demo/editor/codemirror-editor-port';

interface ScratchEditorProps {
  value: string;
  onChange: (value: string) => void;
}

const codeEditorPort = createCodeMirrorEditorPort();

export function ScratchEditor({ value, onChange }: ScratchEditorProps) {
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
      readOnly: false,
      language: 'tsx',
      onChange: (nextValue) => {
        onChangeRef.current(nextValue);
      },
    });

    editorHandleRef.current = handle;
    handle.focus();

    return () => {
      handle.dispose();
      editorHandleRef.current = null;
    };
  }, []);

  useEffect(() => {
    const handle = editorHandleRef.current;

    if (!handle || handle.getValue() === value) {
      return;
    }

    handle.setValue(value);
  }, [value]);

  return <div className="demo-editor-host" ref={editorHostRef} />;
}
