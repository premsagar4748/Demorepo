import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Buyerranking } from './buyerranking';

describe('Buyerranking', () => {
  let component: Buyerranking;
  let fixture: ComponentFixture<Buyerranking>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Buyerranking]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Buyerranking);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
