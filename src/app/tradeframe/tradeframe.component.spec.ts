import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TradeframeComponent } from './tradeframe.component';

describe('TradeframeComponent', () => {
  let component: TradeframeComponent;
  let fixture: ComponentFixture<TradeframeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ TradeframeComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TradeframeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
