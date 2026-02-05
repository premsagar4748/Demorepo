import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ServiceopenroDetails } from './serviceopenro-details';

describe('ServiceopenroDetails', () => {
  let component: ServiceopenroDetails;
  let fixture: ComponentFixture<ServiceopenroDetails>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ServiceopenroDetails]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ServiceopenroDetails);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
