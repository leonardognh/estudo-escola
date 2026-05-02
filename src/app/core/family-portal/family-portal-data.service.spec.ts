import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';

import { FamilyPortalDataService } from './family-portal-data.service';

describe('FamilyPortalDataService', () => {
  let service: FamilyPortalDataService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [FamilyPortalDataService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(FamilyPortalDataService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('loadResponsavelComOpcoesAlunos maps alunosIds to options with nome', (done) => {
    service.loadResponsavelComOpcoesAlunos('r1').subscribe((result) => {
      expect(result.responsavel?.id).toBe('r1');
      expect(result.alunosOptions).toEqual([
        { label: 'Ana', value: 'a1' },
        { label: 'Bruno', value: 'a2' },
      ]);
      done();
    });

    httpMock.expectOne('http://localhost:3000/responsaveis').flush([
      { id: 'r1', nome: 'Pai', email: 'p@x.com', telefone: '1', alunosIds: ['a1', 'a2'] },
    ]);
    httpMock.expectOne('http://localhost:3000/alunos').flush([
      { id: 'a1', nome: 'Ana' },
      { id: 'a2', nome: 'Bruno' },
    ]);
  });

  it('returns empty options when responsavel has no alunosIds', (done) => {
    service.loadResponsavelComOpcoesAlunos('r2').subscribe((result) => {
      expect(result.responsavel?.id).toBe('r2');
      expect(result.alunosOptions).toEqual([]);
      done();
    });

    httpMock.expectOne('http://localhost:3000/responsaveis').flush([
      { id: 'r2', nome: 'Mae', email: 'm@x.com', telefone: '2', alunosIds: [] },
    ]);
    httpMock.expectOne('http://localhost:3000/alunos').flush([{ id: 'a1', nome: 'Ana' }]);
  });

  it('uses id as label fallback when aluno nome missing', (done) => {
    service.loadResponsavelComOpcoesAlunos('r1').subscribe((result) => {
      expect(result.alunosOptions).toEqual([{ label: 'a99', value: 'a99' }]);
      done();
    });

    httpMock.expectOne('http://localhost:3000/responsaveis').flush([
      { id: 'r1', nome: 'Pai', email: 'p@x.com', telefone: '1', alunosIds: ['a99'] },
    ]);
    httpMock.expectOne('http://localhost:3000/alunos').flush([{ id: 'a1', nome: 'Ana' }]);
  });

  it('returns null responsavel when id not found', (done) => {
    service.loadResponsavelComOpcoesAlunos('missing').subscribe((result) => {
      expect(result.responsavel).toBeNull();
      expect(result.alunosOptions).toEqual([]);
      done();
    });

    httpMock.expectOne('http://localhost:3000/responsaveis').flush([]);
    httpMock.expectOne('http://localhost:3000/alunos').flush([]);
  });
});
