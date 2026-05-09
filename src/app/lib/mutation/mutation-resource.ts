import { MutationResource } from './types';

export function mutationResource<T>(mutationFn: (data: T) => Promise<void>): MutationResource {
  return {} as MutationResource;
}
