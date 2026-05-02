import { APP_INITIALIZER, Provider } from '@angular/core';
import { TranslocoService } from '@jsverse/transloco';

export const APP_LANG_STORAGE_KEY = 'escola.i18n.lang';

function restorePersistedLang(transloco: TranslocoService): () => void {
  return () => {
    const raw = localStorage.getItem(APP_LANG_STORAGE_KEY);
    if (raw === 'en' || raw === 'pt-BR') {
      transloco.setActiveLang(raw);
    }
  };
}

/** Aplica idioma salvo antes do primeiro render. */
export function providePersistedTranslocoLanguage(): Provider {
  return {
    provide: APP_INITIALIZER,
    multi: true,
    useFactory: restorePersistedLang,
    deps: [TranslocoService],
  };
}
