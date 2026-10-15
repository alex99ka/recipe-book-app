import { AlertController } from '@ionic/angular';

/** Asks for a cookbook name; null when cancelled or left empty. */
export async function askTitle(alerts: AlertController, header: string, value = ''): Promise<string | null> {
  const alert = await alerts.create({
    header,
    inputs: [{ name: 'title', value, placeholder: 'למשל: ארוחות שישי', attributes: { maxlength: 80 } }],
    buttons: [
      { text: 'ביטול', role: 'cancel' },
      { text: 'שמירה', role: 'confirm' },
    ],
  });
  await alert.present();
  const { role, data } = await alert.onDidDismiss<{ values: { title: string } }>();
  const title = data?.values.title.trim() ?? '';
  return role === 'confirm' && title ? title : null;
}
