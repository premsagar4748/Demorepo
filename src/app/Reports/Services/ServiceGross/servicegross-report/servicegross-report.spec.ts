import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ServicegrossReport } from './servicegross-report';

describe('ServicegrossReport', () => {
  let component: ServicegrossReport;
  let fixture: ComponentFixture<ServicegrossReport>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ServicegrossReport]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ServicegrossReport);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
