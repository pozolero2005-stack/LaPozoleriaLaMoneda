import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SupabaseService } from '../../services/supabase';

@Component({
  selector: 'app-historial-mensual',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './historial-mensual.html',
  styleUrl: './historial-mensual.css'
})
export class HistorialMensual implements OnInit {
  mesSeleccionado!: number;
  anioSeleccionado!: number;
  matrizCalendario: any[][] = [];
  
  totalInversionMensual = 0;
  totalMermaMensual = 0;
  totalGananciaMensual = 0;

  meses = [
    { valor: 0, nombre: 'Enero' }, { valor: 1, nombre: 'Febrero' }, { valor: 2, nombre: 'Marzo' },
    { valor: 3, nombre: 'Abril' }, { valor: 4, nombre: 'Mayo' }, { valor: 5, nombre: 'Junio' },
    { valor: 6, nombre: 'Julio' }, { valor: 7, nombre: 'Agosto' }, { valor: 8, nombre: 'Septiembre' },
    { valor: 9, nombre: 'Octubre' }, { valor: 10, nombre: 'Noviembre' }, { valor: 11, nombre: 'Diciembre' }
  ];

  constructor(private supabaseService: SupabaseService) {}

  ngOnInit(): void {
    const fechaActual = new Date();
    this.mesSeleccionado = fechaActual.getMonth();
    this.anioSeleccionado = fechaActual.getFullYear();
    this.cargarYConstruirCalendario();
  }

  // Función para extraer solo YYYY-MM-DD
  private normalizarFecha(fecha: string): string {
    return fecha.split('T')[0];
  }

  async cargarYConstruirCalendario(): Promise<void> {
    const mesStr = (this.mesSeleccionado + 1).toString().padStart(2, '0');
    
    const { data: registros, error } = await this.supabaseService.supabase
      .from('cuentas_diarias')
      .select('*')
      .gte('fecha', `${this.anioSeleccionado}-${mesStr}-01`)
      .lte('fecha', `${this.anioSeleccionado}-${mesStr}-31`);

    if (error) { 
      console.error("Error al conectar con Supabase:", error); 
      return; 
    }

    this.totalInversionMensual = 0;
    this.totalMermaMensual = 0;
    this.totalGananciaMensual = 0;

    const primerDiaMes = new Date(this.anioSeleccionado, this.mesSeleccionado, 1).getDay();
    const totalDiasMes = new Date(this.anioSeleccionado, this.mesSeleccionado + 1, 0).getDate();
    let indiceInicioSemana = primerDiaMes === 0 ? 6 : primerDiaMes - 1;
    let diasContador = 1;
    this.matrizCalendario = [];

    for (let i = 0; i < 6; i++) {
      const renglonSemana: any[] = [];
      for (let j = 0; j < 7; j++) {
        if ((i === 0 && j < indiceInicioSemana) || diasContador > totalDiasMes) {
          renglonSemana.push({ numeroDia: null });
        } else {
          const fechaBuscada = `${this.anioSeleccionado}-${mesStr}-${diasContador.toString().padStart(2, '0')}`;
          
          // Comparamos usando la fecha normalizada para evitar errores de zona horaria
          const registro = registros?.find(r => this.normalizarFecha(r.fecha) === fechaBuscada);

          if (registro) {
            this.totalInversionMensual += Number(registro.inversion_total || 0);
            this.totalMermaMensual += Number(registro.merma || 0);
            this.totalGananciaMensual += Number(registro.libre || 0);
          }

          renglonSemana.push({
            numeroDia: diasContador,
            fechaCompleta: fechaBuscada,
            datosFinancieros: registro ? {
              inversionTotal: registro.inversion_total,
              merma: registro.merma,
              libre: registro.libre
            } : null
          });
          diasContador++;
        }
      }
      this.matrizCalendario.push(renglonSemana);
      if (diasContador > totalDiasMes) break;
    }
  }

  async eliminarRegistroDia(fecha: string, dia: number): Promise<void> {
    if (!confirm(`¿Borrar registro del día ${dia}?`)) return;
    await this.supabaseService.supabase.from('cuentas_diarias').delete().eq('fecha', fecha);
    this.cargarYConstruirCalendario();
  }

  alCambiarFiltro(): void { this.cargarYConstruirCalendario(); }
}