import { TestBed } from '@angular/core/testing';

import { SushiswapServiceService } from './sushiswap-service.service';

describe('SushiswapServiceService', () => {
  let service: SushiswapServiceService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SushiswapServiceService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
