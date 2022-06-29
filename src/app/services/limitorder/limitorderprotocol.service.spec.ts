import { TestBed } from '@angular/core/testing';

import { LimitorderprotocolService } from './limitorderprotocol.service';

describe('LimitorderprotocolService', () => {
  let service: LimitorderprotocolService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(LimitorderprotocolService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
