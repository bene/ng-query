# Resource Query

Resource Query is a lightweight Angular library that provides query-style data fetching with Signals and `resource()`: cache by key, automatic revalidation, and ergonomic status flags for UI state.

It is designed to feel familiar if you have used query libraries before, while staying aligned with modern Angular primitives.

## Why This Library

- Signal-first API for Angular applications.
- Query key based caching by value, not object identity.
- Stale-while-revalidate behavior when a cached query is re-attached.
- Small API surface that is easy to adopt incrementally.

## Current Status

- `queryResource` is implemented and covered by tests.
- `mutationResource` is currently a placeholder API and is not production-ready yet.

## Introduction Guide

### 1. Install dependencies and run the project

```bash
npm install
npm run start
```

This repository includes a demo Angular app, so you can see Resource Query in action immediately.

### 2. Create typed query options

```ts
import { queryResourceOptions } from './lib/query/query-resource-options';

export const booksQueryOptions = (userId: () => number) =>
  queryResourceOptions({
    queryKey: () => ['books', { userId: userId() }] as const,
    loader: async ({ queryKey, abortSignal }) => {
      const [, params] = queryKey;
      const response = await fetch(`/api/users/${params.userId}/books`, { signal: abortSignal });

      if (!response.ok) {
        throw new Error('Failed to fetch books');
      }

      return (await response.json()) as Array<{ id: number; title: string }>;
    },
  });
```

### 3. Bind the query in an Angular component

```ts
import { Component, signal } from '@angular/core';
import { queryResource } from './lib/query';

@Component({
  selector: 'app-books',
  template: `
    @if (books.isLoading()) {
      <p>Loading...</p>
    }

    @if (books.isError()) {
      <p>Something went wrong: {{ books.error()?.message }}</p>
    }

    @if (books.value(); as items) {
      <ul>
        @for (book of items; track book.id) {
          <li>{{ book.title }}</li>
        }
      </ul>
    }
  `,
})
export class BooksComponent {
  userId = signal(1);

  books = queryResource(booksQueryOptions(() => this.userId()));
}
```

### 4. Update query keys reactively

When key values change, Resource Query re-executes the loader and updates the same query object signals.

```ts
this.userId.set(2);
```

### 5. Understand cache and revalidation behavior

When another consumer attaches to the same query key value:

- Cached data is returned immediately.
- A background revalidation is triggered.
- UI can detect this with `isFetching()`.

## API at a Glance

`queryResource(options)` returns:

- `value(): T | undefined`
- `status(): 'idle' | 'loading' | 'reloading' | 'resolved' | 'error' | 'local'`
- `error(): Error | undefined`
- `isIdle(): boolean`
- `isLoading(): boolean`
- `isFetching(): boolean`
- `isSuccess(): boolean`
- `isError(): boolean`
- `reload(): boolean`

## Development

Run tests:

```bash
npm run test
```

## Contributing

Issues and pull requests are welcome.

If you open an issue, include:

- Angular version
- Repro steps
- Expected vs actual behavior

## Roadmap

- Production-ready mutation support
- Better cache controls (stale time, garbage collection)
- Devtools-friendly debugging hooks

## License

Choose a license before your first public release (for example, MIT) and add a `LICENSE` file.
