import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { SplashScreen } from '@capacitor/splash-screen';
import { StatusBar, Style } from '@capacitor/status-bar';
import {
  IonApp,
  IonBadge,
  IonContent,
  IonHeader,
  IonIcon,
  IonItem,
  IonLabel,
  IonMenu,
  IonMenuToggle,
  IonRouterOutlet,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import { book, checkboxOutline, logOut, mail, openOutline, people, settings } from 'ionicons/icons';
import { ApiService, AuthService, UpdateService } from './core';
import { AlertService, openApp } from './shared';
import { CustomAlert } from './models';

@Component({
  selector: 'app-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  imports: [
    IonApp,
    IonBadge,
    IonMenu,
    IonHeader,
    IonContent,
    IonItem,
    IonIcon,
    IonLabel,
    IonMenuToggle,
    IonRouterOutlet,
    RouterLink,
    RouterLinkActive,
  ],
})
export class AppComponent {
  private readonly auth = inject(AuthService);
  private readonly alert = inject(AlertService);
  private readonly router = inject(Router);

  protected readonly user = toSignal(this.auth.user$, { initialValue: null });
  protected readonly inboxCount = inject(ApiService).inboxCount;

  constructor() {
    addIcons({ book, settings, logOut, mail, people, checkboxOutline, openOutline });
    void this.prepareNativeChrome();
    void this.openAppLinks();
    inject(UpdateService).start();
  }

  /** The to-do and shopping app: same Google account, same households. */
  protected openTodo(): void {
    void openApp('com.alex99ka.todoshop', 'https://alex-todo-shopping.web.app');
  }

  protected confirmSignOut(): void {
    const alert: CustomAlert = {
      title: 'להתנתק?',
      message: 'כדי לחזור צריך להיכנס שוב עם Google.',
      yesText: 'התנתקות',
      yesToastThen: 'התנתקת',
      yesToastCatch: 'משהו השתבש',
      yesFunction: () => this.signOut(),
    };
    void this.alert.createAlert(alert);
  }

  private async signOut(): Promise<void> {
    await this.auth.signOut();
    await this.router.navigate(['/auth']);
  }

  /** An invite link tapped in WhatsApp opens the app (an Android App Link) on that screen. */
  private async openAppLinks(): Promise<void> {
    if (!Capacitor.isNativePlatform()) {
      return;
    }
    const open = (url: string | undefined) => {
      const link = url ? new URL(url) : null;
      if (link?.host === 'alex-recipe-book.web.app' && link.pathname.startsWith('/invite/')) {
        void this.router.navigateByUrl(link.pathname);
      }
    };
    await App.addListener('appUrlOpen', (event) => open(event.url));
    open((await App.getLaunchUrl())?.url); // the link that started the app
  }

  private async prepareNativeChrome(): Promise<void> {
    if (!Capacitor.isNativePlatform()) {
      return;
    }
    // setBackgroundColor is Android-only and rejects elsewhere; the original app
    // only ever shipped an Android build.
    // Light app: white status bar with dark icons (Style.Light means dark content).
    await StatusBar.setStyle({ style: Style.Light });
    if (Capacitor.getPlatform() === 'android') {
      await StatusBar.setBackgroundColor({ color: '#ffffff' });
    }
    await SplashScreen.hide();
  }
}
