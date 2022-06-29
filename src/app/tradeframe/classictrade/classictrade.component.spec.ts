import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ClassictradeComponent } from './classictrade.component';

describe('ClassictradeComponent', () => {
  let component: ClassictradeComponent;
  let fixture: ComponentFixture<ClassictradeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ClassictradeComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ClassictradeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
