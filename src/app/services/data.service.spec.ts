import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';

import { DataService } from './data.service';

describe('DataService', () => {
  let service: DataService;
  let httpTestingController: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(DataService);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should not use the hydration transfer cache for voice outs', () => {
    service.getVoiceOuts(2, 10).subscribe();

    const request = httpTestingController.expectOne(
      (req) =>
        req.url === 'https://voiceout-app.leelenardjose.workers.dev/api/getVoiceOuts' &&
        req.params.get('page') === '2' &&
        req.params.get('pageSize') === '10',
    );

    expect(request.request.transferCache).toBe(false);
    request.flush({ voice_outs: [], totalPages: 0 });
  });

  afterEach(() => {
    httpTestingController.verify();
  });
});
