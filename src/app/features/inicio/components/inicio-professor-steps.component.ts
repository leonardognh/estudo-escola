import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';

@Component({
  selector: 'app-inicio-professor-steps',
  standalone: true,
  imports: [RouterLink, CardModule, ButtonModule],
  templateUrl: './inicio-professor-steps.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InicioProfessorStepsComponent {
  protected readonly steps = [
    {
      title: '1. Consulte sua agenda da semana',
      description: 'Confira horários e planejamento antes das aulas para evitar conflitos.',
      links: [
        { label: 'Ir para Horários', path: '/horarios-aulas' },
        { label: 'Ir para Calendário', path: '/calendario' },
      ],
    },
    {
      title: '2. Lance presenças por aula',
      description: 'Registre a frequência no dia da aula e acompanhe o consolidado semanal.',
      links: [{ label: 'Ir para Presenças', path: '/presencas' }],
    },
    {
      title: '3. Cadastre atividades e avaliações',
      description: 'Organize evidências por aluno, matéria e período para gerar notas com segurança.',
      links: [
        { label: 'Ir para Atividades', path: '/atividades' },
        { label: 'Ir para Notas', path: '/notas' },
      ],
    },
    {
      title: '4. Acompanhe progresso acadêmico',
      description: 'Use filtros do boletim para comparar desempenho por aluno e bimestre.',
      links: [{ label: 'Ir para Boletim', path: '/notas' }],
    },
  ];
}
