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
    // 1. Llamada al servidor en lugar de localStorage
    const { data: registros, error } = await this.supabaseService.obtenerBalanceAnual(this.anioSeleccionado);

    if (error) {
      console.error("Error al obtener balance:", error);
      return;
    }

    // 2. Reiniciar contadores
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

    // 3. Procesar datos (Recibimos solo los del año solicitado)
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