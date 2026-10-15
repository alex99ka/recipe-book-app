import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AlertController } from '@ionic/angular';
import { ApiError, ApiService } from '../core';
import { AlertService } from './alert.service';

/** Picks a friend and sends them a copy of a recipe or a whole cookbook. */
@Injectable({ providedIn: 'root' })
export class SendService {
  private readonly api = inject(ApiService);
  private readonly alerts = inject(AlertController);
  private readonly alert = inject(AlertService);
  private readonly router = inject(Router);

  async send(what: { recipe: string } | { collection: number }, title: string): Promise<void> {
    let friends;
    try {
      friends = await this.api.friends();
    } catch (e) {
      await this.alert.presentToast(e instanceof ApiError ? e.message : 'החברים לא נטענו.');
      return;
    }
    if (!friends.length) {
      const none = await this.alerts.create({
        header: 'עוד אין לכם חברים',
        message: 'מזמינים חבר בקישור, ואז אפשר לשלוח לו מתכונים וספרים.',
        buttons: [{ text: 'ביטול', role: 'cancel' }, { text: 'הזמנת חבר', role: 'confirm' }],
      });
      await none.present();
      if ((await none.onDidDismiss()).role === 'confirm') {
        await this.router.navigateByUrl('/friends');
      }
      return;
    }
    const picker = await this.alerts.create({
      header: `לשלוח את „${title}”`,
      message: 'החבר יקבל עותק משלו. שינויים שתעשו אחר כך לא יעברו אליו.',
      inputs: friends.map((f, i) => ({ type: 'radio' as const, label: f.name, value: f.uid, checked: i === 0 })),
      buttons: [{ text: 'ביטול', role: 'cancel' }, { text: 'שליחה', role: 'confirm' }],
    });
    await picker.present();
    const { role, data } = await picker.onDidDismiss<{ values: string }>();
    const to = data?.values;
    if (role !== 'confirm' || !to) return;
    const name = friends.find((f) => f.uid === to)?.name ?? '';
    const ask = await this.alerts.create({
      header: `הערה ל${name}`,
      message: 'לא חובה. כששולחים מתכון, ההערה פותחת שיחה ששניכם רואים בתוך המתכון.',
      inputs: [{ name: 'note', type: 'textarea', placeholder: 'למשל: נסו עם כבש', attributes: { maxlength: 1000 } }],
      buttons: [{ text: 'בלי הערה', role: 'skip' }, { text: 'שליחה', role: 'confirm' }],
    });
    await ask.present();
    const answer = await ask.onDidDismiss<{ values: { note: string } }>();
    if (answer.role !== 'skip' && answer.role !== 'confirm') return;
    const note = answer.role === 'confirm' ? (answer.data?.values.note ?? '').trim() : '';
    await this.alert.presentToast('שולח…');
    try {
      await this.api.send(what, to, note);
      await this.alert.presentToast(`נשלח ל${name}`);
    } catch (e) {
      await this.alert.presentToast(e instanceof ApiError ? e.message : 'השליחה נכשלה.');
    }
  }
}
