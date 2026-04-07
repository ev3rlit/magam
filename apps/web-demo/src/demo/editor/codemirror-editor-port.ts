import { javascript } from '@codemirror/lang-javascript';
import { basicSetup, EditorView } from 'codemirror';
import type { CodeEditorHandle, CodeEditorPort, CodeEditorMountInput } from '@/src/demo/contracts';

export function createCodeMirrorEditorPort(): CodeEditorPort {
  return {
    mount(input: CodeEditorMountInput): CodeEditorHandle {
      const view = new EditorView({
        doc: input.value,
        extensions: [
          basicSetup,
          javascript({
            jsx: true,
            typescript: true,
          }),
          EditorView.lineWrapping,
          EditorView.editable.of(!input.readOnly),
          EditorView.updateListener.of((update) => {
            if (update.docChanged) {
              input.onChange?.(update.state.doc.toString());
            }
          }),
          EditorView.theme({
            '&': {
              height: '100%',
              color: '#e2e8f0',
              backgroundColor: '#0f172a',
              fontFamily: 'var(--font-mono), "SFMono-Regular", monospace',
              fontSize: '0.76rem',
            },
            '.cm-scroller': {
              overflow: 'auto',
              fontFamily: 'inherit',
              lineHeight: '1.6',
            },
            '.cm-content': {
              minHeight: '100%',
              padding: '14px 16px 18px',
            },
            '.cm-focused': {
              outline: 'none',
            },
            '.cm-activeLine': {
              backgroundColor: 'rgba(37, 99, 235, 0.08)',
            },
            '.cm-activeLineGutter': {
              backgroundColor: 'rgba(37, 99, 235, 0.12)',
            },
            '.cm-gutters': {
              borderRight: '1px solid rgba(148, 163, 184, 0.18)',
              backgroundColor: '#111827',
              color: 'rgba(148, 163, 184, 0.72)',
            },
            '.cm-cursor': {
              borderLeftColor: '#60a5fa',
            },
            '.cm-selectionBackground, ::selection': {
              backgroundColor: 'rgba(37, 99, 235, 0.24)',
            },
          }),
        ],
        parent: input.element,
      });

      return {
        setValue(value: string) {
          const currentValue = view.state.doc.toString();

          if (currentValue === value) {
            return;
          }

          view.dispatch({
            changes: {
              from: 0,
              to: currentValue.length,
              insert: value,
            },
          });
        },
        getValue() {
          return view.state.doc.toString();
        },
        focus() {
          view.focus();
        },
        dispose() {
          view.destroy();
        },
      };
    },
  };
}
