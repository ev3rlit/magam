import { describe, expect, it } from 'bun:test';
import { shouldReloadForFileChange } from './useFileSync';

describe('useFileSync notification guard', () => {
  it('self-origin + same command 는 무시한다', () => {
    const shouldReload = shouldReloadForFileChange({
      changedFile: 'examples/a.tsx',
      currentFile: 'examples/a.tsx',
      incomingOriginId: 'client-1',
      incomingCommandId: 'cmd-1',
      clientId: 'client-1',
      lastAppliedCommandId: 'cmd-1',
    });

    expect(shouldReload).toBe(false);
  });

  it('다른 origin 이면 리렌더한다', () => {
    const shouldReload = shouldReloadForFileChange({
      changedFile: 'examples/a.tsx',
      currentFile: 'examples/a.tsx',
      incomingOriginId: 'external',
      incomingCommandId: 'cmd-x',
      clientId: 'client-1',
      lastAppliedCommandId: 'cmd-1',
    });

    expect(shouldReload).toBe(true);
  });

  it('다른 파일 변경은 무시한다', () => {
    const shouldReload = shouldReloadForFileChange({
      changedFile: 'examples/b.tsx',
      currentFile: 'examples/a.tsx',
      incomingOriginId: 'external',
      incomingCommandId: 'cmd-x',
      clientId: 'client-1',
      lastAppliedCommandId: 'cmd-1',
    });

    expect(shouldReload).toBe(false);
  });
});
