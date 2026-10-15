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

/** A cookbook made in the app; the whole household shares it. */
export interface Collection {
  id: number;
  title: string;
  count: number;
  /** The newest recipe's photo, signed; null when empty or without photos. */
  cover: string | null;
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

/** An ingredient line with its saved price; `was` is the old text when the line changed since. */
export interface PriceLine {
  line: string;
  price: number | null;
  was: string | null;
}

/** The recipe's cost as written; null until something is priced. */
export interface Cost {
  total: number;
  servings: number | null;
  per_serving: number | null;
  missing: number;
  stale: number;
}

export interface RecipeDetail extends RecipeSummary {
  ingredients: string[];
  steps: string[];
  servings: string;
  totalTime: string;
  sourceUrl: string;
  prices: PriceLine[];
  cost: Cost | null;
  /** The Hebrew translation is being made right now; reopen to see it. */
  translating: boolean;
  copiedFrom: string | null;
  book: string;
  /** Ids of the book's own cookbooks this recipe is in. */
  collections: number[];
}

/** The error body every non-2xx response carries. */
export interface ApiErrorBody {
  error: string;
  message: string;
}
