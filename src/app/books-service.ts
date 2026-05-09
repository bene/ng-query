import { Injectable, Signal } from '@angular/core';
import { queryResourceOptions } from './lib/query/query-resource-options';

@Injectable({ providedIn: 'root' })
export class BooksService {
  createBooksQueryOptions = (userId: Signal<number>) => {
    return queryResourceOptions({
      queryKey: () => ['books', userId()] as const,
      loader: async ({ queryKey }) => {
        const [, userId] = queryKey;

        await new Promise((resolve) => setTimeout(resolve, 1000));

        return await mockFetchBooks({ userId });
      },
    });
  };
}

async function mockFetchBooks(params: {
  userId: number;
}): Promise<{ id: number; title: string }[]> {
  if (params.userId === 1) {
    return [
      { id: 1, title: 'The Great Gatsby' },
      { id: 2, title: 'To Kill a Mockingbird' },
      { id: 3, title: '1984' },
    ];
  } else if (params.userId === 2) {
    return [
      { id: 4, title: 'Moby Dick' },
      { id: 5, title: 'War and Peace' },
    ];
  }

  return [];
}
