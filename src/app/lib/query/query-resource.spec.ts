import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { queryResourceOptions } from './query-resource-options';
import { queryResource } from './query-resource';

type Book = {
  id: number;
  title: string;
};

type Deferred<T> = {
  promise: Promise<T>;
  resolve: (value: T) => void;
  reject: (reason?: unknown) => void;
};

function createDeferred<T>(): Deferred<T> {
  let resolve: (value: T) => void = () => undefined;
  let reject: (reason?: unknown) => void = () => undefined;

  const promise = new Promise<T>((promiseResolve, promiseReject) => {
    resolve = promiseResolve;
    reject = promiseReject;
  });

  return { promise, resolve, reject };
}

async function waitFor(condition: () => boolean, timeoutMs = 2000): Promise<void> {
  const startedAt = Date.now();

  while (!condition()) {
    if (Date.now() - startedAt > timeoutMs) {
      throw new Error('Timed out waiting for condition.');
    }

    await new Promise((resolve) => setTimeout(resolve, 0));
  }
}

describe('queryResource', () => {
  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({});
  });

  it('loads data for the current query key', async () => {
    const userId = signal(1);
    const expectedBooks: Book[] = [{ id: 1, title: 'Book 1' }];
    const loaderCalls: number[] = [];

    const booksQuery = TestBed.runInInjectionContext(() =>
      queryResource(
        queryResourceOptions({
          queryKey: () => ['query-loads-data', { userId: userId() }] as const,
          loader: async ({ queryKey }) => {
            const [, params] = queryKey;
            loaderCalls.push(params.userId);
            return [{ id: params.userId, title: `Book ${params.userId}` }];
          },
        }),
      ),
    );

    await waitFor(() => booksQuery.isSuccess());

    expect(booksQuery.value()).toEqual(expectedBooks);
    expect(loaderCalls).toEqual([1]);
    expect(booksQuery.error()).toBeUndefined();
  });

  it('re-executes the loader when key values change', async () => {
    const userId = signal(1);
    const loaderCalls: number[] = [];

    const booksQuery = TestBed.runInInjectionContext(() =>
      queryResource(
        queryResourceOptions({
          queryKey: () => ['query-key-change', { userId: userId() }] as const,
          loader: async ({ queryKey }) => {
            const [, params] = queryKey;
            loaderCalls.push(params.userId);
            return [{ id: params.userId, title: `Book ${params.userId}` }];
          },
        }),
      ),
    );

    await waitFor(() => booksQuery.isSuccess() && booksQuery.value()?.[0]?.id === 1);

    userId.set(2);

    await waitFor(() => booksQuery.isSuccess() && booksQuery.value()?.[0]?.id === 2);

    expect(loaderCalls).toEqual([1, 2]);
  });

  it('reuses cache by key value and revalidates in the background', async () => {
    const firstUserId = signal(1);
    const secondUserId = signal(1);
    const firstResponse: Book[] = [{ id: 1, title: 'Cached Book' }];
    const secondResponse: Book[] = [{ id: 1, title: 'Fresh Book' }];
    const secondRequest = createDeferred<Book[]>();

    let callCount = 0;

    const loader = async ({
      queryKey,
    }: {
      queryKey: readonly [string, { userId: number }];
    }): Promise<Book[]> => {
      callCount += 1;
      const [, params] = queryKey;

      if (callCount === 1) {
        return [{ id: params.userId, title: firstResponse[0].title }];
      }

      return secondRequest.promise;
    };

    const firstConsumer = TestBed.runInInjectionContext(() =>
      queryResource(
        queryResourceOptions({
          queryKey: () => ['query-shared-cache', { userId: firstUserId(), page: 1 }] as const,
          loader: async ({ queryKey }) => {
            const [queryName, params] = queryKey;
            return loader({ queryKey: [queryName, { userId: params.userId }] });
          },
        }),
      ),
    );

    await waitFor(() => firstConsumer.isSuccess());
    expect(firstConsumer.value()).toEqual(firstResponse);
    expect(callCount).toBe(1);

    const secondConsumer = TestBed.runInInjectionContext(() =>
      queryResource(
        queryResourceOptions({
          queryKey: () => ['query-shared-cache', { page: 1, userId: secondUserId() }] as const,
          loader: async ({ queryKey }) => {
            const [queryName, params] = queryKey;
            return loader({ queryKey: [queryName, { userId: params.userId }] });
          },
        }),
      ),
    );

    await waitFor(() => callCount === 2);
    expect(secondConsumer.value()).toEqual(firstResponse);
    await waitFor(() => secondConsumer.isFetching());

    secondRequest.resolve(secondResponse);

    await waitFor(() => secondConsumer.value()?.[0]?.title === secondResponse[0].title);
    expect(secondConsumer.value()).toEqual(secondResponse);
  });
});
