import { Injectable, inject, signal } from '@angular/core';
import { environment } from '../../environments/environment';
import {
  ApiErrorBody, CalendarFeed, RecipeComment, RecipeComments, Collection, Cookbook, Cost, Friend, InboxItem, Me, PanelState, PriceLine, RecipeDetail,
  RecipePatch, RecipeSummary,
} from '../models';
import { AuthService } from './auth.service';

const BOOK_KEY = 'recipes.book';

/** A failed API call, with the server's Hebrew message ready to show. */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
  ) {
    super(message);
  }
}

/**
 * The recipe server's /api/v1. Every call carries the Firebase ID token; the
 * server decides what this account may see. X-Book picks one of the books in
 * /me (a member of several households switches in Settings).
 */
@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly auth = inject(AuthService);
  private readonly origin = new URL(environment.apiUrl).origin;

  /** The chosen book; empty means the server's default (the first one). */
  readonly book = signal(localStorage.getItem(BOOK_KEY) ?? '');

  /** Waiting inbox items, for the menu badge and the home banner. */
  readonly inboxCount = signal(0);

  setBook(key: string): void {
    localStorage.setItem(BOOK_KEY, key);
    this.book.set(key);
  }

  me(): Promise<Me> {
    return this.get<Me>('/me');
  }

  cookbooks(): Promise<Cookbook[]> {
    return this.get<Cookbook[]>('/cookbooks');
  }

  collections(): Promise<Collection[]> {
    return this.get<Collection[]>('/collections');
  }

  createCollection(title: string): Promise<Collection> {
    return this.request('POST', '/collections', { title });
  }

  renameCollection(id: number, title: string): Promise<{ id: number; title: string }> {
    return this.request('PATCH', `/collections/${id}`, { title });
  }

  /** The cookbook only; its recipes stay in the book. */
  deleteCollection(id: number): Promise<void> {
    return this.request('DELETE', `/collections/${id}`);
  }

  /** Puts the recipe in the cookbook (in = true) or takes it out. */
  fileRecipe(collectionId: number, recipeId: string, inIt: boolean): Promise<void> {
    return this.request(inIt ? 'PUT' : 'DELETE', `/collections/${collectionId}/recipes/${encodeURIComponent(recipeId)}`);
  }

  recipes(filter: { q?: string; cookbook?: string; collection?: number; tag?: string; minStars?: number } = {}): Promise<RecipeSummary[]> {
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(filter)) {
      if (v !== undefined && v !== '') {
        params.set(k, String(v));
      }
    }
    const query = params.toString();
    return this.get<RecipeSummary[]>(`/recipes${query ? `?${query}` : ''}`);
  }

  recipe(id: string): Promise<RecipeDetail> {
    return this.get<RecipeDetail>(`/recipes/${encodeURIComponent(id)}`);
  }

  /** 0.5 to 5 in half steps, or null to clear. */
  setRating(id: string, stars: number | null): Promise<{ rating: number | null }> {
    return this.request('PUT', `/recipes/${encodeURIComponent(id)}/rating`, { stars });
  }

  /** A link to the to-do app's import screen with these groceries. Send the lines as shown, so doubled amounts stay doubled. */
  shoppingList(id: string, lines: string[]): Promise<{ url: string }> {
    return this.request('POST', `/recipes/${encodeURIComponent(id)}/shopping-list`, { lines });
  }

  friends(): Promise<Friend[]> {
    return this.get<Friend[]>('/friends');
  }

  /** A single-use link, valid for a week. */
  createInvite(): Promise<{ url: string; expiresAt: string }> {
    return this.request('POST', '/friends/invites');
  }

  /** Works before this account is let in: accepting is what lets it in. */
  acceptInvite(token: string): Promise<Friend> {
    return this.request('POST', `/friends/invites/${encodeURIComponent(token)}/accept`);
  }

  removeFriend(uid: string): Promise<void> {
    return this.request('DELETE', `/friends/${encodeURIComponent(uid)}`);
  }

  /** Sends a copy of a recipe, or of a whole cookbook, into the friend's book. */
  send(what: { recipe: string } | { collection: number }, to: string, note = ''): Promise<{ sent: number }> {
    const path = 'recipe' in what
      ? `/recipes/${encodeURIComponent(what.recipe)}/send`
      : `/collections/${what.collection}/send`;
    return this.request('POST', path, { to, note });
  }

  comments(recipeId: string): Promise<RecipeComments> {
    return this.get<RecipeComments>(`/recipes/${encodeURIComponent(recipeId)}/comments`);
  }

  /** thread: a copy of this recipe, to answer in the conversation with that friend. */
  addComment(recipeId: string, body: string, thread?: string): Promise<RecipeComment> {
    return this.request('POST', `/recipes/${encodeURIComponent(recipeId)}/comments`, { body, thread });
  }

  deleteComment(id: number): Promise<void> {
    return this.request('DELETE', `/comments/${id}`);
  }

  inbox(): Promise<InboxItem[]> {
    return this.get<InboxItem[]>('/inbox');
  }

  /** keep leaves the copies; discard deletes them. */
  settle(id: number, how: 'keep' | 'discard'): Promise<void> {
    return this.request('POST', `/inbox/${id}/${how}`);
  }

  /** From a link (web page or cooking video) or pasted text. The Hebrew follows in the background. */
  createRecipe(body: { url?: string; text?: string; collections: number[] }): Promise<{ id: string }> {
    return this.request('POST', '/recipes', body);
  }

  /** From a photo or PDF of a recipe, with an optional photo of the dish. */
  uploadRecipe(source: File, dish: File | null, collections: number[]): Promise<{ id: string }> {
    const form = new FormData();
    form.append('source', source);
    if (dish) form.append('photo', dish);
    form.append('collections', collections.join(','));
    return this.request('POST', '/recipes/upload', form);
  }

  updateRecipe(id: string, patch: RecipePatch): Promise<RecipeDetail> {
    return this.request('PATCH', `/recipes/${encodeURIComponent(id)}`, patch);
  }

  deleteRecipe(id: string): Promise<void> {
    return this.request('DELETE', `/recipes/${encodeURIComponent(id)}`);
  }

  setPhoto(id: string, photo: File): Promise<{ image: string | null }> {
    const form = new FormData();
    form.append('photo', photo);
    return this.request('PUT', `/recipes/${encodeURIComponent(id)}/photo`, form);
  }

  /** Prices as typed ("12.90", "" for none); the server parses them. */
  setPrices(id: string, lines: { line: string; price: string }[]): Promise<{ prices: PriceLine[]; cost: Cost | null }> {
    return this.request('PUT', `/recipes/${encodeURIComponent(id)}/prices`, lines);
  }

  panel(): Promise<PanelState> {
    return this.get<PanelState>('/panel');
  }

  /** With the code the unlinked screen shows. */
  linkPanel(code: string): Promise<PanelState> {
    return this.request('POST', '/panel/link', { code });
  }

  unlinkPanel(): Promise<void> {
    return this.request('DELETE', '/panel');
  }

  calendars(): Promise<CalendarFeed[]> {
    return this.get<CalendarFeed[]>('/calendars');
  }

  addCalendar(url: string, name: string): Promise<{ name: string; upcoming: number }> {
    return this.request('POST', '/calendars', { url, name });
  }

  renameCalendar(index: number, name: string): Promise<void> {
    return this.request('PATCH', `/calendars/${index}`, { name });
  }

  deleteCalendar(index: number): Promise<void> {
    return this.request('DELETE', `/calendars/${index}`);
  }

  /** Image and cover paths are signed by the server and need no token, so they go straight into <img>. */
  imageUrl(path: string | null): string | null {
    return path ? this.origin + path : null;
  }

  private async get<T>(path: string): Promise<T> {
    return this.request<T>('GET', path);
  }

  private async request<T>(method: string, path: string, body?: unknown): Promise<T> {
    const token = await this.auth.idToken();
    if (!token) {
      throw new ApiError(401, 'unauthenticated', 'צריך להתחבר.');
    }
    const headers: Record<string, string> = { Authorization: `Bearer ${token}` };
    if (this.book()) {
      headers['X-Book'] = this.book();
    }
    // FormData sets its own multipart Content-Type, boundary included.
    const form = body instanceof FormData;
    if (body !== undefined && !form) {
      headers['Content-Type'] = 'application/json';
    }
    let res: Response;
    try {
      res = await fetch(environment.apiUrl + path, {
        method,
        headers,
        body: body === undefined ? undefined : form ? (body as FormData) : JSON.stringify(body),
      });
    } catch {
      throw new ApiError(0, 'offline', 'אין חיבור לשרת המתכונים.');
    }
    if (!res.ok) {
      const err = (await res.json().catch(() => null)) as ApiErrorBody | null;
      throw new ApiError(res.status, err?.error ?? 'http_error', err?.message ?? `שגיאה ${res.status}`);
    }
    return res.status === 204 ? (undefined as T) : ((await res.json()) as T);
  }
}
