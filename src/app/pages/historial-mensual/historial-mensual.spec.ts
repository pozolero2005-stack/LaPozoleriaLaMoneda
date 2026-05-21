import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HistorialMensual } from './historial-mensual';

describe('HistorialMensual', () => {
  let component: HistorialMensual;
  let fixture: ComponentFixture<HistorialMensual>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HistorialMensual]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HistorialMensual);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
