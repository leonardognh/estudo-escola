import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';

import { AuthService } from '@auth/services/auth.service';
import { InicioAdminStepsComponent } from '@inicio/components/inicio-admin-steps.component';
import { InicioFamiliaStepsComponent } from '@inicio/components/inicio-familia-steps.component';
import { InicioProfessorStepsComponent } from '@inicio/components/inicio-professor-steps.component';

@Component({
  selector: 'app-inicio-page',
  standalone: true,
  imports: [InicioAdminStepsComponent, InicioFamiliaStepsComponent, InicioProfessorStepsComponent],
  templateUrl: './inicio-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InicioPageComponent {
  private readonly authService = inject(AuthService);
  protected readonly isProfessor = computed(() => this.authService.currentUser()?.role === 'professor');
  protected readonly isFamilia = computed(() => {
    const role = this.authService.currentUser()?.role;
    return role === 'aluno' || role === 'responsavel';
  });
}
