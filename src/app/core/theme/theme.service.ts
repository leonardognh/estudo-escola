import { DOCUMENT } from '@angular/common';
import { effect, inject, Injectable, signal } from '@angular/core';

type ThemeMode = 'light' | 'dark';

const THEME_STORAGE_KEY = 'escola.theme.mode';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly document = inject(DOCUMENT);
  readonly mode = signal<ThemeMode>(this.loadInitialMode());
  readonly isDark = signal(this.mode() === 'dark');

  constructor() {
    effect(() => {
      const currentMode = this.mode();
      this.isDark.set(currentMode === 'dark');
      this.document.documentElement.classList.toggle('app-dark', currentMode === 'dark');
      localStorage.setItem(THEME_STORAGE_KEY, currentMode);
    });
  }

  toggle(): void {
    this.mode.set(this.mode() === 'dark' ? 'light' : 'dark');
  }

  private loadInitialMode(): ThemeMode {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === 'dark' || stored === 'light') {
      return stored;
    }
    return 'light';
  }
}
