const { createCjsPreset } = require('jest-preset-angular/presets');

/** @type {import('jest').Config} */
module.exports = {
  ...createCjsPreset(),
  transformIgnorePatterns: [
    'node_modules/(?!(.*\\.mjs$|@angular/common/locales/.*\\.js$|@jsverse/.*))',
  ],
  setupFilesAfterEnv: ['<rootDir>/setup-jest.ts'],
  testPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/dist/',
    '<rootDir>/src/unit/',
  ],
  moduleNameMapper: {
    '^@app/(.*)$': '<rootDir>/src/app/$1',
    '^@auth/(.*)$': '<rootDir>/src/app/core/auth/$1',
    '^@shared/(.*)$': '<rootDir>/src/app/shared/$1',
    '^@alunos/(.*)$': '<rootDir>/src/app/features/alunos/$1',
    '^@responsaveis/(.*)$': '<rootDir>/src/app/features/responsaveis/$1',
    '^@professores/(.*)$': '<rootDir>/src/app/features/professores/$1',
    '^@materias/(.*)$': '<rootDir>/src/app/features/materias/$1',
    '^@materias-ano/(.*)$': '<rootDir>/src/app/features/materias-ano/$1',
    '^@turmas/(.*)$': '<rootDir>/src/app/features/turmas/$1',
    '^@periodos/(.*)$': '<rootDir>/src/app/features/periodos/$1',
    '^@horarios/(.*)$': '<rootDir>/src/app/features/horarios-aulas/$1',
    '^@calendario/(.*)$': '<rootDir>/src/app/features/calendario/$1',
    '^@notas/(.*)$': '<rootDir>/src/app/features/notas/$1',
    '^@presencas/(.*)$': '<rootDir>/src/app/features/presencas/$1',
    '^@inicio/(.*)$': '<rootDir>/src/app/features/inicio/$1',
    '^@atividades/(.*)$': '<rootDir>/src/app/features/atividades/$1',
    '^@configuracoes/(.*)$': '<rootDir>/src/app/features/configuracoes/$1',
    '^@intervencoes/(.*)$': '<rootDir>/src/app/features/intervencoes/$1',
    '^@riscos/(.*)$': '<rootDir>/src/app/features/riscos/$1',
    '^@painel-executivo/(.*)$': '<rootDir>/src/app/features/painel-executivo/$1',
    '^@portal/(.*)$': '<rootDir>/src/app/features/portal/$1',
  },
  collectCoverageFrom: [
    'src/app/core/family-portal/**/*.ts',
    'src/app/core/i18n/**/*.ts',
  ],
  coveragePathIgnorePatterns: ['\\.spec\\.ts$'],
  coverageThreshold: {
    global: {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90,
    },
  },
};
