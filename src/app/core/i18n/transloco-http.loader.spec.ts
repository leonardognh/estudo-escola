import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';

import { TranslocoHttpLoader } from './transloco-http.loader';

describe('TranslocoHttpLoader', () => {
  let loader: TranslocoHttpLoader;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [TranslocoHttpLoader, provideHttpClient(), provideHttpClientTesting()],
    });
    loader = TestBed.inject(TranslocoHttpLoader);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('fetches translation file for lang', (done) => {
    loader.getTranslation('pt-BR').subscribe((t) => {
      expect(t).toEqual({ app: { title: 'Escola' } });
      done();
    });

    const req = httpMock.expectOne('i18n/pt-BR.json');
    expect(req.request.method).toBe('GET');
    req.flush({ app: { title: 'Escola' } });
  });

  it('fetches en.json path for english', (done) => {
    loader.getTranslation('en').subscribe((t) => {
      expect(t).toEqual({});
      done();
    });

    httpMock.expectOne('i18n/en.json').flush({});
  });
});
