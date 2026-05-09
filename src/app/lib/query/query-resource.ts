import { signal } from '@angular/core';
import { QueryResource, QueryResourceOptions } from './types';

export function queryResource<T>(options: QueryResourceOptions<T>): QueryResource<T> {
  return {
    value: signal(undefined),
  } as QueryResource<T>;
}
