import { Signal } from '@angular/core';

const MutationStatus = {
  IsIdle: 'IsIdle',
  isPending: 'isPending',
  isSuccess: 'isSuccess',
  isError: 'isError',
};

export type MutationResource = {
  status: Signal<(typeof MutationStatus)[keyof typeof MutationStatus]>;
  isIdle: Signal<boolean>;
  isPending: Signal<boolean>;
  isSuccess: Signal<boolean>;
  isError: Signal<boolean>;
};
