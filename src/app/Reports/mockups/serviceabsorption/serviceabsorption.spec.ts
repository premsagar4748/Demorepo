import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Serviceabsorption } from './serviceabsorption';

describe('Serviceabsorption', () => {
  let component: Serviceabsorption;
  let fixture: ComponentFixture<Serviceabsorption>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Serviceabsorption]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Serviceabsorption);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
