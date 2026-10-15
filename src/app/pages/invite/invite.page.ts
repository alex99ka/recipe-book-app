import { ChangeDetectionStrategy, Component, OnInit, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Capacitor } from '@capacitor/core';
import { IonButton, IonContent, IonHeader, IonNote, IonSpinner, IonTitle, IonToolbar } from '@ionic/angular';
import { ApiError, ApiService } from '../../core';
import { environment } from '../../../environments/environment';

/** /invite/:token, the link a friend sends. Sign-in comes first (authGuard carries the link through it). */
@Component({
  selector: 'app-invite',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IonButton, IonContent, IonHeader, IonNote, IonSpinner, IonTitle, IonToolbar, RouterLink],
  styles: `.state { text-align: center; padding: 48px 24px; } h2 { margin-top: 0; }`,
  template: `
    <ion-header>
      <ion-toolbar><ion-title>הזמנה</ion-title></ion-toolbar>
    </ion-header>
    <ion-content>
      <div class="state">
        @if (friend(); as name) {
          <h2>עכשיו אתם חברים של {{ name }}</h2>
          <p><ion-note>אפשר לשלוח זה לזה מתכונים וספרים שלמים. כל אחד מקבל עותק משלו.</ion-note></p>
          <ion-button routerLink="/home" [replaceUrl]="true">לספר המתכונים</ion-button>
          @if (web) {
            <p><a [href]="apkUrl" target="_blank" rel="noopener">יש לכם אנדרואיד? להורדת האפליקציה</a></p>
          }
        } @else if (error(); as message) {
          <p><ion-note>{{ message }}</ion-note></p>
          <ion-button fill="outline" routerLink="/home" [replaceUrl]="true">לספר המתכונים</ion-button>
        } @else {
          <ion-spinner name="crescent"></ion-spinner>
        }
      </div>
    </ion-content>
  `,
})
export class InvitePage implements OnInit {
  private readonly api = inject(ApiService);
  readonly token = input.required<string>();

  protected readonly friend = signal('');
  protected readonly error = signal('');
  protected readonly web = !Capacitor.isNativePlatform();
  protected readonly apkUrl = `https://github.com/${environment.githubRepo}/releases/latest`;

  ngOnInit(): void {
    this.api.acceptInvite(this.token()).then(
      (f) => this.friend.set(f.name || 'חבר חדש'),
      (e: unknown) => this.error.set(e instanceof ApiError ? e.message : 'משהו השתבש.'),
    );
  }
}
