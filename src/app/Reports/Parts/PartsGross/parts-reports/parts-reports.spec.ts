import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PartsReports } from './parts-reports';

describe('PartsReports', () => {
  let component: PartsReports;
  let fixture: ComponentFixture<PartsReports>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PartsReports]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PartsReports);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
