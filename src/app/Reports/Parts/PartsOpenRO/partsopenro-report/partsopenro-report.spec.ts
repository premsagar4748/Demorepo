import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PartsopenroReport } from './partsopenro-report';

describe('PartsopenroReport', () => {
  let component: PartsopenroReport;
  let fixture: ComponentFixture<PartsopenroReport>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PartsopenroReport]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PartsopenroReport);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
