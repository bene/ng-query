import { Injectable } from '@angular/core';
import { queryResourceOptions } from './lib/query/query-resource-options';

@Injectable({ providedIn: 'root' })
export class BooksService {
  booksQueryOptions = queryResourceOptions<{ userId: number }>({
    loader: async (params) => {
      await new Promise((resolve) => setTimeout(resolve, 1000));

      return [
        { id: 1, title: 'The Great Gatsby' },
        { id: 2, title: 'To Kill a Mockingbird' },
        { id: 3, title: '1984' },
      ];
    },
  });
}
