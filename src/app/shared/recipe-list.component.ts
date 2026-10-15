import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IonItem, IonLabel, IonList, IonNote, IonThumbnail } from '@ionic/angular';
import { ApiService } from '../core';
import { RecipeSummary } from '../models';

@Component({
  selector: 'app-recipe-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IonItem, IonLabel, IonList, IonNote, IonThumbnail, RouterLink],
  styles: `
    ion-thumbnail img { border-radius: 6px; }
    .empty { text-align: center; padding: 48px 24px; }
  `,
  template: `
    <ion-list>
      @for (r of recipes(); track r.id) {
        <ion-item button [routerLink]="['/recipe', r.id]">
          <ion-thumbnail slot="start">
            @if (r.image) {
              <img [src]="api.imageUrl(r.image)" alt="" loading="lazy" />
            }
          </ion-thumbnail>
          <ion-label>
            <h2>{{ r.title }}</h2>
            @if (r.tags.length) {
              <p>{{ r.tags.join(' · ') }}</p>
            }
          </ion-label>
          @if (r.rating) {
            <ion-note slot="end">★ {{ r.rating }}</ion-note>
          }
        </ion-item>
      } @empty {
        <div class="empty"><ion-note>{{ empty() }}</ion-note></div>
      }
    </ion-list>
  `,
})
export class RecipeListComponent {
  protected readonly api = inject(ApiService);
  readonly recipes = input.required<RecipeSummary[]>();
  readonly empty = input('אין מתכונים.');
}
