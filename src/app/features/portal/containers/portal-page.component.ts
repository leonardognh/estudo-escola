import { ChangeDetectionStrategy, Component, computed, effect, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { MessageService } from 'primeng/api';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { TabsModule } from 'primeng/tabs';
import { TagModule } from 'primeng/tag';

import { AuthService } from '@auth/services/auth.service';
import { PortalFacade } from '@portal/facades/portal.facade';

@Component({
  selector: 'app-portal-page',
  standalone: true,
  imports: [FormsModule, CardModule, SelectModule, TableModule, TabsModule, TagModule],
  providers: [PortalFacade],
  templateUrl: './portal-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PortalPageComponent {
  private readonly authService = inject(AuthService);
  private readonly messageService = inject(MessageService);
  protected readonly facade = inject(PortalFacade);

  protected readonly subtitulo = computed(() => {
    const user = this.authService.currentUser();
    const aluno = this.facade.aluno();
    if (!user) return '';
    if (user.role === 'responsavel' && aluno) {
      return `Acompanhamento de ${aluno.nome} (${aluno.email})`;
    }
    if (user.role === 'aluno' && aluno) {
      return `${aluno.email}`;
    }
    return 'Portal família';
  });

  constructor() {
    effect(() => {
      const user = this.authService.currentUser();
      this.facade.initFamilyContext(user);
    });
    effect(() => {
      const err = this.facade.errorMessage();
      if (err) {
        this.messageService.add({ severity: 'error', summary: 'Portal', detail: err });
      }
    });
  }

  protected onPortalAlunoChange(id: string | null): void {
    if (id) {
      this.facade.selectPortalAluno(id);
    }
  }
}
