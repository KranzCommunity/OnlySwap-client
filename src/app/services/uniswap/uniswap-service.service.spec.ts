import { TestBed } from '@angular/core/testing';

import { UniswapServiceService } from './uniswap-service.service';

describe('UniswapServiceService', () => {
  let service: UniswapServiceService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(UniswapServiceService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
