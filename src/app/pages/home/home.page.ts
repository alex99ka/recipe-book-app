import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  AlertController,
  IonContent,
  IonIcon,
  IonListHeader,
  IonNote,
  IonRefresher,
  IonRefresherContent,
  IonSearchbar,
  IonSpinner,
  type RefresherCustomEvent,
  type SearchbarCustomEvent,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import { add, bookOutline } from 'ionicons/icons';
import { ApiError, ApiService, TourService } from '../../core';
import { Collection, Cookbook, RecipeSummary } from '../../models';
import { AlertService, NavBarComponent, RecipeListComponent, askTitle } from '../../shared';

@Component({
  selector: 'app-home',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    IonContent,
    IonIcon,
    IonListHeader,
    IonNote,
    IonRefresher,
    IonRefresherContent,
    IonSearchbar,
    IonSpinner,
    NavBarComponent,
    RecipeListComponent,
    RouterLink,
  ],
  styles: `
    .cookbooks { display: flex; gap: 12px; overflow-x: auto; padding: 4px 16px 12px; }
    .cookbook { flex: 0 0 104px; text-align: center; font-size: 0.85rem; color: inherit; text-decoration: none; }
    .cookbook img { width: 104px; height: 140px; object-fit: cover; border-radius: 8px; background: var(--ion-color-light); }
    button.cookbook { background: none; border: 0; padding: 0; font: inherit; }
    .blank { width: 104px; height: 140px; border-radius: 8px; background: var(--ion-color-light);
             display: grid; place-items: center; font-size: 2.2rem; color: var(--ion-color-medium); }
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
        @if (!query()) {
          <ion-list-header>הספרים שלי</ion-list-header>
          <div class="cookbooks" data-tour="my-books">
            @for (c of collections(); track c.id) {
              <a class="cookbook" [routerLink]="['/collection', c.id]" [state]="{ title: c.title }">
                @if (c.cover) {
                  <img [src]="api.imageUrl(c.cover)" alt="" loading="lazy" />
                } @else {
                  <div class="blank"><ion-icon name="book-outline" aria-hidden="true"></ion-icon></div>
                }
                <div>{{ c.title }}</div>
                <ion-note>{{ c.count }}</ion-note>
              </a>
            }
            <button class="cookbook" type="button" (click)="newCollection()">
              <div class="blank"><ion-icon name="add" aria-hidden="true"></ion-icon></div>
              <div>ספר חדש</div>
            </button>
          </div>
        }
        @if (!query() && cookbooks().length) {
          <ion-list-header>ספרי בישול</ion-list-header>
          <div class="cookbooks" data-tour="cookbooks">
            @for (c of cookbooks(); track c.slug) {
              <a class="cookbook" [routerLink]="['/cookbook', c.slug]" [state]="{ title: c.title }">
                <img [src]="api.imageUrl(c.cover)" alt="" loading="lazy" />
                <div>{{ c.title }}</div>
                <ion-note>{{ c.count }}</ion-note>
              </a>
            }
          </div>
        }
        <ion-list-header>{{ query() ? 'תוצאות' : 'נוספו לאחרונה' }}</ion-list-header>
        <app-recipe-list data-tour="recent" [recipes]="shown()" [empty]="query() ? 'לא נמצא מתכון.' : 'הספר עוד ריק.'" />
      }
    </ion-content>
  `,
})
export class HomePage {
  protected readonly api = inject(ApiService);
  private readonly alerts = inject(AlertController);
  private readonly alert = inject(AlertService);

  protected readonly searching = signal(false);
  protected readonly query = signal('');
  protected readonly cookbooks = signal<Cookbook[]>([]);
  protected readonly collections = signal<Collection[]>([]);
  protected readonly recipes = signal<RecipeSummary[] | null>(null);
  protected readonly error = signal('');
  private loads = 0;

  /** Newest first, as the server sends them; a search shows every match. */
  protected readonly shown = computed(() => {
    const all = this.recipes() ?? [];
    return this.query() ? all : all.slice(0, 30);
  });

  constructor() {
    addIcons({ add, bookOutline });
    const tour = inject(TourService);
    // The first time the book opens on this device, show it around.
    void this.load().then(() => this.error() || tour.startOnce());
  }

  /** Back from a recipe or a cookbook, whose cookbooks may have changed. */
  ionViewWillEnter(): void {
    if (this.recipes()) {
      void this.api.collections().then((c) => this.collections.set(c), () => undefined);
    }
  }

  protected async newCollection(): Promise<void> {
    const title = await askTitle(this.alerts, 'ספר מתכונים חדש');
    if (!title) return;
    try {
      const created = await this.api.createCollection(title);
      this.collections.update((list) => [...list, created]);
    } catch (e) {
      await this.alert.presentToast(e instanceof ApiError ? e.message : 'הספר לא נוצר.');
    }
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
      const [recipes, cookbooks, collections] = await Promise.all([
        this.api.recipes({ q }),
        q ? Promise.resolve(this.cookbooks()) : this.api.cookbooks(),
        q ? Promise.resolve(this.collections()) : this.api.collections(),
      ]);
      if (seq !== this.loads) {
        return; // a newer search started while this one was in flight
      }
      this.recipes.set(recipes);
      this.cookbooks.set(cookbooks);
      this.collections.set(collections);
    } catch (e) {
      this.error.set(e instanceof ApiError ? e.message : 'משהו השתבש.');
    }
  }
}
