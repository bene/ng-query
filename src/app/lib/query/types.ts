import { ResourceStatus, Signal } from '@angular/core';

export type QueryKeyPrimitive = boolean | null | number | string;
export type QueryKeyValue = QueryKeyPrimitive | QueryKeyValue[] | { [key: string]: QueryKeyValue };
export type QueryKey = readonly QueryKeyValue[];

export type QueryLoaderContext<TQueryKey extends QueryKey> = {
  queryKey: TQueryKey;
  abortSignal: AbortSignal;
  previousStatus: ResourceStatus;
};

export type QueryStatus = ResourceStatus;

export type QueryResource<T> = {
  value: Signal<T | undefined>;
  status: Signal<QueryStatus>;
  error: Signal<Error | undefined>;
  isIdle: Signal<boolean>;
  isLoading: Signal<boolean>;
  isFetching: Signal<boolean>;
  isSuccess: Signal<boolean>;
  isError: Signal<boolean>;
  reload: () => boolean;
  reset: () => void;
};

export type QueryRefetchInterval = number | false | (() => number | false | undefined);

export type QueryResourceOptions<T, TQueryKey extends QueryKey = QueryKey> = {
  queryKey: () => TQueryKey;
  refetchInterval?: QueryRefetchInterval;
  loader: (context: QueryLoaderContext<TQueryKey>) => Promise<T>;
};
