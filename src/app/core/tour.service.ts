import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { driver, type Driver } from 'driver.js';
import { ApiService } from './api.service';

const SEEN_KEY = 'recipes.tour.seen';

interface TourStep {
  /** The screen the step is on; the tour navigates there before showing it. */
  page: 'home' | 'recipe' | 'settings';
  /** A [data-tour] name; without one the step is a centred card. */
  target?: string;
  title: string;
  text: string;
}

const STEPS: TourStep[] = [
  { page: 'home', title: 'ברוכים הבאים לספר המתכונים', text: 'סיור קצר בכל מה שאפשר לעשות כאן. אפשר לצאת ממנו בכל רגע ולחזור אליו מההגדרות.' },
  { page: 'home', target: 'search', title: 'חיפוש', text: 'מחפשים לפי שם, מצרך או תגית, בעברית או באנגלית.' },
  { page: 'home', target: 'my-books', title: 'הספרים שלי', text: 'ספרים שאתם יוצרים, משותפים לכל הבית. מתכון יכול להיות בכמה ספרים. ״ספר חדש״ פותח אחד.' },
  { page: 'home', target: 'cookbooks', title: 'ספרי בישול', text: 'המתכונים מהספרים שסרקתם, כל ספר לפי סדר העמודים שלו.' },
  { page: 'home', target: 'recent', title: 'נוספו לאחרונה', text: 'המתכונים החדשים בספר. לחיצה פותחת מתכון. משיכה למטה מרעננת.' },
  { page: 'recipe', target: 'stars', title: 'דירוג', text: 'לחיצה על כוכב מדרגת. לחיצה נוספת על אותו כוכב נותנת חצי כוכב.' },
  { page: 'recipe', target: 'scale', title: 'כמויות', text: 'מכפילים או משלשים, והכמויות והעלות מתעדכנות. זמני הבישול לא משתנים.' },
  { page: 'recipe', target: 'add-to-book', title: 'הוספה לספר', text: 'מסמנים לאילו מהספרים שלכם המתכון שייך, או פותחים ספר חדש.' },
  { page: 'recipe', target: 'send', title: 'שליחה לחבר', text: 'החבר מקבל עותק משלו של המתכון. בספר משלכם יש כפתור דומה ששולח את כל הספר. את החברים מזמינים מהתפריט.' },
  { page: 'recipe', target: 'shopping', title: 'רשימת קניות', text: 'שולח את המצרכים, בכמויות שעל המסך, לאפליקציית המשימות והקניות.' },
  { page: 'home', target: 'menu', title: 'התפריט', text: 'משם מגיעים להגדרות ולהתנתקות.' },
  { page: 'settings', target: 'tour', title: 'זהו!', text: 'כאן מחכה הסיור כשתרצו לראות אותו שוב.' },
];

/**
 * A guided tour across the real screens. It starts by itself once per device,
 * after the first sign-in, and Settings replays it.
 */
@Injectable({ providedIn: 'root' })
export class TourService {
  private readonly router = inject(Router);
  private readonly api = inject(ApiService);
  private tour?: Driver;
  private steps: TourStep[] = [];
  private recipeId = '';

  /** Starts the tour if this device has not seen it yet. */
  startOnce(): void {
    if (!localStorage.getItem(SEEN_KEY)) {
      void this.start();
    }
  }

  async start(): Promise<void> {
    localStorage.setItem(SEEN_KEY, '1');
    this.tour?.destroy();
    // The recipe steps need a recipe to stand on; an empty book skips them.
    this.recipeId = (await this.api.recipes().catch(() => []))[0]?.id ?? '';
    this.steps = STEPS.filter((s) => s.page !== 'recipe' || this.recipeId);
    this.tour = driver({
      showProgress: true,
      progressText: '{{current}} מתוך {{total}}',
      nextBtnText: 'הבא',
      prevBtnText: 'הקודם',
      doneBtnText: 'סיום',
      popoverClass: 'app-tour',
      // A tap on the highlighted control would leave the tour behind.
      disableActiveInteraction: true,
      steps: this.steps.map(({ target, title, text }) => ({
        element: target ? () => visible(target) ?? document.body : undefined,
        popover: { title, description: text },
      })),
      onNextClick: () => void this.go((this.tour?.getActiveIndex() ?? 0) + 1),
      onPrevClick: () => void this.go((this.tour?.getActiveIndex() ?? 0) - 1),
    });
    await this.go(0);
  }

  /** Moves to step i, opening its screen and waiting for its element to render first. */
  private async go(i: number): Promise<void> {
    const tour = this.tour;
    if (!tour) return;
    if (i >= this.steps.length) {
      tour.destroy();
      return;
    }
    const step = this.steps[Math.max(i, 0)];
    const url = step.page === 'recipe' ? `/recipe/${this.recipeId}` : `/${step.page}`;
    if (this.router.url !== url) {
      await this.router.navigateByUrl(url);
    }
    if (step.target) {
      await waitFor(step.target);
    }
    if (tour.isActive()) {
      tour.moveTo(Math.max(i, 0));
    } else {
      tour.drive(Math.max(i, 0));
    }
  }
}

/** The [data-tour] element on the page in view: Ionic keeps earlier pages in the DOM, hidden. */
function visible(name: string): Element | null {
  return (
    [...document.querySelectorAll(`[data-tour="${name}"]`)].find(
      (el) => !el.closest('.ion-page-hidden') && el.getBoundingClientRect().width > 0,
    ) ?? null
  );
}

/** Screens load their data first; give up after 6 s and show the step centred. */
async function waitFor(name: string): Promise<void> {
  for (let t = 0; t < 60 && !visible(name); t++) {
    await new Promise((r) => setTimeout(r, 100));
  }
}
