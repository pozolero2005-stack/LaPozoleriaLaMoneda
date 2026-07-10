import { Component, OnInit, ChangeDetectorRef } from '@angular/core'; // <-- CORREGIDO: Importamos el despertador
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SupabaseService } from '../../services/supabase';
import Swal from 'sweetalert2';

const miSwal = Swal.mixin({
  background: '#1a1a1a',
  color: '#ffffff',
  confirmButtonColor: '#00ff88',
  cancelButtonColor: '#555555',
  customClass: { popup: 'swal-borde-verde' },
  didOpen: () => {
    const popup = Swal.getPopup();
    if (popup) popup.style.border = '2px solid #00ff88';
  }
});

@Component({
  selector: 'app-balance-anual',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './balance-anual.html',
  styleUrl: './balance-anual.css'
})
export class BalanceAnual implements OnInit {
  anioSeleccionado!: number;
  mesesDelAnio: any[] = [];
  granTotalInversion = 0;
  granTotalMerma = 0;
  granTotalGanancia = 0;
  granTotalVentas = 0;

  // CORREGIDO: Inyectamos 'cdr' en el constructor
  constructor(private supabaseService: SupabaseService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.anioSeleccionado = new Date().getFullYear();
    this.calcularBalanceAnual();
  }

  async calcularBalanceAnual(): Promise<void> {
    const { data: registros, error } = await this.supabaseService.supabase
      .from('cuenta_diaria')
      .select('*')
      .gte('fecha', `${this.anioSeleccionado}-01-01`)
      .lte('fecha', `${this.anioSeleccionado}-12-31`);

    if (error) {
      miSwal.fire({ icon: 'error', title: 'Error', text: 'No pudimos cargar los datos anuales.' });
      return;
    }

    this.mesesDelAnio = Array.from({ length: 12 }, (_, i) => ({
      numeroMes: i,
      nombreMes: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'][i],
      inversion: 0,
      merma: 0,
      ganancia: 0,
      ventas: 0,
      tieneRegistros: false
    }));

    this.granTotalInversion = 0;
    this.granTotalMerma = 0;
    this.granTotalGanancia = 0;
    this.granTotalVentas = 0;

    registros?.forEach(registro => {
      const fecha = new Date(registro.fecha);
      const mesRegistro = fecha.getUTCMonth(); 

      this.mesesDelAnio[mesRegistro].ventas += Number(registro.venta_bruta || 0);
      this.mesesDelAnio[mesRegistro].inversion += Number(registro.inversion_dia || 0);
      this.mesesDelAnio[mesRegistro].merma += Number(registro.valor_merma || 0);
      this.mesesDelAnio[mesRegistro].ganancia += Number(registro.venta_neta_real || 0);
      this.mesesDelAnio[mesRegistro].tieneRegistros = true;

      this.granTotalVentas += Number(registro.venta_bruta || 0);
      this.granTotalInversion += Number(registro.inversion_dia || 0);
      this.granTotalMerma += Number(registro.valor_merma || 0);
      this.granTotalGanancia += Number(registro.venta_neta_real || 0);
    });

    // CORREGIDO: Despertamos a Angular para renderizar el balance completo de golpe
    this.cdr.detectChanges();
  }

  alCambiarAnio(): void {
    this.calcularBalanceAnual();
  }
}