import { Signal } from '@angular/core';

export type QueryResource<T> = {
  value: Signal<T | undefined>;
};

export type QueryResourceOptions<P, T> = {
  queryKey?: string[];
  loader: (params: P) => Promise<T>;
};
