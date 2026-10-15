import { ChangeDetectionStrategy, Component, OnInit, inject, input, signal } from '@angular/core';
import {
  AlertController,
  NavController,
  IonBackButton,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonInput,
  IonItem,
  IonLabel,
  IonList,
  IonListHeader,
  IonNote,
  IonSpinner,
  IonTitle,
  IonToolbar,
} from '@ionic/angular';
import { ApiError, ApiService } from '../../core';
import { RecipeDetail, RecipePatch } from '../../models';
import { AlertService } from '../../shared';

/** Name, photo, tags, categories, source link and ingredient prices; and deleting the recipe. */
@Component({
  selector: 'app-edit',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    IonBackButton, IonButton, IonButtons, IonContent, IonHeader, IonInput, IonItem, IonLabel, IonList, IonListHeader,
    IonNote, IonSpinner, IonTitle, IonToolbar,
  ],
  styles: `
    .state { text-align: center; padding: 48px 24px; }
    .photo { display: block; width: 100%; max-height: 220px; object-fit: cover; }
    input[type='file'] { width: 100%; padding: 8px 0; }
    .price { max-width: 96px; }
    .bottom { padding: 16px; }
  `,
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start"><ion-back-button [defaultHref]="'/recipe/' + id()" text=""></ion-back-button></ion-buttons>
        <ion-title>עריכת מתכון</ion-title>
        <ion-buttons slot="end">
          <ion-button [disabled]="busy() || !recipe()" (click)="save()">
            @if (busy()) { <ion-spinner name="crescent"></ion-spinner> } @else { שמירה }
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      @if (error(); as message) {
        <div class="state"><ion-note>{{ message }}</ion-note></div>
      } @else if (recipe(); as r) {
        @if (api.imageUrl(r.image); as src) {
          <img class="photo" [src]="src" alt="" />
        }
        <ion-list>
          <ion-item lines="none">
            <ion-label class="ion-text-wrap">
              <h3>{{ r.image ? 'החלפת התמונה' : 'הוספת תמונה' }}</h3>
              <input type="file" accept="image/*" [disabled]="uploading()" (change)="photo($event)" />
            </ion-label>
            @if (uploading()) { <ion-spinner slot="end" name="crescent"></ion-spinner> }
          </ion-item>
          <ion-item>
            <ion-input label="שם (בשפת המקור)" labelPlacement="stacked" [value]="name()"
              (ionInput)="name.set($any($event.detail.value) ?? '')"></ion-input>
          </ion-item>
          <ion-item>
            <ion-input label="תגיות, מופרדות בפסיק" labelPlacement="stacked" [value]="tags()"
              (ionInput)="tags.set($any($event.detail.value) ?? '')"></ion-input>
          </ion-item>
          <ion-item>
            <ion-input label="קטגוריות, מופרדות בפסיק" labelPlacement="stacked" [value]="categories()"
              (ionInput)="categories.set($any($event.detail.value) ?? '')"></ion-input>
          </ion-item>
          <ion-item>
            <ion-input label="קישור למקור" labelPlacement="stacked" type="url" dir="ltr" [value]="source()"
              (ionInput)="source.set($any($event.detail.value) ?? '')"></ion-input>
          </ion-item>
        </ion-list>

        @if (prices().length) {
          <ion-list-header>מחירים</ion-list-header>
          <ion-note class="ion-padding-horizontal">מחיר הכמות שבמתכון, בשקלים. ריק אם אין מחיר.</ion-note>
          <ion-list>
            @for (p of prices(); track $index) {
              <ion-item>
                <ion-label class="ion-text-wrap">
                  {{ p.line }}
                  @if (p.was) { <p>תומחר כשהשורה הייתה: {{ p.was }}</p> }
                </ion-label>
                <ion-input slot="end" class="price" inputmode="decimal" dir="ltr" placeholder="₪"
                  [attr.aria-label]="'מחיר: ' + p.line" [value]="p.price"
                  (ionInput)="setPrice($index, $any($event.detail.value) ?? '')"></ion-input>
              </ion-item>
            }
          </ion-list>
        }

        <div class="bottom">
          <ion-button expand="block" fill="outline" color="danger" [disabled]="busy()" (click)="remove()">
            מחיקת המתכון
          </ion-button>
        </div>
      } @else {
        <div class="state"><ion-spinner name="crescent"></ion-spinner></div>
      }
    </ion-content>
  `,
})
export class EditPage implements OnInit {
  protected readonly api = inject(ApiService);
  private readonly alerts = inject(AlertController);
  private readonly alert = inject(AlertService);
  private readonly nav = inject(NavController);
  readonly id = input.required<string>();

  protected readonly recipe = signal<RecipeDetail | null>(null);
  protected readonly name = signal('');
  protected readonly tags = signal('');
  protected readonly categories = signal('');
  protected readonly source = signal('');
  protected readonly prices = signal<{ line: string; price: string; was: string | null }[]>([]);
  protected readonly busy = signal(false);
  protected readonly uploading = signal(false);
  protected readonly error = signal('');
  private pricesChanged = false;

  async ngOnInit(): Promise<void> {
    try {
      const r = await this.api.recipe(this.id());
      this.recipe.set(r);
      this.name.set(r.name);
      this.tags.set(r.tags.join(', '));
      this.categories.set(r.categories.join(', '));
      this.source.set(r.sourceUrl);
      this.prices.set(r.prices.map((p) => ({ line: p.line, price: p.price === null ? '' : String(p.price), was: p.was })));
    } catch (e) {
      this.error.set(e instanceof ApiError ? e.message : 'המתכון לא נטען.');
    }
  }

  protected setPrice(i: number, value: string): void {
    this.pricesChanged = true;
    this.prices.update((list) => list.map((p, j) => (j === i ? { ...p, price: value } : p)));
  }

  /** The photo is saved at once: it doesn't wait for "save". */
  protected async photo(event: Event): Promise<void> {
    const file = (event.target as HTMLInputElement).files?.[0];
    const r = this.recipe();
    if (!file || !r) return;
    this.uploading.set(true);
    try {
      const { image } = await this.api.setPhoto(r.id, file);
      this.recipe.set({ ...r, image });
    } catch (e) {
      await this.alert.presentToast(e instanceof ApiError ? e.message : 'התמונה לא הועלתה.');
    } finally {
      this.uploading.set(false);
    }
  }

  protected async save(): Promise<void> {
    const r = this.recipe();
    if (!r) return;
    const list = (s: string) => s.split(',').map((x) => x.trim()).filter(Boolean);
    const patch: RecipePatch = {};
    if (this.name().trim() && this.name().trim() !== r.name) patch.name = this.name().trim();
    if (list(this.tags()).join() !== r.tags.join()) patch.tags = list(this.tags());
    if (list(this.categories()).join() !== r.categories.join()) patch.categories = list(this.categories());
    if (this.source().trim() !== r.sourceUrl) patch.sourceUrl = this.source().trim();
    this.busy.set(true);
    try {
      if (Object.keys(patch).length) {
        await this.api.updateRecipe(r.id, patch);
      }
      if (this.pricesChanged) {
        await this.api.setPrices(r.id, this.prices().map(({ line, price }) => ({ line, price })));
      }
      await this.nav.navigateBack(['/recipe', r.id]);
    } catch (e) {
      await this.alert.presentToast(e instanceof ApiError ? e.message : 'השינויים לא נשמרו.');
    } finally {
      this.busy.set(false);
    }
  }

  protected async remove(): Promise<void> {
    const r = this.recipe();
    if (!r) return;
    const confirm = await this.alerts.create({
      header: `למחוק את „${r.title}”?`,
      message: 'המתכון יימחק מהספר לכולם בבית. אי אפשר לבטל.',
      buttons: [{ text: 'ביטול', role: 'cancel' }, { text: 'מחיקה', role: 'destructive' }],
    });
    await confirm.present();
    if ((await confirm.onDidDismiss()).role !== 'destructive') return;
    this.busy.set(true);
    try {
      await this.api.deleteRecipe(r.id);
      await this.nav.navigateRoot('/home');
    } catch (e) {
      await this.alert.presentToast(e instanceof ApiError ? e.message : 'המתכון לא נמחק.');
    } finally {
      this.busy.set(false);
    }
  }
}
