import { ChangeDetectionStrategy, Component, OnInit, inject, input, signal } from '@angular/core';
import { Router } from '@angular/router';
import {
  AlertController,
  IonBackButton,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonNote,
  IonSpinner,
  IonTitle,
  IonToolbar,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import { createOutline, paperPlaneOutline, trashOutline } from 'ionicons/icons';
import { ApiError, ApiService } from '../../core';
import { RecipeSummary } from '../../models';
import { AlertService, RecipeListComponent, SendService, askTitle } from '../../shared';

/** A scanned cookbook (/cookbook/:slug) or one of the book's own (/collection/:id). */
@Component({
  selector: 'app-cookbook',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    IonBackButton, IonButton, IonButtons, IonContent, IonHeader, IonIcon, IonNote, IonSpinner, IonTitle, IonToolbar,
    RecipeListComponent,
  ],
  styles: `.state { text-align: center; padding: 48px 24px; }`,
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start"><ion-back-button defaultHref="/home" text=""></ion-back-button></ion-buttons>
        <ion-title>{{ title() }}</ion-title>
        @if (id()) {
          <ion-buttons slot="end">
            <ion-button aria-label="שליחה לחבר" (click)="share()"><ion-icon slot="icon-only" name="paper-plane-outline"></ion-icon></ion-button>
            <ion-button aria-label="שינוי שם" (click)="rename()"><ion-icon slot="icon-only" name="create-outline"></ion-icon></ion-button>
            <ion-button aria-label="מחיקת הספר" (click)="remove()"><ion-icon slot="icon-only" name="trash-outline"></ion-icon></ion-button>
          </ion-buttons>
        }
      </ion-toolbar>
    </ion-header>
    <ion-content>
      @if (error(); as message) {
        <div class="state"><ion-note>{{ message }}</ion-note></div>
      } @else if (recipes(); as list) {
        <app-recipe-list [recipes]="list" [empty]="id() ? 'הספר עוד ריק. מוסיפים אליו מתוך מתכון, בכפתור ״הוספה לספר״.' : 'אין מתכונים בספר הזה.'" />
      } @else {
        <div class="state"><ion-spinner name="crescent"></ion-spinner></div>
      }
    </ion-content>
  `,
})
export class CookbookPage implements OnInit {
  private readonly api = inject(ApiService);
  private readonly alerts = inject(AlertController);
  private readonly alert = inject(AlertService);
  private readonly router = inject(Router);
  private readonly sender = inject(SendService);
  /** Route params, bound by withComponentInputBinding: one or the other. */
  readonly slug = input<string>();
  readonly id = input<string>();

  protected readonly title = signal<string>((history.state as { title?: string })?.title ?? '');
  protected readonly recipes = signal<RecipeSummary[] | null>(null);
  protected readonly error = signal('');

  constructor() {
    addIcons({ createOutline, paperPlaneOutline, trashOutline });
  }

  ngOnInit(): void {
    void this.load();
  }

  protected share(): void {
    void this.sender.send({ collection: Number(this.id()) }, this.title());
  }

  protected async rename(): Promise<void> {
    const title = await askTitle(this.alerts, 'שם הספר', this.title());
    if (!title) return;
    try {
      this.title.set((await this.api.renameCollection(Number(this.id()), title)).title);
    } catch (e) {
      await this.alert.presentToast(e instanceof ApiError ? e.message : 'השם לא נשמר.');
    }
  }

  protected async remove(): Promise<void> {
    const confirm = await this.alerts.create({
      header: `למחוק את „${this.title()}”?`,
      message: 'רק הספר נמחק. המתכונים שבו נשארים בספר המתכונים.',
      buttons: [{ text: 'ביטול', role: 'cancel' }, { text: 'מחיקה', role: 'destructive' }],
    });
    await confirm.present();
    if ((await confirm.onDidDismiss()).role !== 'destructive') return;
    try {
      await this.api.deleteCollection(Number(this.id()));
      await this.router.navigateByUrl('/home');
    } catch (e) {
      await this.alert.presentToast(e instanceof ApiError ? e.message : 'הספר לא נמחק.');
    }
  }

  private async load(): Promise<void> {
    const id = Number(this.id()) || undefined;
    try {
      const [recipes, title] = await Promise.all([
        this.api.recipes(id ? { collection: id } : { cookbook: this.slug() }),
        // Opened from a link or after a reload, there is no title to carry over.
        this.title() ? Promise.resolve(this.title()) : this.lookUpTitle(id),
      ]);
      this.recipes.set(recipes);
      this.title.set(title);
    } catch (e) {
      this.error.set(e instanceof ApiError ? e.message : 'משהו השתבש.');
    }
  }

  private async lookUpTitle(id?: number): Promise<string> {
    if (id) {
      return (await this.api.collections()).find((c) => c.id === id)?.title ?? '';
    }
    return (await this.api.cookbooks()).find((c) => c.slug === this.slug())?.title ?? '';
  }
}
