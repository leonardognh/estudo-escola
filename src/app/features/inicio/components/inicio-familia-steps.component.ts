import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';

@Component({
  selector: 'app-inicio-familia-steps',
  standalone: true,
  imports: [RouterLink, CardModule, ButtonModule],
  templateUrl: './inicio-familia-steps.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InicioFamiliaStepsComponent {
  protected readonly steps = [
    {
      title: '1. Portal família',
      description: 'Veja boletim, presenças, agenda semanal e atividades do aluno vinculado à sua conta.',
      links: [{ label: 'Abrir portal', path: '/portal' }],
    },
    {
      title: '2. Boletim e frequência',
      description: 'Acompanhe notas por bimestre e o registro de presenças nas aulas.',
      links: [{ label: 'Ir ao portal (aba Boletim)', path: '/portal' }],
    },
    {
      title: '3. Próximos passos',
      description: 'Em breve: comunicados da escola, ocorrências e confirmação de leitura.',
      links: [] as { label: string; path: string }[],
    },
  ];
}
