import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Packtracker } from './packtracker';

describe('Packtracker', () => {
  let component: Packtracker;
  let fixture: ComponentFixture<Packtracker>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Packtracker]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Packtracker);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
