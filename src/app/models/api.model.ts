// Shapes returned by the recipe server's /api/v1 (server/api.py in trmnl-recipe-book).

export interface Book {
  key: string;
  kind: 'household' | 'user';
  title: string;
}

export interface Me {
  uid: string;
  email: string;
  name: string;
  admin: boolean;
  books: Book[];
  /** Key of the book this request was served from. */
  book: string;
  createsThisMonth: number;
  /** null for admins: no monthly cap. */
  createsPerMonth: number | null;
}

export interface Cookbook {
  slug: string;
  title: string;
  /** Signed path under the API, e.g. /api/v1/covers/x.jpg?sig=… */
  cover: string | null;
  count: number;
}

export interface RecipeSummary {
  id: string;
  /** Hebrew title once translated, otherwise the original name. */
  title: string;
  name: string;
  /** Signed path under the API, or null when there is no photo yet. */
  image: string | null;
  rating: number | null;
  tags: string[];
  categories: string[];
  sourceBook: string | null;
  translated: boolean;
  addedBy: string | null;
  createdAt: string | null;
}

/** The error body every non-2xx response carries. */
export interface ApiErrorBody {
  error: string;
  message: string;
}
