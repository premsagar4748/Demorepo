import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ServiceopenroReport } from './serviceopenro-report';

describe('ServiceopenroReport', () => {
  let component: ServiceopenroReport;
  let fixture: ComponentFixture<ServiceopenroReport>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ServiceopenroReport]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ServiceopenroReport);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
