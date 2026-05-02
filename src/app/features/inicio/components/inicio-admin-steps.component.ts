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
      description: 'Comece por Períodos e Matérias para preparar a estrutura inicial da escola.',
      links: [
        { label: 'Ir para Períodos', path: '/periodos' },
        { label: 'Ir para Matérias', path: '/materias' },
      ],
    },
    {
      title: '2. Defina equipe e turmas',
      description: 'Cadastre Professores, Alunos e Turmas. Em Turmas, vincule período e alunos.',
      links: [
        { label: 'Ir para Professores', path: '/professores' },
        { label: 'Ir para Alunos', path: '/alunos' },
        { label: 'Ir para Turmas', path: '/turmas' },
      ],
    },
    {
      title: '3. Monte o currículo por ano',
      description:
        'Use Matérias por ano para definir matérias, carga horária e professores por ano letivo.',
      links: [{ label: 'Ir para Matérias por ano', path: '/materias-ano' }],
    },
    {
      title: '4. Organize horários e avaliações',
      description:
        'Cadastre Horários de aula, monitore Presenças e acompanhe Notas e Atividades por turma.',
      links: [
        { label: 'Ir para Horários', path: '/horarios-aulas' },
        { label: 'Ir para Presenças', path: '/presencas' },
        { label: 'Ir para Notas', path: '/notas' },
      ],
    },
    {
      title: '5. Acompanhe no Calendário e ajuste regras',
      description:
        'Use o Calendário para visão consolidada e Configurações para governança da escola.',
      links: [
        { label: 'Ir para Calendário', path: '/calendario' },
        { label: 'Ir para Configurações', path: '/configuracoes' },
      ],
    },
  ];
}
