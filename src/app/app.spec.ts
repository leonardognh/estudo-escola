import { importProvidersFrom } from '@angular/core';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { TranslocoTestingModule } from '@jsverse/transloco';
import { MessageService } from 'primeng/api';

import { AuthService } from '@auth/services/auth.service';
import { ThemeService } from '@app/core/theme/theme.service';
import { App } from './app';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const translocoPtBR = require('../../public/i18n/pt-BR.json') as Record<string, string>;
// eslint-disable-next-line @typescript-eslint/no-require-imports
const translocoEn = require('../../public/i18n/en.json') as Record<string, string>;

describe('App', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [App],
      providers: [
        importProvidersFrom(
          TranslocoTestingModule.forRoot({
            preloadLangs: true,
            langs: { 'pt-BR': translocoPtBR, en: translocoEn },
            translocoConfig: {
              availableLangs: [
                { id: 'pt-BR', label: 'Português' },
                { id: 'en', label: 'English' },
              ],
              defaultLang: 'pt-BR',
            },
          }),
        ),
        provideRouter([]),
        MessageService,
        {
          provide: AuthService,
          useValue: {
            currentUser: signal(null),
            isAuthenticated: signal(false),
          },
        },
        {
          provide: ThemeService,
          useValue: {
            isDark: signal(false),
            mode: signal<'light' | 'dark'>('light'),
            toggle: jest.fn(),
          },
        },
      ],
    });
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should render title', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h1')?.textContent).toContain('Escola');
  });
});
