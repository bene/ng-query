import {
  assertInInjectionContext,
  computed,
  effect,
  EnvironmentInjector,
  inject,
  ResourceRef,
  resource,
  signal,
  untracked,
} from '@angular/core';
import { QueryKey, QueryResource, QueryResourceOptions, QueryStatus } from './types';

type QueryCacheEntry<T> = {
  resource: ResourceRef<T | undefined>;
};

const queryCache = new Map<string, QueryCacheEntry<unknown>>();

function serializeQueryKey(queryKey: QueryKey): string {
  return stableSerialize(queryKey, '$');
}

function stableSerialize(value: unknown, path: string): string {
  if (value === null) {
    return 'null';
  }

  if (typeof value === 'string') {
    return JSON.stringify(value);
  }

  if (typeof value === 'number') {
    if (!Number.isFinite(value)) {
      throw new TypeError(
        `queryKey must only include finite numbers. Received ${value} at ${path}.`,
      );
    }

    return JSON.stringify(value);
  }

  if (typeof value === 'boolean') {
    return value ? 'true' : 'false';
  }

  if (Array.isArray(value)) {
    return `[${value.map((item, index) => stableSerialize(item, path + '[' + index + ']')).join(',')}]`;
  }

  if (typeof value === 'object') {
    const prototype = Object.getPrototypeOf(value);

    if (prototype !== Object.prototype && prototype !== null) {
      throw new Error(
        `queryKey objects must be plain JSON-like objects. Received invalid value at ${path}.`,
      );
    }

    const objectValue = value as Record<string, unknown>;
    const objectKeys = Object.keys(objectValue).sort((leftKey, rightKey) =>
      leftKey.localeCompare(rightKey),
    );

    return `{${objectKeys
      .map((key) => `${JSON.stringify(key)}:${stableSerialize(objectValue[key], path + '.' + key)}`)
      .join(',')}}`;
  }

  throw new Error(`queryKey must be JSON-serializable. Received ${typeof value} at ${path}.`);
}

function getOrCreateEntry<T, TQueryKey extends QueryKey>(
  options: QueryResourceOptions<T, TQueryKey>,
  queryKey: TQueryKey,
  cacheKey: string,
  injector: EnvironmentInjector,
): QueryCacheEntry<T> {
  const existingEntry = queryCache.get(cacheKey);

  if (existingEntry) {
    return existingEntry as QueryCacheEntry<T>;
  }

  const createdEntry: QueryCacheEntry<T> = {
    resource: resource<T, TQueryKey>({
      injector,
      params: () => queryKey,
      loader: async ({ abortSignal, params, previous }) => {
        return options.loader({
          queryKey: params,
          abortSignal,
          previousStatus: previous.status,
        });
      },
    }),
  };

  queryCache.set(cacheKey, createdEntry as QueryCacheEntry<unknown>);
  return createdEntry;
}

function revalidateEntryOnAttach(entry: QueryCacheEntry<unknown>): void {
  untracked(() => {
    const currentStatus = entry.resource.status();

    if (currentStatus === 'resolved' || currentStatus === 'local' || currentStatus === 'error') {
      entry.resource.reload();
    }
  });
}

export function queryResource<T, TQueryKey extends QueryKey>(
  options: QueryResourceOptions<T, TQueryKey>,
): QueryResource<T> {
  assertInInjectionContext(queryResource);

  const injector = inject(EnvironmentInjector);
  const activeEntry = signal<QueryCacheEntry<T> | null>(null);

  let lastCacheKey: string | null = null;

  effect(() => {
    const queryKey = options.queryKey();
    const cacheKey = serializeQueryKey(queryKey);
    const nextEntry = untracked(() => getOrCreateEntry(options, queryKey, cacheKey, injector));
    const switchedEntry = cacheKey !== lastCacheKey;

    lastCacheKey = cacheKey;
    activeEntry.set(nextEntry);

    if (switchedEntry) {
      revalidateEntryOnAttach(nextEntry);
    }
  });

  const value = computed(() => activeEntry()?.resource.value());
  const status = computed<QueryStatus>(() => activeEntry()?.resource.status() ?? 'idle');
  const error = computed(() => activeEntry()?.resource.error());

  const isIdle = computed(() => status() === 'idle');
  const isLoading = computed(() => status() === 'loading');
  const isFetching = computed(() => {
    const currentStatus = status();
    return currentStatus === 'loading' || currentStatus === 'reloading';
  });
  const isSuccess = computed(() => {
    const currentStatus = status();
    return currentStatus === 'resolved' || currentStatus === 'local';
  });
  const isError = computed(() => status() === 'error');

  return {
    value,
    status,
    error,
    isIdle,
    isLoading,
    isFetching,
    isSuccess,
    isError,
    reload: () => {
      return untracked(() => activeEntry()?.resource.reload() ?? false);
    },
  };
}
