import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ComprobantePago } from './comprobante-pago';

describe('ComprobantePago', () => {
  let component: ComprobantePago;
  let fixture: ComponentFixture<ComprobantePago>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ComprobantePago]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ComprobantePago);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
