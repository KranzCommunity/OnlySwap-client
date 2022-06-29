import { TestBed } from '@angular/core/testing';

import { BakeryswapServiceService } from './bakeryswap-service.service';

describe('BakeryswapServiceService', () => {
  let service: BakeryswapServiceService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(BakeryswapServiceService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
