import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import {
  AlertController,
  IonBackButton,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonListHeader,
  IonNote,
  IonSpinner,
  IonTitle,
  IonToolbar,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import { add, calendarOutline, createOutline, linkOutline, trashOutline, unlinkOutline } from 'ionicons/icons';
import { ApiError, ApiService } from '../../core';
import { CalendarFeed, PanelState } from '../../models';
import { AlertService } from '../../shared';

/**
 * The TRMNL screen: link it to this book with the code it shows, and manage the
 * calendars on its idle page. Everyone in the household can do both.
 */
@Component({
  selector: 'app-screen',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    IonBackButton, IonButton, IonButtons, IonContent, IonHeader, IonIcon, IonItem, IonLabel, IonList, IonListHeader,
    IonNote, IonSpinner, IonTitle, IonToolbar,
  ],
  styles: `
    .intro { display: block; padding: 16px 16px 0; }
    .state { text-align: center; padding: 32px 24px; }
    .bottom { padding: 16px; }
  `,
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start"><ion-back-button defaultHref="/settings" text=""></ion-back-button></ion-buttons>
        <ion-title>המסך</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      @if (error(); as message) {
        <div class="state"><ion-note>{{ message }}</ion-note></div>
      } @else if (panel(); as p) {
        @if (p.state === 'mine') {
          <ion-note class="intro">המסך מחובר לספר הזה. היומנים מופיעים במסך המנוחה שלו.</ion-note>
          <ion-list-header>יומנים</ion-list-header>
          @if (calendars(); as list) {
            <ion-list>
              @for (c of list; track c.index) {
                <ion-item>
                  <ion-icon slot="start" name="calendar-outline" aria-hidden="true"></ion-icon>
                  <ion-label>
                    <h2>{{ c.name }}</h2>
                    <p>
                      @if (c.upcoming === null) {
                        {{ c.error || 'לא הצלחתי לקרוא את היומן' }}
                      } @else if (c.upcoming === 0) {
                        אין אירועים בחודש הקרוב · {{ c.host }}
                      } @else {
                        {{ c.upcoming }} אירועים בחודש הקרוב · {{ c.host }}
                      }
                    </p>
                  </ion-label>
                  <ion-button slot="end" fill="clear" color="medium" [attr.aria-label]="'שינוי שם ' + c.name" (click)="rename(c)">
                    <ion-icon slot="icon-only" name="create-outline"></ion-icon>
                  </ion-button>
                  <ion-button slot="end" fill="clear" color="medium" [attr.aria-label]="'הסרת ' + c.name" (click)="remove(c)">
                    <ion-icon slot="icon-only" name="trash-outline"></ion-icon>
                  </ion-button>
                </ion-item>
              } @empty {
                <ion-item lines="none"><ion-note>עוד אין יומנים.</ion-note></ion-item>
              }
              <ion-item button lines="none" [disabled]="busy()" (click)="addCalendar()">
                @if (busy()) { <ion-spinner slot="start" name="crescent"></ion-spinner> }
                @else { <ion-icon slot="start" name="add" color="primary" aria-hidden="true"></ion-icon> }
                <ion-label color="primary">הוספת יומן</ion-label>
              </ion-item>
            </ion-list>
          } @else {
            <div class="state"><ion-spinner name="crescent"></ion-spinner></div>
          }
          <div class="bottom">
            <ion-button expand="block" fill="outline" color="medium" (click)="unlink()">
              <ion-icon slot="start" name="unlink-outline" aria-hidden="true"></ion-icon>
              ניתוק המסך מהספר
            </ion-button>
          </div>
        } @else {
          <ion-note class="intro">
            @if (p.state === 'taken') {
              המסך מחובר כרגע לספר אחר. מי שחיבר אותו מנתק אותו שם, ואז המסך מציג קוד.
            } @else {
              לחצו על הכפתור במסך. הוא יציג קוד בן 6 ספרות, שתקף לרבע שעה.
            }
          </ion-note>
          <div class="bottom">
            <ion-button expand="block" (click)="link()">
              <ion-icon slot="start" name="link-outline" aria-hidden="true"></ion-icon>
              חיבור מסך עם קוד
            </ion-button>
          </div>
        }
      } @else {
        <div class="state"><ion-spinner name="crescent"></ion-spinner></div>
      }
    </ion-content>
  `,
})
export class ScreenPage {
  private readonly api = inject(ApiService);
  private readonly alerts = inject(AlertController);
  private readonly alert = inject(AlertService);

  protected readonly panel = signal<PanelState | null>(null);
  protected readonly calendars = signal<CalendarFeed[] | null>(null);
  protected readonly busy = signal(false);
  protected readonly error = signal('');

  constructor() {
    addIcons({ add, calendarOutline, createOutline, linkOutline, trashOutline, unlinkOutline });
    void this.load();
  }

  protected async link(): Promise<void> {
    const values = await this.ask('חיבור המסך', [
      { name: 'code', type: 'number', placeholder: 'הקוד שעל המסך', attributes: { inputmode: 'numeric' } },
    ], 'חיבור');
    if (!values?.['code']) return;
    try {
      this.panel.set(await this.api.linkPanel(String(values['code'])));
      await this.alert.presentToast('המסך מחובר. בלחיצה הבאה הוא יציג את הספר.');
      await this.load();
    } catch (e) {
      await this.alert.presentToast(e instanceof ApiError ? e.message : 'המסך לא חובר.');
    }
  }

  protected async unlink(): Promise<void> {
    const confirm = await this.alerts.create({
      header: 'לנתק את המסך?',
      message: 'עד שיחובר שוב, המסך יציג רק קוד חיבור. היומנים נשמרים אם תחברו אותו שוב לספר הזה.',
      buttons: [{ text: 'ביטול', role: 'cancel' }, { text: 'ניתוק', role: 'destructive' }],
    });
    await confirm.present();
    if ((await confirm.onDidDismiss()).role !== 'destructive') return;
    try {
      await this.api.unlinkPanel();
      this.panel.set({ state: 'free' });
    } catch (e) {
      await this.alert.presentToast(e instanceof ApiError ? e.message : 'המסך לא נותק.');
    }
  }

  protected async addCalendar(): Promise<void> {
    const values = await this.ask('הוספת יומן', [
      { name: 'url', type: 'url', placeholder: 'כתובת ICS (https://… או webcal://…)' },
      { name: 'name', placeholder: 'שם קצר, למשל: עבודה', attributes: { maxlength: 40 } },
    ], 'הוספה', 'ביומן Google: הגדרות היומן ← "כתובת סודית בפורמט iCal".');
    const url = String(values?.['url'] ?? '').trim();
    if (!url) return;
    this.busy.set(true);
    try {
      const added = await this.api.addCalendar(url, String(values?.['name'] ?? ''));
      await this.alert.presentToast(`„${added.name}” נוסף: ${added.upcoming} אירועים בחודש הקרוב`);
      this.calendars.set(await this.api.calendars());
    } catch (e) {
      await this.alert.presentToast(e instanceof ApiError ? e.message : 'היומן לא נוסף.');
    } finally {
      this.busy.set(false);
    }
  }

  protected async rename(c: CalendarFeed): Promise<void> {
    const values = await this.ask('שם היומן', [{ name: 'name', value: c.name, attributes: { maxlength: 40 } }], 'שמירה');
    const name = String(values?.['name'] ?? '').trim();
    if (!name || name === c.name) return;
    try {
      await this.api.renameCalendar(c.index, name);
      this.calendars.update((list) => list?.map((x) => (x.index === c.index ? { ...x, name } : x)) ?? null);
    } catch (e) {
      await this.alert.presentToast(e instanceof ApiError ? e.message : 'השם לא נשמר.');
    }
  }

  protected async remove(c: CalendarFeed): Promise<void> {
    const confirm = await this.alerts.create({
      header: `להסיר את „${c.name}”?`,
      message: 'היומן עצמו לא נמחק, הוא רק לא יופיע במסך.',
      buttons: [{ text: 'ביטול', role: 'cancel' }, { text: 'הסרה', role: 'destructive' }],
    });
    await confirm.present();
    if ((await confirm.onDidDismiss()).role !== 'destructive') return;
    try {
      await this.api.deleteCalendar(c.index);
      // Indexes shift after a removal, so read the list again.
      this.calendars.set(await this.api.calendars());
    } catch (e) {
      await this.alert.presentToast(e instanceof ApiError ? e.message : 'היומן לא הוסר.');
    }
  }

  private async ask(
    header: string,
    inputs: { name: string; type?: 'number' | 'url' | 'text'; placeholder?: string; value?: string; attributes?: Record<string, unknown> }[],
    ok: string,
    message?: string,
  ): Promise<Record<string, unknown> | null> {
    const prompt = await this.alerts.create({
      header,
      message,
      inputs,
      buttons: [{ text: 'ביטול', role: 'cancel' }, { text: ok, role: 'confirm' }],
    });
    await prompt.present();
    const { role, data } = await prompt.onDidDismiss<{ values: Record<string, unknown> }>();
    return role === 'confirm' ? (data?.values ?? null) : null;
  }

  private async load(): Promise<void> {
    try {
      const panel = await this.api.panel();
      this.panel.set(panel);
      this.error.set('');
      if (panel.state === 'mine') {
        this.calendars.set(await this.api.calendars());
      }
    } catch (e) {
      this.error.set(e instanceof ApiError ? e.message : 'משהו השתבש.');
    }
  }
}
