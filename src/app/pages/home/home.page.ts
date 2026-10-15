import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import {
  IonContent,
  IonItem,
  IonLabel,
  IonList,
  IonListHeader,
  IonNote,
  IonRefresher,
  IonRefresherContent,
  IonSearchbar,
  IonSpinner,
  IonThumbnail,
  type RefresherCustomEvent,
  type SearchbarCustomEvent,
} from '@ionic/angular';
import { ApiError, ApiService } from '../../core';
import { Cookbook, RecipeSummary } from '../../models';
import { NavBarComponent } from '../../shared';

@Component({
  selector: 'app-home',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    IonContent,
    IonItem,
    IonLabel,
    IonList,
    IonListHeader,
    IonNote,
    IonRefresher,
    IonRefresherContent,
    IonSearchbar,
    IonSpinner,
    IonThumbnail,
    NavBarComponent,
  ],
  styles: `
    .cookbooks { display: flex; gap: 12px; overflow-x: auto; padding: 4px 16px 12px; }
    .cookbook { flex: 0 0 104px; text-align: center; font-size: 0.85rem; }
    .cookbook img { width: 104px; height: 140px; object-fit: cover; border-radius: 8px; background: var(--ion-color-light); }
    ion-thumbnail img { border-radius: 6px; }
    .state { text-align: center; padding: 48px 24px; }
  `,
  template: `
    <app-nav-bar title="ספר מתכונים" (clickSearch)="searching.set(!searching())"></app-nav-bar>
    <ion-content>
      <ion-refresher slot="fixed" (ionRefresh)="refresh($event)">
        <ion-refresher-content></ion-refresher-content>
      </ion-refresher>
      @if (searching()) {
        <ion-searchbar placeholder="חיפוש מתכון" [debounce]="300" (ionInput)="search($event)"></ion-searchbar>
      }

      @if (error(); as message) {
        <div class="state"><ion-note>{{ message }}</ion-note></div>
      } @else if (recipes() === null) {
        <div class="state"><ion-spinner name="crescent"></ion-spinner></div>
      } @else {
        @if (!query() && cookbooks().length) {
          <ion-list-header>ספרי בישול</ion-list-header>
          <div class="cookbooks">
            @for (c of cookbooks(); track c.slug) {
              <div class="cookbook">
                <img [src]="api.imageUrl(c.cover)" alt="" loading="lazy" />
                <div>{{ c.title }}</div>
                <ion-note>{{ c.count }}</ion-note>
              </div>
            }
          </div>
        }
        <ion-list-header>{{ query() ? 'תוצאות' : 'נוספו לאחרונה' }}</ion-list-header>
        <ion-list>
          @for (r of shown(); track r.id) {
            <ion-item>
              <ion-thumbnail slot="start">
                @if (r.image) {
                  <img [src]="api.imageUrl(r.image)" alt="" loading="lazy" />
                }
              </ion-thumbnail>
              <ion-label>
                <h2>{{ r.title }}</h2>
                @if (r.tags.length) {
                  <p>{{ r.tags.join(' · ') }}</p>
                }
              </ion-label>
            </ion-item>
          } @empty {
            <div class="state"><ion-note>{{ query() ? 'לא נמצא מתכון.' : 'הספר עוד ריק.' }}</ion-note></div>
          }
        </ion-list>
      }
    </ion-content>
  `,
})
export class HomePage {
  protected readonly api = inject(ApiService);

  protected readonly searching = signal(false);
  protected readonly query = signal('');
  protected readonly cookbooks = signal<Cookbook[]>([]);
  protected readonly recipes = signal<RecipeSummary[] | null>(null);
  protected readonly error = signal('');
  private loads = 0;

  /** Newest first, as the server sends them; a search shows every match. */
  protected readonly shown = computed(() => {
    const all = this.recipes() ?? [];
    return this.query() ? all : all.slice(0, 30);
  });

  constructor() {
    void this.load();
  }

  protected search(event: SearchbarCustomEvent): void {
    this.query.set((event.detail.value ?? '').trim());
    void this.load();
  }

  protected async refresh(event: RefresherCustomEvent): Promise<void> {
    await this.load();
    await event.target.complete();
  }

  private async load(): Promise<void> {
    const seq = ++this.loads;
    this.error.set('');
    try {
      const q = this.query();
      const [recipes, cookbooks] = await Promise.all([
        this.api.recipes({ q }),
        q ? Promise.resolve(this.cookbooks()) : this.api.cookbooks(),
      ]);
      if (seq !== this.loads) {
        return; // a newer search started while this one was in flight
      }
      this.recipes.set(recipes);
      this.cookbooks.set(cookbooks);
    } catch (e) {
      this.error.set(e instanceof ApiError ? e.message : 'משהו השתבש.');
    }
  }
}
