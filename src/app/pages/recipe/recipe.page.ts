import { ChangeDetectionStrategy, Component, OnInit, computed, inject, input, signal } from '@angular/core';
import {
  AlertController,
  IonBackButton,
  IonButton,
  IonButtons,
  IonChip,
  IonContent,
  IonHeader,
  IonIcon,
  IonLabel,
  IonNote,
  IonRefresher,
  IonRefresherContent,
  IonSegment,
  IonSegmentButton,
  IonSpinner,
  IonTitle,
  IonToolbar,
  type RefresherCustomEvent,
  type SegmentCustomEvent,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import { bookmarkOutline, cartOutline, linkOutline, logoTiktok, star, starHalf, starOutline } from 'ionicons/icons';
import { ApiError, ApiService } from '../../core';
import { Collection, RecipeDetail } from '../../models';
import { AlertService, askTitle, pretty, scaleIngredient } from '../../shared';

@Component({
  selector: 'app-recipe',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    IonBackButton,
    IonButton,
    IonButtons,
    IonChip,
    IonContent,
    IonHeader,
    IonIcon,
    IonLabel,
    IonNote,
    IonRefresher,
    IonRefresherContent,
    IonSegment,
    IonSegmentButton,
    IonSpinner,
    IonTitle,
    IonToolbar,
  ],
  styles: `
    .hero { width: 100%; max-height: 300px; object-fit: cover; display: block; }
    .body { padding: 0 16px 32px; }
    h1 { margin: 16px 0 4px; }
    .stars ion-button { --padding-start: 2px; --padding-end: 2px; margin: 0; }
    .meta { color: var(--ion-color-medium); margin: 4px 0 12px; }
    .tiktok { margin: 8px 0; }
    h3 { margin: 24px 0 8px; }
    ul, ol { padding-inline-start: 20px; margin: 0; }
    li { margin: 6px 0; line-height: 1.5; }
    li.noprice::after, li.stale::after { font-size: 0.75rem; margin-inline-start: 6px; }
    li.noprice::after { content: 'בלי מחיר'; color: var(--ion-color-medium); }
    li.stale::after { content: 'מחיר לבדיקה'; color: var(--ion-color-warning-shade); }
    .cost { display: flex; gap: 24px; margin-top: 12px; padding: 12px; border-radius: 8px; background: var(--ion-color-light); }
    .cost b { display: block; font-size: 1.1rem; }
    .state { text-align: center; padding: 48px 24px; }
  `,
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start"><ion-back-button defaultHref="/home" text=""></ion-back-button></ion-buttons>
        <ion-title>{{ recipe()?.title ?? '' }}</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      <ion-refresher slot="fixed" (ionRefresh)="refresh($event)">
        <ion-refresher-content></ion-refresher-content>
      </ion-refresher>
      @if (error(); as message) {
        <div class="state"><ion-note>{{ message }}</ion-note></div>
      } @else if (recipe(); as r) {
        @if (r.image) {
          <img class="hero" [src]="api.imageUrl(r.image)" alt="" />
        }
        <div class="body">
          <h1>{{ r.title }}</h1>
          <div class="stars" role="group" aria-label="דירוג" data-tour="stars">
            @for (i of [1, 2, 3, 4, 5]; track i) {
              <ion-button fill="clear" size="small" color="warning" [attr.aria-label]="i + ' כוכבים'" (click)="rate(i)">
                <ion-icon slot="icon-only" [name]="starIcon(i)"></ion-icon>
              </ion-button>
            }
          </div>
          @if (isTikTok(r.sourceUrl)) {
            <ion-button class="tiktok" expand="block" color="dark" [href]="r.sourceUrl" target="_blank" rel="noopener">
              <ion-icon slot="start" name="logo-tiktok" aria-hidden="true"></ion-icon>
              לסרטון בטיקטוק
            </ion-button>
          }
          @if (r.servings || r.totalTime) {
            <p class="meta">
              @if (r.servings) { {{ r.servings }} מנות }
              @if (r.servings && r.totalTime) { · }
              @if (r.totalTime) { {{ r.totalTime }} }
            </p>
          }
          @if (r.translating || !r.translated) {
            <ion-note>התרגום לעברית בדרך. משכו למטה לרענון בעוד דקה.</ion-note>
          }

          <h3>מצרכים</h3>
          <ion-segment data-tour="scale" [value]="factor()" (ionChange)="setFactor($event)">
            @for (f of [1, 2, 3]; track f) {
              <ion-segment-button [value]="f"><ion-label>×{{ f }}</ion-label></ion-segment-button>
            }
          </ion-segment>
          @if (factor() !== 1) {
            <ion-note>הכמויות הוכפלו. זמני הבישול לא משתנים.</ion-note>
          }
          <ul>
            @for (p of r.prices; track $index) {
              <li [class.noprice]="r.cost && p.price === null" [class.stale]="r.cost && p.was">{{ shownLines()[$index] }}</li>
            }
          </ul>
          @if (r.cost; as c) {
            <div class="cost">
              <div><ion-note>עלות משוערת</ion-note><b>{{ (c.total * factor()).toFixed(2) }} ₪</b></div>
              @if (c.per_serving !== null && c.servings !== null) {
                <div>
                  <ion-note>למנה ({{ prettyNumber(c.servings * factor()) }} מנות)</ion-note>
                  <b>{{ c.per_serving.toFixed(2) }} ₪</b>
                </div>
              }
            </div>
            @if (c.missing || c.stale) {
              <ion-note>
                @if (c.missing) { לא כולל {{ c.missing }} מצרכים בלי מחיר. }
                @if (c.stale) { {{ c.stale }} מחירים לבדיקה: השורה השתנתה מאז שתומחרה. }
              </ion-note>
            }
          }
          <ion-button data-tour="add-to-book" expand="block" fill="outline" (click)="fileInBooks()">
            <ion-icon slot="start" name="bookmark-outline" aria-hidden="true"></ion-icon>
            הוספה לספר
            @if (r.collections.length) {
              <ion-note slot="end">&nbsp;· {{ r.collections.length === 1 ? 'בספר אחד' : 'ב־' + r.collections.length + ' ספרים' }}</ion-note>
            }
          </ion-button>
          <ion-button data-tour="shopping" expand="block" fill="outline" [disabled]="shopping()" (click)="addToShoppingList()">
            @if (shopping()) {
              <ion-spinner slot="start" name="crescent"></ion-spinner>
            } @else {
              <ion-icon slot="start" name="cart-outline" aria-hidden="true"></ion-icon>
            }
            הוספה לרשימת הקניות
          </ion-button>

          @if (r.steps.length) {
            <h3>אופן ההכנה</h3>
            <ol>
              @for (s of r.steps; track $index) {
                <li>{{ s }}</li>
              }
            </ol>
          }

          @if (r.tags.length || r.categories.length) {
            <h3>תגיות</h3>
            @for (t of r.categories.concat(r.tags); track t) {
              <ion-chip>{{ t }}</ion-chip>
            }
          }
          @if (r.sourceUrl && !isTikTok(r.sourceUrl)) {
            <ion-button fill="clear" size="small" [href]="r.sourceUrl" target="_blank" rel="noopener">
              <ion-icon slot="start" name="link-outline" aria-hidden="true"></ion-icon>
              למקור
            </ion-button>
          }
        </div>
      } @else {
        <div class="state"><ion-spinner name="crescent"></ion-spinner></div>
      }
    </ion-content>
  `,
})
export class RecipePage implements OnInit {
  protected readonly api = inject(ApiService);
  private readonly alert = inject(AlertService);
  private readonly alerts = inject(AlertController);
  /** Route param, bound by withComponentInputBinding. */
  readonly id = input.required<string>();

  protected readonly recipe = signal<RecipeDetail | null>(null);
  protected readonly error = signal('');
  protected readonly factor = signal(1);
  protected readonly shopping = signal(false);
  protected readonly prettyNumber = pretty;

  /** The price lines are the ingredient lines the server shows, so scale those. */
  protected readonly shownLines = computed(() =>
    (this.recipe()?.prices ?? []).map((p) => scaleIngredient(p.line, this.factor())),
  );

  constructor() {
    addIcons({ bookmarkOutline, cartOutline, linkOutline, logoTiktok, star, starHalf, starOutline });
  }

  ngOnInit(): void {
    void this.load();
  }

  protected async refresh(event: RefresherCustomEvent): Promise<void> {
    await this.load();
    await event.target.complete();
  }

  protected setFactor(event: SegmentCustomEvent): void {
    this.factor.set(Number(event.detail.value));
  }

  /** Same rule as the server's video.py: any tiktok.com host, short share links included. */
  protected isTikTok(url: string): boolean {
    try {
      return /(^|\.)tiktok\.com$/i.test(new URL(url).hostname);
    } catch {
      return false;
    }
  }

  protected starIcon(i: number): string {
    const rating = this.recipe()?.rating ?? 0;
    return rating >= i ? 'star' : rating >= i - 0.5 ? 'star-half' : 'star-outline';
  }

  /** Tapping a star sets it; tapping the same star again makes it a half; a half on the first star clears. */
  protected async rate(i: number): Promise<void> {
    const r = this.recipe();
    if (!r) return;
    const current = r.rating ?? 0;
    const next = current === i ? i - 0.5 : current === i - 0.5 && i === 1 ? null : i;
    this.recipe.set({ ...r, rating: next || null });
    try {
      await this.api.setRating(r.id, next || null);
    } catch (e) {
      this.recipe.set(r);
      await this.alert.presentToast(e instanceof ApiError ? e.message : 'הדירוג לא נשמר.');
    }
  }

  /** Tick the book's own cookbooks this recipe belongs in, or start a new one. */
  protected async fileInBooks(): Promise<void> {
    const r = this.recipe();
    if (!r) return;
    let collections: Collection[];
    try {
      collections = await this.api.collections();
    } catch (e) {
      await this.alert.presentToast(e instanceof ApiError ? e.message : 'הספרים לא נטענו.');
      return;
    }
    const picker = await this.alerts.create({
      header: 'הוספה לספר',
      message: collections.length ? undefined : 'עוד אין ספרים משלכם. התחילו ספר חדש:',
      inputs: collections.map((c) => ({
        type: 'checkbox' as const,
        label: c.title,
        value: c.id,
        checked: r.collections.includes(c.id),
      })),
      buttons: [
        { text: 'ספר חדש', role: 'new' },
        { text: 'ביטול', role: 'cancel' },
        ...(collections.length ? [{ text: 'שמירה', role: 'confirm' }] : []),
      ],
    });
    await picker.present();
    const { role, data } = await picker.onDidDismiss<{ values?: number[] }>();
    if (role !== 'confirm' && role !== 'new') return;
    // Ticks count for "new cookbook" too, so nothing chosen is lost on the way.
    const chosen = new Set(data?.values ?? []);
    try {
      await Promise.all(
        collections
          .filter((c) => chosen.has(c.id) !== r.collections.includes(c.id))
          .map((c) => this.api.fileRecipe(c.id, r.id, chosen.has(c.id))),
      );
      if (role === 'new') {
        const title = await askTitle(this.alerts, 'ספר מתכונים חדש');
        if (title) {
          const created = await this.api.createCollection(title);
          await this.api.fileRecipe(created.id, r.id, true);
          chosen.add(created.id);
          await this.alert.presentToast(`נוסף ל„${created.title}”`);
        }
      }
    } catch (e) {
      await this.alert.presentToast(e instanceof ApiError ? e.message : 'השינוי לא נשמר.');
      await this.load();
      return;
    }
    this.recipe.set({ ...r, collections: [...chosen] });
  }

  protected async addToShoppingList(): Promise<void> {
    const r = this.recipe();
    if (!r) return;
    this.shopping.set(true);
    try {
      const { url } = await this.api.shoppingList(r.id, this.shownLines());
      // The to-do app takes this link over when it is installed; otherwise it opens in the browser.
      window.open(url, '_system');
    } catch (e) {
      await this.alert.presentToast(e instanceof ApiError ? e.message : 'רשימת הקניות לא נוצרה.');
    } finally {
      this.shopping.set(false);
    }
  }

  private async load(): Promise<void> {
    this.error.set('');
    try {
      this.recipe.set(await this.api.recipe(this.id()));
    } catch (e) {
      this.error.set(e instanceof ApiError ? e.message : 'משהו השתבש.');
    }
  }
}
