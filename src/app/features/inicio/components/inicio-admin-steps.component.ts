import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';

@Component({
  selector: 'app-inicio-admin-steps',
  standalone: true,
  imports: [RouterLink, CardModule, ButtonModule],
  templateUrl: './inicio-admin-steps.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InicioAdminStepsComponent {
  protected readonly steps = [
    {
      title: '1. Cadastre as bases da escola',
      description: 'Comece por Periodos e Materias para preparar a estrutura inicial da escola.',
      links: [
        { label: 'Ir para Periodos', path: '/periodos' },
        { label: 'Ir para Materias', path: '/materias' },
      ],
    },
    {
      title: '2. Defina equipe e turmas',
      description: 'Cadastre Professores, Alunos e Turmas. Em Turmas, vincule periodo e alunos.',
      links: [
        { label: 'Ir para Professores', path: '/professores' },
        { label: 'Ir para Alunos', path: '/alunos' },
        { label: 'Ir para Turmas', path: '/turmas' },
      ],
    },
    {
      title: '3. Monte o curriculo por ano',
      description:
        'Use Materias por ano para definir materias, carga horaria e professores por ano letivo.',
      links: [{ label: 'Ir para Materias por ano', path: '/materias-ano' }],
    },
    {
      title: '4. Organize horarios e avaliacoes',
      description:
        'Cadastre Horarios de aula, monitore Presencas e acompanhe Notas e Atividades por turma.',
      links: [
        { label: 'Ir para Horarios', path: '/horarios-aulas' },
        { label: 'Ir para Presencas', path: '/presencas' },
        { label: 'Ir para Notas', path: '/notas' },
      ],
    },
    {
      title: '5. Acompanhe no Calendario e ajuste regras',
      description:
        'Use o Calendario para visao consolidada e Configuracoes para governanca da escola.',
      links: [
        { label: 'Ir para Calendario', path: '/calendario' },
        { label: 'Ir para Configuracoes', path: '/configuracoes' },
      ],
    },
  ];
}
