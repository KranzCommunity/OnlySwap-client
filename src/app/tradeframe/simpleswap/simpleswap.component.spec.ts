import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SimpleswapComponent } from './simpleswap.component';

describe('SimpleswapComponent', () => {
  let component: SimpleswapComponent;
  let fixture: ComponentFixture<SimpleswapComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SimpleswapComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SimpleswapComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
