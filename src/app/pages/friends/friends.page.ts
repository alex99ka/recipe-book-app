import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import {
  AlertController,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonMenuButton,
  IonNote,
  IonSpinner,
  IonTitle,
  IonToolbar,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import { personAddOutline, personRemoveOutline } from 'ionicons/icons';
import { ApiError, ApiService } from '../../core';
import { Friend } from '../../models';
import { AlertService } from '../../shared';

/** Friends get copies of what you send them. They are not part of the household and never see your book. */
@Component({
  selector: 'app-friends',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    IonButton, IonButtons, IonContent, IonHeader, IonIcon, IonItem, IonLabel, IonList, IonMenuButton, IonNote,
    IonSpinner, IonTitle, IonToolbar,
  ],
  styles: `
    .intro { padding: 16px 16px 0; }
    .state { text-align: center; padding: 32px 24px; }
  `,
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start"><ion-menu-button></ion-menu-button></ion-buttons>
        <ion-title>חברים</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      <p class="intro">
        <ion-note>
          לחברים שולחים מתכון או ספר שלם, והם מקבלים עותק משלהם. הם לא רואים את הספר שלכם ולא מצטרפים לבית.
        </ion-note>
      </p>
      <div class="ion-padding">
        <ion-button expand="block" (click)="invite()" [disabled]="inviting()">
          <ion-icon slot="start" name="person-add-outline" aria-hidden="true"></ion-icon>
          הזמנת חבר
        </ion-button>
      </div>
      @if (error(); as message) {
        <div class="state"><ion-note>{{ message }}</ion-note></div>
      } @else if (friends(); as list) {
        @if (list.length) {
          <ion-list>
            @for (f of list; track f.uid) {
              <ion-item>
                <ion-label>{{ f.name }}</ion-label>
                <ion-button slot="end" fill="clear" color="medium" [attr.aria-label]="'הסרת ' + f.name" (click)="remove(f)">
                  <ion-icon slot="icon-only" name="person-remove-outline"></ion-icon>
                </ion-button>
              </ion-item>
            }
          </ion-list>
        } @else {
          <div class="state"><ion-note>עוד אין לכם חברים. הזמינו מישהו בקישור.</ion-note></div>
        }
      } @else {
        <div class="state"><ion-spinner name="crescent"></ion-spinner></div>
      }
    </ion-content>
  `,
})
export class FriendsPage {
  private readonly api = inject(ApiService);
  private readonly alerts = inject(AlertController);
  private readonly alert = inject(AlertService);

  protected readonly friends = signal<Friend[] | null>(null);
  protected readonly error = signal('');
  protected readonly inviting = signal(false);

  constructor() {
    addIcons({ personAddOutline, personRemoveOutline });
  }

  ionViewWillEnter(): void {
    void this.load();
  }

  protected async invite(): Promise<void> {
    this.inviting.set(true);
    let url: string;
    try {
      url = (await this.api.createInvite()).url;
    } catch (e) {
      await this.alert.presentToast(e instanceof ApiError ? e.message : 'הקישור לא נוצר.');
      return;
    } finally {
      this.inviting.set(false);
    }
    const text = `הזמנה לספר המתכונים שלי, כדי שנוכל לשלוח מתכונים זה לזה: ${url}`;
    const sheet = await this.alerts.create({
      header: 'קישור הזמנה',
      message: 'שלחו אותו לחבר. הוא תקף לשבוע ולחבר אחד.',
      buttons: [
        { text: 'וואטסאפ', handler: () => void window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_system') },
        { text: 'העתקת הקישור', handler: () => void this.copy(url) },
        { text: 'סגירה', role: 'cancel' },
      ],
    });
    await sheet.present();
  }

  protected async remove(friend: Friend): Promise<void> {
    const confirm = await this.alerts.create({
      header: `להסיר את ${friend.name}?`,
      message: 'מה שכבר שלחתם זה לזה נשאר אצל כל אחד.',
      buttons: [{ text: 'ביטול', role: 'cancel' }, { text: 'הסרה', role: 'destructive' }],
    });
    await confirm.present();
    if ((await confirm.onDidDismiss()).role !== 'destructive') return;
    try {
      await this.api.removeFriend(friend.uid);
      this.friends.update((list) => list?.filter((f) => f.uid !== friend.uid) ?? null);
    } catch (e) {
      await this.alert.presentToast(e instanceof ApiError ? e.message : 'החבר לא הוסר.');
    }
  }

  private async copy(url: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(url);
      await this.alert.presentToast('הקישור הועתק');
    } catch {
      await this.alert.presentToast(url);
    }
  }

  private async load(): Promise<void> {
    try {
      this.friends.set(await this.api.friends());
      this.error.set('');
    } catch (e) {
      this.error.set(e instanceof ApiError ? e.message : 'משהו השתבש.');
    }
  }
}
