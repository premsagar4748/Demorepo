import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Vehicleflooring } from './vehicleflooring';

describe('Vehicleflooring', () => {
  let component: Vehicleflooring;
  let fixture: ComponentFixture<Vehicleflooring>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Vehicleflooring]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Vehicleflooring);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
