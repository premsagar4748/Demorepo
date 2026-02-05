import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Salestax } from './salestax';

describe('Salestax', () => {
  let component: Salestax;
  let fixture: ComponentFixture<Salestax>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Salestax]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Salestax);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
