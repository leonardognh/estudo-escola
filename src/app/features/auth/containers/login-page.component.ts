import { ChangeDetectionStrategy, Component, effect, inject, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { MessageService } from 'primeng/api';
import { filter, map, startWith, switchMap } from 'rxjs';

import { AuthService } from '@auth/services/auth.service';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [ReactiveFormsModule, ButtonModule, CardModule, InputTextModule],
  templateUrl: './login-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginPageComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly messageService = inject(MessageService);

  private readonly loginAttempt = signal<{ email: string; senha: string; lembrarMe: boolean } | null>(null);
  private readonly loginResult = toSignal(
    toObservable(this.loginAttempt).pipe(
      filter((attempt): attempt is { email: string; senha: string; lembrarMe: boolean } => !!attempt),
      switchMap((attempt) => this.authService.login(attempt.email, attempt.senha, attempt.lembrarMe)),
      map((ok) => ({ ok })),
      startWith(null),
    ),
    { initialValue: null },
  );

  protected readonly form = this.formBuilder.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    senha: ['', [Validators.required, Validators.minLength(4)]],
    lembrarMe: [true],
  });

  constructor() {
    effect(() => {
      const attempt = this.loginAttempt();
      const result = this.loginResult();
      if (attempt === null || result === null) {
        return;
      }
      if (!result.ok) {
        this.messageService.add({
          severity: 'error',
          summary: 'Acesso negado',
          detail: 'Credenciais invalidas.',
        });
        this.loginAttempt.set(null);
        return;
      }
      this.messageService.add({
        severity: 'success',
        summary: 'Bem-vindo',
        detail: 'Login realizado com sucesso.',
      });
      this.loginAttempt.set(null);
      this.router.navigateByUrl('/inicio');
    });
  }

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.messageService.add({
        severity: 'warn',
        summary: 'Validacao',
        detail: 'Preencha email e senha corretamente.',
      });
      return;
    }
    const { email, senha, lembrarMe } = this.form.getRawValue();
    this.loginAttempt.set({ email, senha, lembrarMe });
  }
}
