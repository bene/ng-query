import { Component, inject, signal } from '@angular/core';

import { BooksService } from './books-service';
import { queryResource } from './lib/query';

@Component({
  selector: 'app-root',
  templateUrl: './app.html',
})
export class App {
  booksService = inject(BooksService);

  userId = signal(1);
  booksResource = queryResource(this.booksService.createBooksQueryOptions(this.userId));

  toggleUser() {
    this.userId.update((id) => (id === 1 ? 2 : 1));
  }
}
