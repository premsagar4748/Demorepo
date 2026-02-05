import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WashoutDetails } from './washout-details';

describe('WashoutDetails', () => {
  let component: WashoutDetails;
  let fixture: ComponentFixture<WashoutDetails>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WashoutDetails]
    })
    .compileComponents();

    fixture = TestBed.createComponent(WashoutDetails);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
