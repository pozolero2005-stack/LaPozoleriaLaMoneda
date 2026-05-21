import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BalanceAnual } from './balance-anual';

describe('BalanceAnual', () => {
  let component: BalanceAnual;
  let fixture: ComponentFixture<BalanceAnual>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BalanceAnual]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BalanceAnual);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
