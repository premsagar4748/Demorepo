import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WashoutReport } from './washout-report';

describe('WashoutReport', () => {
  let component: WashoutReport;
  let fixture: ComponentFixture<WashoutReport>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WashoutReport]
    })
    .compileComponents();

    fixture = TestBed.createComponent(WashoutReport);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
