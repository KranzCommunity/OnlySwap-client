import { TestBed } from '@angular/core/testing';

import { PancakeswapServiceService } from './pancakeswap-service.service';

describe('PancakeswapServiceService', () => {
  let service: PancakeswapServiceService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PancakeswapServiceService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
