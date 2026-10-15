import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Capacitor } from '@capacitor/core';
import {
  IonAvatar,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonListHeader,
  IonMenuButton,
  IonNote,
  IonRadio,
  IonRadioGroup,
  IonSpinner,
  IonTitle,
  IonToolbar,
  type RadioGroupCustomEvent,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import { download, logoGithub, mapOutline, refresh, sparkles } from 'ionicons/icons';
import { ApiService, AuthService, TourService, UpdateService } from '../../core';
import { environment } from '../../../environments/environment';
import { Me } from '../../models';
import { AlertService } from '../../shared';

@Component({
  selector: 'app-settings',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    .version { font-variant-numeric: tabular-nums; }
  `,
  imports: [
    IonAvatar,
    IonButtons,
    IonContent,
    IonHeader,
    IonIcon,
    IonItem,
    IonLabel,
    IonList,
    IonListHeader,
    IonMenuButton,
    IonNote,
    IonRadio,
    IonRadioGroup,
    IonSpinner,
    IonTitle,
    IonToolbar,
  ],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start"><ion-menu-button></ion-menu-button></ion-buttons>
        <ion-title>הגדרות</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      @if (user(); as u) {
        <ion-list inset>
          <ion-item lines="none">
            <ion-avatar slot="start">
              <img [src]="u.photoURL" alt="" referrerpolicy="no-referrer" />
            </ion-avatar>
            <ion-label>
              <h2>{{ u.displayName }}</h2>
              <p>{{ u.email }}</p>
            </ion-label>
          </ion-item>
        </ion-list>
      }

      @if (me(); as m) {
        <ion-list-header>ספר המתכונים</ion-list-header>
        <ion-list inset>
          @if (m.books.length > 1) {
            <ion-radio-group [value]="m.book" (ionChange)="pickBook($event)">
              @for (b of m.books; track b.key) {
                <ion-item>
                  <ion-radio [value]="b.key">{{ b.title }}</ion-radio>
                </ion-item>
              }
            </ion-radio-group>
          } @else {
            <ion-item>
              <ion-label>{{ m.books[0].title }}</ion-label>
            </ion-item>
          }
          @if (m.createsPerMonth !== null) {
            <ion-item lines="none">
              <ion-note>{{ m.createsThisMonth }} מתוך {{ m.createsPerMonth }} מתכונים חדשים החודש</ion-note>
            </ion-item>
          }
        </ion-list>
      }

      <ion-list-header>אפליקציה</ion-list-header>
      <ion-list inset>
        <ion-item>
          <ion-label>
            גרסה
            <p class="version">{{ updates.version }}{{ native ? ' · אנדרואיד' : ' · אתר' }}</p>
          </ion-label>
          <ion-note slot="end">{{ statusText() }}</ion-note>
        </ion-item>
        @switch (updates.status()) {
          @case ('ready') {
            <ion-item button (click)="updates.apply()">
              <ion-icon slot="start" name="sparkles" color="primary" aria-hidden="true"></ion-icon>
              <ion-label>הפעלה מחדש לעדכון</ion-label>
            </ion-item>
          }
          @case ('needs-apk') {
            <ion-item button [href]="updates.apkUrl()" target="_blank" rel="noopener">
              <ion-icon slot="start" name="download" color="primary" aria-hidden="true"></ion-icon>
              <ion-label>הורדת גרסה {{ updates.latest() }}</ion-label>
            </ion-item>
          }
          @default {
            <ion-item button [disabled]="busy()" (click)="updates.check(true)">
              @if (busy()) {
                <ion-spinner slot="start" name="crescent"></ion-spinner>
              } @else {
                <ion-icon slot="start" name="refresh" color="primary" aria-hidden="true"></ion-icon>
              }
              <ion-label>בדיקת עדכונים</ion-label>
            </ion-item>
          }
        }
        @if (!native) {
          <ion-item button [href]="releasesUrl" target="_blank" rel="noopener">
            <ion-icon slot="start" name="download" color="medium" aria-hidden="true"></ion-icon>
            <ion-label>להורדת אפליקציית האנדרואיד</ion-label>
          </ion-item>
        }
        <ion-item button data-tour="tour" (click)="tour.start()">
          <ion-icon slot="start" name="map-outline" color="primary" aria-hidden="true"></ion-icon>
          <ion-label>סיור מודרך באפליקציה</ion-label>
        </ion-item>
        <ion-item button [href]="changelogUrl" target="_blank" rel="noopener">
          <ion-icon slot="start" name="logo-github" color="medium" aria-hidden="true"></ion-icon>
          <ion-label>מה חדש</ion-label>
        </ion-item>
      </ion-list>
      <p class="ion-padding-horizontal">
        <ion-note>עדכונים יורדים ברקע ומותקנים כשמפעילים מחדש, או בפעם הבאה שיוצאים מהאפליקציה וחוזרים אליה.</ion-note>
      </p>
    </ion-content>
  `,
})
export class SettingsPage {
  private readonly alert = inject(AlertService);
  private readonly api = inject(ApiService);
  protected readonly updates = inject(UpdateService);
  protected readonly tour = inject(TourService);
  protected readonly me = signal<Me | null>(null);
  protected readonly user = toSignal(inject(AuthService).user$, { initialValue: null });
  protected readonly native = Capacitor.isNativePlatform();
  protected readonly releasesUrl = `https://github.com/${environment.githubRepo}/releases/latest`;
  protected readonly changelogUrl = `https://github.com/${environment.githubRepo}/blob/master/CHANGELOG.md`;

  protected readonly busy = computed(() =>
    ['checking', 'downloading'].includes(this.updates.status()),
  );
  protected readonly statusText = computed(() => {
    switch (this.updates.status()) {
      case 'checking':
        return 'בודק…';
      case 'downloading':
        return 'מוריד…';
      case 'ready':
        return 'עדכון מוכן';
      case 'up-to-date':
        return 'מעודכן';
      case 'needs-apk':
        return `${this.updates.latest()} זמינה`;
      case 'error':
        return 'הבדיקה נכשלה';
      default:
        return '';
    }
  });

  constructor() {
    addIcons({ download, logoGithub, mapOutline, refresh, sparkles });
    this.api.me().then(
      (me) => this.me.set(me),
      (e: Error) => void this.alert.presentToast(e.message),
    );
  }

  protected pickBook(event: RadioGroupCustomEvent<string>): void {
    this.api.setBook(event.detail.value);
    this.me.update((m) => (m ? { ...m, book: event.detail.value } : m));
  }
}
