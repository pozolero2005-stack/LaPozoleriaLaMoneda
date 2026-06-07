import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SupabaseService } from '../../services/supabase';

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
      console.error("Error al obtener balance:", error);
      return;
    }

    // 1. Resetear contadores y estructura
    this.granTotalInversion = 0;
    this.granTotalMerma = 0;
    this.granTotalGanancia = 0;

    this.mesesDelAnio = Array.from({ length: 12 }, (_, i) => ({
      numeroMes: i,
      nombreMes: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'][i],
      inversion: 0,
      merma: 0,
      ganancia: 0,
      tieneRegistros: false
    }));

    // 2. Procesar datos usando split para evitar errores de zona horaria
    registros?.forEach(registro => {
      // registro.fecha viene como "YYYY-MM-DD"
      const [anio, mes, dia] = registro.fecha.split('-').map(Number);
      const mesIndex = mes - 1; // Convertir a índice 0-11
      
      const mesActual = this.mesesDelAnio[mesIndex];
      
      mesActual.inversion += Number(registro.inversion_total || 0);
      mesActual.merma += Number(registro.merma || 0);
      mesActual.ganancia += Number(registro.libre || 0);
      mesActual.tieneRegistros = true;

      this.granTotalInversion += Number(registro.inversion_total || 0);
      this.granTotalMerma += Number(registro.merma || 0);
      this.granTotalGanancia += Number(registro.libre || 0);
    });
  }

  alCambiarAnio(): void {
    this.calcularBalanceAnual();
  }
}