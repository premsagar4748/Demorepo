import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Finreconciliation } from './finreconciliation';

describe('Finreconciliation', () => {
  let component: Finreconciliation;
  let fixture: ComponentFixture<Finreconciliation>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Finreconciliation]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Finreconciliation);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
