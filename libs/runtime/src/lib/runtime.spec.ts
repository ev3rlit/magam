import { execute } from './executor';
import { Worker } from 'worker_threads';
import { writeFile, unlink } from 'fs/promises';
import { transpile } from './transpiler';

// Mock dependencies
jest.mock('worker_threads', () => {
  return {
    Worker: jest.fn(),
  };
});

jest.mock('fs/promises', () => ({
  writeFile: jest.fn().mockResolvedValue(undefined),
  unlink: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('./transpiler', () => ({
  transpile: jest.fn().mockResolvedValue('transpiled code'),
}));

describe('runtime executor', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should execute valid code', async () => {
    let workerCreated: () => void;
    const workerCreatedPromise = new Promise<void>((r) => {
      workerCreated = r;
    });

    const mockWorker = {
      on: jest.fn(),
      terminate: jest.fn(),
      postMessage: jest.fn(),
    };
    (Worker as unknown as jest.Mock).mockImplementation(() => {
      workerCreated();
      return mockWorker;
    });

    const promise = execute('some code');

    // Wait for worker to be created
    await workerCreatedPromise;

    // Simulate successful execution
    // The executor registers 'message', 'error', 'exit' handlers.
    // We find the 'message' handler.
    const messageHandler = mockWorker.on.mock.calls.find(
      (call) => call[0] === 'message',
    )[1];

    // Simulate worker sending success
    messageHandler({ status: 'success', data: { nodes: [], edges: [] } });

    const result = await promise;
    expect(result).toEqual({ nodes: [], edges: [] });
    expect(mockWorker.terminate).toHaveBeenCalled();
    expect(transpile).toHaveBeenCalled();
    expect(writeFile).toHaveBeenCalled();
    expect(unlink).toHaveBeenCalled();
  });

  it('should throw timeout for infinite loop', async () => {
    jest.useFakeTimers();

    let workerCreated: () => void;
    const workerCreatedPromise = new Promise<void>((r) => {
      workerCreated = r;
    });

    const mockWorker = {
      on: jest.fn(),
      terminate: jest.fn(),
      postMessage: jest.fn(),
    };
    (Worker as unknown as jest.Mock).mockImplementation(() => {
      workerCreated();
      return mockWorker;
    });

    const promise = execute('infinite loop code');

    // Wait for worker to be created so the timeout is set
    await workerCreatedPromise;

    // Fast-forward time to trigger timeout
    jest.advanceTimersByTime(1001);

    await expect(promise).rejects.toThrow(/Execution timed out/);
    expect(mockWorker.terminate).toHaveBeenCalled();

    jest.useRealTimers();
  });

  it('should handle worker errors', async () => {
    let workerCreated: () => void;
    const workerCreatedPromise = new Promise<void>((r) => {
      workerCreated = r;
    });

    const mockWorker = {
      on: jest.fn(),
      terminate: jest.fn(),
      postMessage: jest.fn(),
    };
    (Worker as unknown as jest.Mock).mockImplementation(() => {
      workerCreated();
      return mockWorker;
    });

    const promise = execute('error code');

    await workerCreatedPromise;

    const messageHandler = mockWorker.on.mock.calls.find(
      (call) => call[0] === 'message',
    )[1];

    messageHandler({
      status: 'error',
      error: { message: 'Runtime error' },
    });

    await expect(promise).rejects.toThrow('Runtime error');
    expect(mockWorker.terminate).toHaveBeenCalled();
  });
});
