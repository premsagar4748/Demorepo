import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PartsDetails } from './parts-details';

describe('PartsDetails', () => {
  let component: PartsDetails;
  let fixture: ComponentFixture<PartsDetails>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PartsDetails]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PartsDetails);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
