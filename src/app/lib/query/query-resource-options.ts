import { QueryKey, QueryResourceOptions } from './types';

export function queryResourceOptions<T, TQueryKey extends QueryKey>(
  options: QueryResourceOptions<T, TQueryKey>,
): QueryResourceOptions<T, TQueryKey> {
  return options;
}
