import { Component, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { BooksService } from './books-service';
import { queryResource } from './lib/query';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
})
export class App {
  booksService = inject(BooksService);
  userId = signal(1);

  booksResource = queryResource(this.booksService.booksQueryOptions, () => ({
    userId: this.userId(),
  }));
}
