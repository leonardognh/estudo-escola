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
      description: 'Confira horarios e planejamento antes das aulas para evitar conflitos.',
      links: [
        { label: 'Ir para Horarios', path: '/horarios-aulas' },
        { label: 'Ir para Calendario', path: '/calendario' },
      ],
    },
    {
      title: '2. Lance presencas por aula',
      description: 'Registre a frequencia no dia da aula e acompanhe o consolidado semanal.',
      links: [{ label: 'Ir para Presencas', path: '/presencas' }],
    },
    {
      title: '3. Cadastre atividades e avaliacoes',
      description: 'Organize evidencias por aluno, materia e periodo para gerar notas com seguranca.',
      links: [
        { label: 'Ir para Atividades', path: '/atividades' },
        { label: 'Ir para Notas', path: '/notas' },
      ],
    },
    {
      title: '4. Acompanhe progresso academico',
      description: 'Use filtros do boletim para comparar desempenho por aluno e bimestre.',
      links: [{ label: 'Ir para Boletim', path: '/notas' }],
    },
  ];
}
