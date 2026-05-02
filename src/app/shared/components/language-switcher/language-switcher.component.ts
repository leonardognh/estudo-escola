import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { ButtonModule } from 'primeng/button';

import { APP_LANG_STORAGE_KEY } from '@app/core/i18n/persisted-lang';

@Component({
  selector: 'app-language-switcher',
  standalone: true,
  imports: [ButtonModule, TranslocoPipe],
  template: `
    <div class="flex flex-wrap gap-1" role="group" [attr.aria-label]="ariaLabel() | transloco">
      @for (opt of langOptions; track opt.id) {
        <p-button
          type="button"
          [label]="opt.labelKey | transloco"
          size="small"
          [outlined]="activeLang() !== opt.id"
          [severity]="activeLang() === opt.id ? 'primary' : 'secondary'"
          [attr.aria-pressed]="activeLang() === opt.id ? 'true' : 'false'"
          (click)="setLanguage(opt.id)"
        />
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LanguageSwitcherComponent {
  private readonly transloco = inject(TranslocoService);

  /** Chave i18n para o aria-label do grupo (ex.: lang.switch). */
  readonly ariaLabel = input<string>('lang.switch');

  protected readonly activeLang = this.transloco.activeLang;
  protected readonly langOptions = [
    { id: 'pt-BR', labelKey: 'lang.pt' },
    { id: 'en', labelKey: 'lang.en' },
  ] as const;

  protected setLanguage(langId: string): void {
    if (langId !== 'pt-BR' && langId !== 'en') {
      return;
    }
    this.transloco.setActiveLang(langId);
    localStorage.setItem(APP_LANG_STORAGE_KEY, langId);
  }
}
