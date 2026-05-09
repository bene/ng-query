import { Signal } from '@angular/core';

export type QueryResource<T> = {
  value: Signal<T | undefined>;
};

export type QueryResourceOptions<T> = {
  queryKey?: string[];
  loader: () => Promise<T>;
};
