import { afterEach, describe, expect, it } from 'bun:test';
import { runWithOptionalFileMutex } from './methods';

const originalMutexEnv = process.env.MAGAM_WS_ENABLE_FILE_MUTEX;

function createDeferred<T = void>() {
  let resolve: (value: T | PromiseLike<T>) => void = () => { };
  let reject: (reason?: unknown) => void = () => { };
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

async function waitForAsyncTurn(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 0));
}

afterEach(() => {
  if (originalMutexEnv === undefined) {
    delete process.env.MAGAM_WS_ENABLE_FILE_MUTEX;
  } else {
    process.env.MAGAM_WS_ENABLE_FILE_MUTEX = originalMutexEnv;
  }
});

describe('runWithOptionalFileMutex', () => {
  it('mutex OFF면 같은 파일 작업도 병렬로 시작될 수 있다', async () => {
    process.env.MAGAM_WS_ENABLE_FILE_MUTEX = '0';

    const blocker = createDeferred<void>();
    let firstStarted = false;
    let secondStarted = false;

    const first = runWithOptionalFileMutex('same-file-off', async () => {
      firstStarted = true;
      await blocker.promise;
      return 'first';
    });

    await waitForAsyncTurn();
    const second = runWithOptionalFileMutex('same-file-off', async () => {
      secondStarted = true;
      return 'second';
    });

    await waitForAsyncTurn();
    expect(firstStarted).toBe(true);
    expect(secondStarted).toBe(true);

    blocker.resolve();
    await expect(Promise.all([first, second])).resolves.toEqual(['first', 'second']);
  });

  it('mutex ON이면 같은 파일 작업은 직렬화된다', async () => {
    process.env.MAGAM_WS_ENABLE_FILE_MUTEX = '1';

    const blocker = createDeferred<void>();
    let secondStarted = false;

    const first = runWithOptionalFileMutex('same-file-on', async () => {
      await blocker.promise;
      return 'first';
    });

    await waitForAsyncTurn();
    const second = runWithOptionalFileMutex('same-file-on', async () => {
      secondStarted = true;
      return 'second';
    });

    await waitForAsyncTurn();
    expect(secondStarted).toBe(false);

    blocker.resolve();
    await first;
    await second;
    expect(secondStarted).toBe(true);
  });

  it('mutex ON이어도 서로 다른 파일은 독립 실행된다', async () => {
    process.env.MAGAM_WS_ENABLE_FILE_MUTEX = '1';

    const blocker = createDeferred<void>();
    let secondStarted = false;

    const first = runWithOptionalFileMutex('file-a', async () => {
      await blocker.promise;
      return 'first';
    });

    await waitForAsyncTurn();
    const second = runWithOptionalFileMutex('file-b', async () => {
      secondStarted = true;
      return 'second';
    });

    await waitForAsyncTurn();
    expect(secondStarted).toBe(true);

    blocker.resolve();
    await expect(Promise.all([first, second])).resolves.toEqual(['first', 'second']);
  });

  it('실패한 작업 이후에도 같은 파일 lock이 해제된다', async () => {
    process.env.MAGAM_WS_ENABLE_FILE_MUTEX = '1';

    await expect(runWithOptionalFileMutex('failure-file', async () => {
      throw new Error('boom');
    })).rejects.toThrow('boom');

    let started = false;
    await expect(runWithOptionalFileMutex('failure-file', async () => {
      started = true;
      return 'ok';
    })).resolves.toBe('ok');
    expect(started).toBe(true);
  });
});
