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
  /** Items friends sent that are waiting in the inbox. */
  inbox: number;
  /** The TRMNL screen is linked to this book. */
  panel: boolean;
}

/** Whose the TRMNL screen is: this book's, nobody's (it shows a code), or another book's. */
export interface PanelState {
  state: 'mine' | 'free' | 'taken';
}

/** A calendar feed on the screen's idle page. The address stays on the server. */
export interface CalendarFeed {
  index: number;
  name: string;
  shade: number;
  host: string;
  /** Events in the next 30 days; null when the feed couldn't be read. */
  upcoming: number | null;
  error: string;
}

export interface RecipeComment {
  id: number;
  author: string;
  body: string;
  mine: boolean;
  createdAt: string;
}

/**
 * A recipe's comments (its book sees them). On a copy a friend sent, sentBy
 * names the sender, who sees them too; on an original, each copy sent from it
 * is a thread: the conversation with that friend.
 */
export interface RecipeComments {
  comments: RecipeComment[];
  sentBy: string | null;
  threads: { copyId: string; friend: string; comments: RecipeComment[] }[];
}

export interface RecipePatch {
  name?: string;
  tags?: string[];
  categories?: string[];
  sourceUrl?: string;
}

/** An account you can send copies to; separate from households. */
export interface Friend {
  uid: string;
  name: string;
}

/** Something a friend sent. The copies are already in your book. */
export interface InboxItem {
  id: number;
  from: string;
  title: string;
  count: number;
  /** What the friend wrote when sending; "" for none. */
  note: string;
  /** Set for a single recipe. */
  recipeId: string | null;
  /** Set for a whole cookbook (its copy in your book). */
  collectionId: number | null;
  createdAt: string;
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
