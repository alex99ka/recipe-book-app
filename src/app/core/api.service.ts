import { Injectable, inject, signal } from '@angular/core';
import { environment } from '../../environments/environment';
import { ApiErrorBody, Cookbook, Me, RecipeSummary } from '../models';
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

  recipes(filter: { q?: string; cookbook?: string; tag?: string; minStars?: number } = {}): Promise<RecipeSummary[]> {
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(filter)) {
      if (v !== undefined && v !== '') {
        params.set(k, String(v));
      }
    }
    const query = params.toString();
    return this.get<RecipeSummary[]>(`/recipes${query ? `?${query}` : ''}`);
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
    if (body !== undefined) {
      headers['Content-Type'] = 'application/json';
    }
    let res: Response;
    try {
      res = await fetch(environment.apiUrl + path, {
        method,
        headers,
        body: body === undefined ? undefined : JSON.stringify(body),
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
