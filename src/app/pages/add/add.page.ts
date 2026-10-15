import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import {
  IonBackButton,
  IonButton,
  IonButtons,
  IonCheckbox,
  IonContent,
  IonHeader,
  IonInput,
  IonItem,
  IonLabel,
  IonList,
  IonListHeader,
  IonNote,
  IonSegment,
  IonSegmentButton,
  IonSpinner,
  IonTextarea,
  IonTitle,
  IonToolbar,
} from '@ionic/angular';
import { ApiError, ApiService } from '../../core';
import { Collection } from '../../models';

type Mode = 'link' | 'text' | 'file';

/** A new recipe from a link (site or cooking video), pasted text, or a photo/PDF of one. */
@Component({
  selector: 'app-add',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    IonBackButton, IonButton, IonButtons, IonCheckbox, IonContent, IonHeader, IonInput, IonItem, IonLabel, IonList,
    IonListHeader, IonNote, IonSegment, IonSegmentButton, IonSpinner, IonTextarea, IonTitle, IonToolbar,
  ],
  styles: `
    .hint { display: block; padding: 8px 16px 0; }
    input[type='file'] { width: 100%; padding: 12px 0; }
    .go { padding: 16px; }
  `,
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start"><ion-back-button defaultHref="/home" text=""></ion-back-button></ion-buttons>
        <ion-title>מתכון חדש</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      <ion-segment [value]="mode()" (ionChange)="mode.set($any($event.detail.value))" [disabled]="busy()">
        <ion-segment-button value="link"><ion-label>קישור</ion-label></ion-segment-button>
        <ion-segment-button value="text"><ion-label>טקסט</ion-label></ion-segment-button>
        <ion-segment-button value="file"><ion-label>צילום או PDF</ion-label></ion-segment-button>
      </ion-segment>

      <ion-list>
        @switch (mode()) {
          @case ('link') {
            <ion-item>
              <ion-input label="קישור" labelPlacement="stacked" type="url" inputmode="url" dir="ltr"
                placeholder="https://…" [value]="url()" (ionInput)="url.set($any($event.detail.value) ?? '')"></ion-input>
            </ion-item>
            <ion-note class="hint">אתר מתכונים, או סרטון מטיקטוק, אינסטגרם או יוטיוב.</ion-note>
          }
          @case ('text') {
            <ion-item>
              <ion-textarea label="המתכון" labelPlacement="stacked" [autoGrow]="true" rows="8"
                placeholder="מדביקים כאן מצרכים ואופן הכנה, בכל שפה" [value]="text()"
                (ionInput)="text.set($any($event.detail.value) ?? '')"></ion-textarea>
            </ion-item>
          }
          @case ('file') {
            <ion-item lines="none">
              <ion-label class="ion-text-wrap">
                <h3>צילום של המתכון או קובץ PDF</h3>
                <input type="file" accept="image/*,application/pdf" (change)="source.set(file($event))" />
              </ion-label>
            </ion-item>
            <ion-item lines="none">
              <ion-label class="ion-text-wrap">
                <h3>תמונה של המנה (לא חובה)</h3>
                <input type="file" accept="image/*" (change)="dish.set(file($event))" />
              </ion-label>
            </ion-item>
          }
        }
      </ion-list>

      @if (collections().length) {
        <ion-list-header>להוסיף גם לספרים</ion-list-header>
        <ion-list>
          @for (c of collections(); track c.id) {
            <ion-item>
              <ion-checkbox [checked]="chosen().has(c.id)" (ionChange)="toggle(c.id)">{{ c.title }}</ion-checkbox>
            </ion-item>
          }
        </ion-list>
      }

      <div class="go">
        <ion-button expand="block" [disabled]="busy() || !ready()" (click)="add()">
          @if (busy()) {
            <ion-spinner slot="start" name="crescent"></ion-spinner>
            קורא את המתכון…
          } @else {
            הוספה
          }
        </ion-button>
        @if (busy()) {
          <ion-note class="hint">סרטון יכול לקחת עד שתי דקות. התרגום לעברית ממשיך אחר כך ברקע.</ion-note>
        }
        @if (error(); as message) {
          <ion-note class="hint" color="danger">{{ message }}</ion-note>
        }
      </div>
    </ion-content>
  `,
})
export class AddPage {
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);

  protected readonly mode = signal<Mode>('link');
  protected readonly url = signal('');
  protected readonly text = signal('');
  protected readonly source = signal<File | null>(null);
  protected readonly dish = signal<File | null>(null);
  protected readonly collections = signal<Collection[]>([]);
  protected readonly chosen = signal(new Set<number>());
  protected readonly busy = signal(false);
  protected readonly error = signal('');

  constructor() {
    void this.api.collections().then((c) => this.collections.set(c), () => undefined);
  }

  protected ready(): boolean {
    switch (this.mode()) {
      case 'link':
        return /^https?:\/\/\S+$/.test(this.url().trim());
      case 'text':
        return this.text().trim().length > 20;
      default:
        return this.source() !== null;
    }
  }

  protected file(event: Event): File | null {
    return (event.target as HTMLInputElement).files?.[0] ?? null;
  }

  protected toggle(id: number): void {
    const next = new Set(this.chosen());
    if (!next.delete(id)) next.add(id);
    this.chosen.set(next);
  }

  protected async add(): Promise<void> {
    this.busy.set(true);
    this.error.set('');
    const collections = [...this.chosen()];
    try {
      const source = this.source();
      const { id } =
        this.mode() === 'file' && source
          ? await this.api.uploadRecipe(source, this.dish(), collections)
          : await this.api.createRecipe(
              this.mode() === 'link' ? { url: this.url().trim(), collections } : { text: this.text().trim(), collections },
            );
      await this.router.navigate(['/recipe', id], { replaceUrl: true });
    } catch (e) {
      this.error.set(e instanceof ApiError ? e.message : 'המתכון לא נוסף.');
    } finally {
      this.busy.set(false);
    }
  }
}
