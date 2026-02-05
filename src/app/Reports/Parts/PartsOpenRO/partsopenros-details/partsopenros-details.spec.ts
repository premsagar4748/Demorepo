import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PartsopenrosDetails } from './partsopenros-details';

describe('PartsopenrosDetails', () => {
  let component: PartsopenrosDetails;
  let fixture: ComponentFixture<PartsopenrosDetails>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PartsopenrosDetails]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PartsopenrosDetails);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
