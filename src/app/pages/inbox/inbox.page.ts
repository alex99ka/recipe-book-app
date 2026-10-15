import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import {
  AlertController,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonItem,
  IonLabel,
  IonList,
  IonMenuButton,
  IonNote,
  IonSpinner,
  IonTitle,
  IonToolbar,
} from '@ionic/angular';
import { ApiError, ApiService } from '../../core';
import { InboxItem } from '../../models';
import { AlertService } from '../../shared';

/** What friends sent. The copies are already in the book; this is where you keep or discard them. */
@Component({
  selector: 'app-inbox',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    IonButton, IonButtons, IonContent, IonHeader, IonItem, IonLabel, IonList, IonMenuButton, IonNote, IonSpinner,
    IonTitle, IonToolbar,
  ],
  styles: `
    .state { text-align: center; padding: 48px 24px; }
    .actions { display: flex; gap: 8px; padding: 0 16px 12px; }
  `,
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start"><ion-menu-button></ion-menu-button></ion-buttons>
        <ion-title>התקבל מחברים</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      @if (error(); as message) {
        <div class="state"><ion-note>{{ message }}</ion-note></div>
      } @else if (items(); as list) {
        @if (list.length) {
          <ion-list>
            @for (i of list; track i.id) {
              <ion-item button lines="none" (click)="open(i)">
                <ion-label>
                  <h2>{{ i.title }}</h2>
                  <p>{{ i.collectionId ? 'ספר עם ' + i.count + ' מתכונים' : 'מתכון' }} · מאת {{ i.from }}</p>
                </ion-label>
              </ion-item>
              <div class="actions">
                <ion-button size="small" (click)="settle(i, 'keep')">שמירה בספר</ion-button>
                <ion-button size="small" fill="outline" color="medium" (click)="settle(i, 'discard')">לא צריך</ion-button>
              </div>
            }
          </ion-list>
        } @else {
          <div class="state"><ion-note>אין כאן כלום כרגע. מה שחברים ישלחו יופיע כאן.</ion-note></div>
        }
      } @else {
        <div class="state"><ion-spinner name="crescent"></ion-spinner></div>
      }
    </ion-content>
  `,
})
export class InboxPage {
  private readonly api = inject(ApiService);
  private readonly alerts = inject(AlertController);
  private readonly alert = inject(AlertService);
  private readonly router = inject(Router);

  protected readonly items = signal<InboxItem[] | null>(null);
  protected readonly error = signal('');

  ionViewWillEnter(): void {
    void this.load();
  }

  protected open(i: InboxItem): void {
    if (i.collectionId) {
      void this.router.navigate(['/collection', i.collectionId], { state: { title: i.title } });
    } else if (i.recipeId) {
      void this.router.navigate(['/recipe', i.recipeId]);
    }
  }

  protected async settle(i: InboxItem, how: 'keep' | 'discard'): Promise<void> {
    if (how === 'discard') {
      const confirm = await this.alerts.create({
        header: `למחוק את „${i.title}”?`,
        message: i.collectionId ? 'הספר וכל המתכונים שהגיעו איתו יימחקו מהספר שלכם.' : 'המתכון יימחק מהספר שלכם.',
        buttons: [{ text: 'ביטול', role: 'cancel' }, { text: 'מחיקה', role: 'destructive' }],
      });
      await confirm.present();
      if ((await confirm.onDidDismiss()).role !== 'destructive') return;
    }
    try {
      await this.api.settle(i.id, how);
      this.items.update((list) => list?.filter((x) => x.id !== i.id) ?? null);
      this.api.inboxCount.update((n) => Math.max(0, n - 1));
    } catch (e) {
      await this.alert.presentToast(e instanceof ApiError ? e.message : 'לא נשמר.');
    }
  }

  private async load(): Promise<void> {
    try {
      const items = await this.api.inbox();
      this.items.set(items);
      this.api.inboxCount.set(items.length);
      this.error.set('');
    } catch (e) {
      this.error.set(e instanceof ApiError ? e.message : 'משהו השתבש.');
    }
  }
}
