import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SupabaseService } from '../../services/supabase';
import Swal from 'sweetalert2';

const miSwal = Swal.mixin({
  background: '#1a1a1a',
  color: '#ffffff',
  confirmButtonColor: 'rgb(220, 214, 35)',
  cancelButtonColor: '#555555',
  customClass: { popup: 'swal-borde-amarillo' },
  didOpen: () => {
    const popup = Swal.getPopup();
    if (popup) popup.style.border = '2px solid rgb(220, 214, 35)';
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

  constructor(private supabaseService: SupabaseService) {}

  ngOnInit(): void {
    this.anioSeleccionado = new Date().getFullYear();
    this.calcularBalanceAnual();
  }

  async calcularBalanceAnual(): Promise<void> {
    const { data: registros, error } = await this.supabaseService.obtenerBalanceAnual(this.anioSeleccionado);

    if (error) {
      miSwal.fire({
        icon: 'error',
        title: 'Error de conexión',
        text: 'No pudimos cargar los datos del año. Intenta de nuevo más tarde.',
      });
      console.error("Error al obtener balance:", error);
      return;
    }

    this.granTotalInversion = 0;
    this.granTotalMerma = 0;
    this.granTotalGanancia = 0;

    const estructuraMeses = Array.from({ length: 12 }, (_, i) => ({
      numeroMes: i,
      nombreMes: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'][i],
      inversion: 0,
      merma: 0,
      ganancia: 0,
      tieneRegistros: false
    }));

    registros?.forEach(registro => {
      const mesRegistro = new Date(registro.fecha).getMonth();
      
      estructuraMeses[mesRegistro].inversion += Number(registro.inversion_total || 0);
      estructuraMeses[mesRegistro].merma += Number(registro.merma || 0);
      estructuraMeses[mesRegistro].ganancia += Number(registro.libre || 0);
      estructuraMeses[mesRegistro].tieneRegistros = true;

      this.granTotalInversion += Number(registro.inversion_total || 0);
      this.granTotalMerma += Number(registro.merma || 0);
      this.granTotalGanancia += Number(registro.libre || 0);
    });

    this.mesesDelAnio = estructuraMeses;
  }

  alCambiarAnio(): void {
    this.calcularBalanceAnual();
  }
}