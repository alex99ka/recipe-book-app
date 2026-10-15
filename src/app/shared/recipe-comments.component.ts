import { ChangeDetectionStrategy, Component, OnInit, inject, input, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { AlertController, IonButton, IonIcon, IonItem, IonLabel, IonList, IonListHeader, IonNote, IonTextarea } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { send, trashOutline } from 'ionicons/icons';
import { ApiError, ApiService } from '../core';
import { RecipeComment, RecipeComments } from '../models';
import { AlertService } from './alert.service';

/**
 * Comments at the bottom of a recipe: the household's, and on an original, one
 * conversation per friend it was sent to.
 */
@Component({
  selector: 'app-recipe-comments',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, IonButton, IonIcon, IonItem, IonLabel, IonList, IonListHeader, IonNote, IonTextarea],
  styles: `
    .hint { display: block; padding: 0 16px 4px; }
    .body { white-space: pre-wrap; }
    .composer { display: flex; align-items: flex-end; gap: 4px; padding: 0 8px 8px 16px; }
    .composer ion-textarea { flex: 1; }
  `,
  template: `
    @if (data(); as d) {
      <ion-list-header>תגובות</ion-list-header>
      @if (d.sentBy) {
        <ion-note class="hint">המתכון הגיע מ{{ d.sentBy }}, שרואה גם את התגובות כאן.</ion-note>
      }
      <ion-list lines="none">
        @for (c of d.comments; track c.id) {
          <ion-item>
            <ion-label class="ion-text-wrap">
              <p>{{ c.author }} · {{ c.createdAt | date: 'd/M HH:mm' }}</p>
              <div class="body">{{ c.body }}</div>
            </ion-label>
            @if (c.mine) {
              <ion-button slot="end" fill="clear" color="medium" aria-label="מחיקת התגובה" (click)="remove(c)">
                <ion-icon slot="icon-only" name="trash-outline"></ion-icon>
              </ion-button>
            }
          </ion-item>
        } @empty {
          <ion-note class="hint">אין עדיין תגובות. בישלתם? ספרו איך יצא.</ion-note>
        }
      </ion-list>
      <div class="composer">
        <ion-textarea [autoGrow]="true" rows="1" placeholder="תגובה" aria-label="תגובה" [maxlength]="1000"
          [value]="drafts()['']" (ionInput)="draft('', $any($event.detail.value))"></ion-textarea>
        <ion-button fill="clear" aria-label="שליחת תגובה" [disabled]="!drafts()['']?.trim()" (click)="post()">
          <ion-icon slot="icon-only" name="send"></ion-icon>
        </ion-button>
      </div>

      @for (t of d.threads; track t.copyId) {
        <ion-list-header>שיחה עם {{ t.friend || 'חבר' }}</ion-list-header>
        <ion-list lines="none">
          @for (c of t.comments; track c.id) {
            <ion-item>
              <ion-label class="ion-text-wrap">
                <p>{{ c.author }} · {{ c.createdAt | date: 'd/M HH:mm' }}</p>
                <div class="body">{{ c.body }}</div>
              </ion-label>
              @if (c.mine) {
                <ion-button slot="end" fill="clear" color="medium" aria-label="מחיקת התגובה" (click)="remove(c)">
                  <ion-icon slot="icon-only" name="trash-outline"></ion-icon>
                </ion-button>
              }
            </ion-item>
          } @empty {
            <ion-note class="hint">עוד לא כתבתם זה לזה על המתכון.</ion-note>
          }
        </ion-list>
        <div class="composer">
          <ion-textarea [autoGrow]="true" rows="1" [placeholder]="'תשובה ל' + (t.friend || 'חבר')" aria-label="תשובה"
            [maxlength]="1000" [value]="drafts()[t.copyId]" (ionInput)="draft(t.copyId, $any($event.detail.value))"></ion-textarea>
          <ion-button fill="clear" aria-label="שליחת תשובה" [disabled]="!drafts()[t.copyId]?.trim()" (click)="post(t.copyId)">
            <ion-icon slot="icon-only" name="send"></ion-icon>
          </ion-button>
        </div>
      }
    }
  `,
})
export class RecipeCommentsComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly alerts = inject(AlertController);
  private readonly alert = inject(AlertService);
  readonly recipeId = input.required<string>();

  protected readonly data = signal<RecipeComments | null>(null);
  /** Unsent text per conversation: '' is the recipe's own comments, otherwise a copy id. */
  protected readonly drafts = signal<Record<string, string>>({});

  constructor() {
    addIcons({ send, trashOutline });
  }

  ngOnInit(): void {
    void this.load();
  }

  protected draft(key: string, value: string | null): void {
    this.drafts.update((d) => ({ ...d, [key]: value ?? '' }));
  }

  protected async post(thread?: string): Promise<void> {
    const key = thread ?? '';
    const body = (this.drafts()[key] ?? '').trim();
    if (!body) return;
    try {
      await this.api.addComment(this.recipeId(), body, thread);
      this.draft(key, '');
      await this.load();
    } catch (e) {
      await this.alert.presentToast(e instanceof ApiError ? e.message : 'התגובה לא נשלחה.');
    }
  }

  protected async remove(c: RecipeComment): Promise<void> {
    const confirm = await this.alerts.create({
      header: 'למחוק את התגובה?',
      buttons: [{ text: 'ביטול', role: 'cancel' }, { text: 'מחיקה', role: 'destructive' }],
    });
    await confirm.present();
    if ((await confirm.onDidDismiss()).role !== 'destructive') return;
    try {
      await this.api.deleteComment(c.id);
      await this.load();
    } catch (e) {
      await this.alert.presentToast(e instanceof ApiError ? e.message : 'התגובה לא נמחקה.');
    }
  }

  private async load(): Promise<void> {
    try {
      this.data.set(await this.api.comments(this.recipeId()));
    } catch {
      // Comments are extra: the recipe still reads fine without them.
    }
  }
}
