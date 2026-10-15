import { ChangeDetectionStrategy, Component, OnInit, inject, input, signal } from '@angular/core';
import {
  IonBackButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonNote,
  IonSpinner,
  IonTitle,
  IonToolbar,
} from '@ionic/angular';
import { ApiError, ApiService } from '../../core';
import { RecipeSummary } from '../../models';
import { RecipeListComponent } from '../../shared';

@Component({
  selector: 'app-cookbook',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IonBackButton, IonButtons, IonContent, IonHeader, IonNote, IonSpinner, IonTitle, IonToolbar, RecipeListComponent],
  styles: `.state { text-align: center; padding: 48px 24px; }`,
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start"><ion-back-button defaultHref="/home" text=""></ion-back-button></ion-buttons>
        <ion-title>{{ title() }}</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      @if (error(); as message) {
        <div class="state"><ion-note>{{ message }}</ion-note></div>
      } @else if (recipes(); as list) {
        <app-recipe-list [recipes]="list" empty="אין מתכונים בספר הזה." />
      } @else {
        <div class="state"><ion-spinner name="crescent"></ion-spinner></div>
      }
    </ion-content>
  `,
})
export class CookbookPage implements OnInit {
  private readonly api = inject(ApiService);
  /** Route param, bound by withComponentInputBinding. */
  readonly slug = input.required<string>();

  protected readonly title = signal<string>((history.state as { title?: string })?.title ?? '');
  protected readonly recipes = signal<RecipeSummary[] | null>(null);
  protected readonly error = signal('');

  ngOnInit(): void {
    void this.load();
  }

  private async load(): Promise<void> {
    try {
      const [recipes, cookbooks] = await Promise.all([
        this.api.recipes({ cookbook: this.slug() }),
        // Opened from a link or after a reload, there is no title to carry over.
        this.title() ? Promise.resolve([]) : this.api.cookbooks(),
      ]);
      this.recipes.set(recipes);
      const found = cookbooks.find((c) => c.slug === this.slug());
      if (found) {
        this.title.set(found.title);
      }
    } catch (e) {
      this.error.set(e instanceof ApiError ? e.message : 'משהו השתבש.');
    }
  }
}
