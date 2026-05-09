import { QueryResource, QueryResourceOptions } from './types';

export function queryResource<P, T>(
  options: QueryResourceOptions<P, T>,
  params: () => P,
): QueryResource<T> {
  return {} as QueryResource<T>;
}
