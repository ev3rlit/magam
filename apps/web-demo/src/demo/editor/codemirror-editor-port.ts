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
              color: '#fff4de',
              backgroundColor: '#191719',
              fontFamily: 'var(--font-mono), "SFMono-Regular", monospace',
              fontSize: '0.84rem',
            },
            '.cm-scroller': {
              overflow: 'auto',
              fontFamily: 'inherit',
              lineHeight: '1.65',
            },
            '.cm-content': {
              minHeight: '100%',
              padding: '18px',
            },
            '.cm-focused': {
              outline: 'none',
            },
            '.cm-activeLine': {
              backgroundColor: 'rgba(212, 99, 42, 0.08)',
            },
            '.cm-activeLineGutter': {
              backgroundColor: 'rgba(212, 99, 42, 0.12)',
            },
            '.cm-gutters': {
              borderRight: '1px solid rgba(255, 244, 222, 0.08)',
              backgroundColor: '#161417',
              color: 'rgba(255, 244, 222, 0.5)',
            },
            '.cm-cursor': {
              borderLeftColor: '#d4632a',
            },
            '.cm-selectionBackground, ::selection': {
              backgroundColor: 'rgba(212, 99, 42, 0.28)',
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
