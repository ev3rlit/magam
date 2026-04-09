import { javascript } from '@codemirror/lang-javascript';
import { oneDark } from '@codemirror/theme-one-dark';
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
          oneDark,
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
              color: '#e5e5e5',
              backgroundColor: '#171717',
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
              backgroundColor: 'rgba(255, 255, 255, 0.04)',
            },
            '.cm-activeLineGutter': {
              backgroundColor: '#202020',
            },
            '.cm-gutters': {
              borderRight: '1px solid rgba(255, 255, 255, 0.08)',
              backgroundColor: '#1a1a1a',
              color: 'rgba(163, 163, 163, 0.78)',
            },
            '.cm-cursor': {
              borderLeftColor: '#f5f5f5',
            },
            '.cm-selectionBackground, ::selection': {
              backgroundColor: 'rgba(255, 255, 255, 0.12)',
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
