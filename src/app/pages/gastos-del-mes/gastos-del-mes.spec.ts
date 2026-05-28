import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GastosDelMes } from './gastos-del-mes';

describe('GastosDelMes', () => {
  let component: GastosDelMes;
  let fixture: ComponentFixture<GastosDelMes>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GastosDelMes]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GastosDelMes);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
