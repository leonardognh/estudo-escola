import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { filter, map, startWith } from 'rxjs';
import { AuthService } from '@auth/services/auth.service';
import { ThemeService } from '@app/core/theme/theme.service';

@Component({
  selector: 'app-root',
  imports: [RouterLink, RouterLinkActive, RouterOutlet, ButtonModule, ToastModule],
  templateUrl: './app.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly themeService = inject(ThemeService);
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

  private readonly allSections = [
    {
      group: 'Geral',
      roles: ['admin', 'professor'],
      items: [
        { label: 'Inicio', path: '/inicio' },
        { label: 'Calendario', path: '/calendario' },
      ],
    },
    {
      group: 'Gestao academica',
      roles: ['admin'],
      items: [
        { label: 'Alunos', path: '/alunos' },
        { label: 'Professores', path: '/professores' },
        { label: 'Turmas', path: '/turmas' },
        { label: 'Periodos', path: '/periodos' },
      ],
    },
    {
      group: 'Planejamento curricular',
      roles: ['admin'],
      items: [
        { label: 'Materias', path: '/materias' },
        { label: 'Materias por ano', path: '/materias-ano' },
      ],
    },
    {
      group: 'Docencia',
      roles: ['admin', 'professor'],
      items: [
        { label: 'Horarios', path: '/horarios-aulas' },
        { label: 'Atividades', path: '/atividades' },
        { label: 'Notas', path: '/notas' },
        { label: 'Presencas', path: '/presencas' },
      ],
    },
    {
      group: 'Administracao',
      roles: ['admin'],
      items: [{ label: 'Configuracoes', path: '/configuracoes' }],
    },
  ];

  protected readonly navSections = computed(() => {
    const role = this.currentUser()?.role;
    if (!role) {
      return [];
    }
    return this.allSections.filter((section) => section.roles.includes(role));
  });

  protected onNavigate(path: string | null): void {
    if (!path || path === this.selectedRoute() || this.isLoginRoute()) {
      return;
    }
    this.router.navigateByUrl(path);
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
