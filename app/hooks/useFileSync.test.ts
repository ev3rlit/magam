import { describe, expect, it, mock } from 'bun:test';
import {
  createPerFileMutationExecutor,
  createVersionConflictMetricsTracker,
  MAX_VERSION_CONFLICT_RETRY,
  RpcClientError,
  shouldReloadForFileChange,
  VERSION_CONFLICT_METRIC_WINDOW_MS,
  VERSION_CONFLICT_RATE_THRESHOLD,
} from './useFileSync';

async function waitForAsyncTurn(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 0));
}

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

describe('useFileSync mutation queue', () => {
  it('같은 파일 mutation은 순차 실행된다', async () => {
    const timeline: string[] = [];
    let releaseFirst: (value?: void | PromiseLike<void>) => void = () => { };
    const firstGate = new Promise<void>((resolve) => {
      releaseFirst = resolve;
    });

    let commandSequence = 0;
    const sendRequest = mock(async (_method: string, params: Record<string, unknown>) => {
      const marker = params.marker as string;
      timeline.push(`start:${marker}`);
      if (marker === 'first') {
        await firstGate;
      }
      timeline.push(`end:${marker}`);
      return { success: true, newVersion: `v-${marker}` };
    });

    const executor = createPerFileMutationExecutor({
      sendRequest,
      buildCommonParams: (params) => ({
        ...params,
        baseVersion: 'sha256:test',
        originId: 'client-1',
        commandId: `cmd-${++commandSequence}`,
      }),
      applyResultVersion: (result) => result as { success: boolean; newVersion: string },
    });

    const first = executor.enqueueMutation({
      method: 'node.move',
      filePath: 'same-file.tsx',
      buildParams: () => ({ marker: 'first' }),
    });
    const second = executor.enqueueMutation({
      method: 'node.move',
      filePath: 'same-file.tsx',
      buildParams: () => ({ marker: 'second' }),
    });

    await waitForAsyncTurn();
    expect(timeline).toEqual(['start:first']);

    releaseFirst();

    await Promise.all([first, second]);
    expect(timeline).toEqual([
      'start:first',
      'end:first',
      'start:second',
      'end:second',
    ]);
  });

  it('앞선 mutation 실패가 다음 mutation을 막지 않는다', async () => {
    const timeline: string[] = [];
    const sendRequest = mock(async (_method: string, params: Record<string, unknown>) => {
      const marker = params.marker as string;
      timeline.push(`start:${marker}`);
      if (marker === 'first') {
        throw new Error('boom-first');
      }
      timeline.push(`end:${marker}`);
      return { success: true, newVersion: 'sha256:ok' };
    });

    const executor = createPerFileMutationExecutor({
      sendRequest,
      buildCommonParams: (params) => ({
        ...params,
        baseVersion: 'sha256:test',
        originId: 'client-1',
        commandId: crypto.randomUUID(),
      }),
      applyResultVersion: (result) => result as { success: boolean; newVersion: string },
    });

    const first = executor.enqueueMutation({
      method: 'node.update',
      filePath: 'same-file.tsx',
      buildParams: () => ({ marker: 'first' }),
    });
    const second = executor.enqueueMutation({
      method: 'node.update',
      filePath: 'same-file.tsx',
      buildParams: () => ({ marker: 'second' }),
    });

    await expect(first).rejects.toThrow('boom-first');
    await expect(second).resolves.toMatchObject({ success: true });
    expect(timeline).toEqual(['start:first', 'start:second', 'end:second']);
  });
});

describe('useFileSync version conflict retry', () => {
  it('40901 충돌 시 1회 자동 재시도 후 성공한다', async () => {
    let sendCallCount = 0;
    let commonCallCount = 0;
    const commandIds: string[] = [];
    const retriedActualVersions: string[] = [];
    const retryEvents: Array<{ attempt: number; maxRetry: number }> = [];

    const sendRequest = mock(async (_method: string, params: Record<string, unknown>) => {
      sendCallCount += 1;
      commandIds.push(params.commandId as string);

      if (sendCallCount === 1) {
        throw new RpcClientError(40901, 'VERSION_CONFLICT', {
          expected: 'sha256:old',
          actual: 'sha256:new',
        });
      }

      return { success: true, newVersion: 'sha256:new', commandId: params.commandId };
    });

    const executor = createPerFileMutationExecutor({
      sendRequest,
      buildCommonParams: (params) => ({
        ...params,
        baseVersion: `sha256:base-${commonCallCount}`,
        originId: 'client-1',
        commandId: `cmd-${++commonCallCount}`,
      }),
      applyResultVersion: (result) => result as { success: boolean; newVersion: string; commandId: string },
      onVersionConflictActual: (actualVersion) => {
        retriedActualVersions.push(actualVersion);
      },
      onConflictRetry: (event) => {
        retryEvents.push({ attempt: event.attempt, maxRetry: event.maxRetry });
      },
    });

    const result = await executor.enqueueMutation({
      method: 'node.reparent',
      filePath: 'retry-file.tsx',
      buildParams: () => ({ nodeId: 'n1' }),
    });

    expect(result.success).toBe(true);
    expect(sendCallCount).toBe(2);
    expect(retriedActualVersions).toEqual(['sha256:new']);
    expect(retryEvents).toEqual([{ attempt: 1, maxRetry: MAX_VERSION_CONFLICT_RETRY }]);
    expect(commandIds[0]).not.toBe(commandIds[1]);
  });

  it('40901이 2회 연속이면 실패를 전파한다', async () => {
    let sendCallCount = 0;
    const sendRequest = mock(async () => {
      sendCallCount += 1;
      throw new RpcClientError(40901, 'VERSION_CONFLICT', {
        expected: 'sha256:old',
        actual: 'sha256:new',
      });
    });

    const executor = createPerFileMutationExecutor({
      sendRequest,
      buildCommonParams: (params) => ({
        ...params,
        baseVersion: 'sha256:test',
        originId: 'client-1',
        commandId: crypto.randomUUID(),
      }),
      applyResultVersion: (result) => result as { success: boolean; newVersion: string },
    });

    await expect(executor.enqueueMutation({
      method: 'node.move',
      filePath: 'retry-file.tsx',
      buildParams: () => ({ nodeId: 'n1' }),
    })).rejects.toMatchObject({ code: 40901, message: 'VERSION_CONFLICT' });
    expect(sendCallCount).toBe(MAX_VERSION_CONFLICT_RETRY + 1);
  });

  it('비충돌 에러는 재시도하지 않는다', async () => {
    let sendCallCount = 0;
    const sendRequest = mock(async () => {
      sendCallCount += 1;
      throw new RpcClientError(50001, 'PATCH_FAILED', { reason: 'mock' });
    });

    const executor = createPerFileMutationExecutor({
      sendRequest,
      buildCommonParams: (params) => ({
        ...params,
        baseVersion: 'sha256:test',
        originId: 'client-1',
        commandId: crypto.randomUUID(),
      }),
      applyResultVersion: (result) => result as { success: boolean; newVersion: string },
    });

    await expect(executor.enqueueMutation({
      method: 'node.create',
      filePath: 'retry-file.tsx',
      buildParams: () => ({ nodeId: 'n1' }),
    })).rejects.toMatchObject({ code: 50001, message: 'PATCH_FAILED' });
    expect(sendCallCount).toBe(1);
  });
});

describe('version conflict metrics tracker', () => {
  it('10분 롤링 윈도우를 유지한다', () => {
    let now = 0;
    const tracker = createVersionConflictMetricsTracker({
      now: () => now,
    });

    tracker.recordMutation();
    tracker.recordVersionConflict();

    const first = tracker.getSnapshot();
    expect(first.mutationTotal10m).toBe(1);
    expect(first.versionConflictTotal10m).toBe(1);

    now = VERSION_CONFLICT_METRIC_WINDOW_MS + 1;
    const second = tracker.getSnapshot();
    expect(second.mutationTotal10m).toBe(0);
    expect(second.versionConflictTotal10m).toBe(0);
    expect(second.versionConflictRate10m).toBe(0);
  });

  it('충돌 비율 2% 이상이면 server mutex 권고를 true로 계산한다', () => {
    const tracker = createVersionConflictMetricsTracker();
    for (let i = 0; i < 100; i += 1) {
      tracker.recordMutation();
    }
    tracker.recordVersionConflict();
    tracker.recordVersionConflict();

    const snapshot = tracker.getSnapshot();
    expect(snapshot.versionConflictRate10m).toBe(VERSION_CONFLICT_RATE_THRESHOLD);
    expect(snapshot.shouldEnableServerMutex).toBe(true);
  });
});
