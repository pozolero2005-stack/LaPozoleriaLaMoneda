import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CuentaDelDia } from './cuenta-del-dia';

describe('CuentaDelDia', () => {
  let component: CuentaDelDia;
  let fixture: ComponentFixture<CuentaDelDia>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CuentaDelDia]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CuentaDelDia);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
