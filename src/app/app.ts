import { NgClass } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { filter, map, startWith } from 'rxjs';
import { AuthService } from '@auth/services/auth.service';
import type { UserRole } from '@auth/models/auth-user.model';
import { ThemeService } from '@app/core/theme/theme.service';
import { TranslocoPipe } from '@jsverse/transloco';

@Component({
  selector: 'app-root',
  imports: [NgClass, RouterLink, RouterLinkActive, RouterOutlet, ButtonModule, ToastModule, TranslocoPipe],
  templateUrl: './app.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly themeService = inject(ThemeService);

  /** Menu lateral em telas pequenas (drawer). */
  protected readonly mobileNavOpen = signal(false);

  private readonly currentPath = toSignal(
    this.router.events.pipe(
      filter((event) => event instanceof NavigationEnd),
      map((event) => this.normalizePath((event as NavigationEnd).urlAfterRedirects)),
      startWith(this.normalizePath(this.router.url)),
    ),
    { initialValue: this.normalizePath(this.router.url) },
  );

  protected readonly selectedRoute = computed(() => this.currentPath());
  protected readonly currentUser = this.authService.currentUser;
  protected readonly isAuthenticated = this.authService.isAuthenticated;
  protected readonly isLoginRoute = computed(() => this.selectedRoute() === '/login');
  protected readonly isDarkTheme = this.themeService.isDark;

  constructor() {
    this.router.events
      .pipe(
        filter((e): e is NavigationEnd => e instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe(() => this.mobileNavOpen.set(false));
  }

  private readonly allSections: {
    groupKey: string;
    roles: UserRole[];
    items: { labelKey: string; path: string; roles?: UserRole[] }[];
  }[] = [
    {
      groupKey: 'nav.group.geral',
      roles: ['admin', 'professor', 'aluno', 'responsavel'],
      items: [
        { labelKey: 'nav.inicio', path: '/inicio' },
        { labelKey: 'nav.calendario', path: '/calendario', roles: ['admin', 'professor'] },
        { labelKey: 'nav.portal', path: '/portal', roles: ['aluno', 'responsavel'] },
      ],
    },
    {
      groupKey: 'nav.group.gestao',
      roles: ['admin'],
      items: [
        { labelKey: 'nav.alunos', path: '/alunos' },
        { labelKey: 'nav.responsaveis', path: '/responsaveis' },
        { labelKey: 'nav.professores', path: '/professores' },
        { labelKey: 'nav.turmas', path: '/turmas' },
        { labelKey: 'nav.periodos', path: '/periodos' },
      ],
    },
    {
      groupKey: 'nav.group.planejamento',
      roles: ['admin'],
      items: [
        { labelKey: 'nav.materias', path: '/materias' },
        { labelKey: 'nav.materiasAno', path: '/materias-ano' },
      ],
    },
    {
      groupKey: 'nav.group.docencia',
      roles: ['admin', 'professor'],
      items: [
        { labelKey: 'nav.horarios', path: '/horarios-aulas' },
        { labelKey: 'nav.atividades', path: '/atividades' },
        { labelKey: 'nav.notas', path: '/notas' },
        { labelKey: 'nav.presencas', path: '/presencas' },
        { labelKey: 'nav.intervencoes', path: '/intervencoes' },
        { labelKey: 'nav.riscos', path: '/riscos' },
      ],
    },
    {
      groupKey: 'nav.group.admin',
      roles: ['admin'],
      items: [
        { labelKey: 'nav.config', path: '/configuracoes' },
        { labelKey: 'nav.painel', path: '/painel-executivo' },
      ],
    },
  ];

  protected readonly navSections = computed(() => {
    const role = this.currentUser()?.role;
    if (!role) {
      return [];
    }
    return this.allSections
      .filter((section) => section.roles.includes(role))
      .map((section) => ({
        groupKey: section.groupKey,
        items: section.items.filter((item) => !item.roles || item.roles.includes(role)),
      }))
      .filter((section) => section.items.length > 0);
  });

  protected openMobileNav(): void {
    this.mobileNavOpen.set(true);
  }

  protected closeMobileNav(): void {
    this.mobileNavOpen.set(false);
  }

  protected logout(): void {
    this.authService.logout();
    this.router.navigateByUrl('/login');
  }

  protected toggleTheme(): void {
    this.themeService.toggle();
  }

  private normalizePath(url: string): string {
    const [path] = url.split('?');
    return path || '/login';
  }
}
