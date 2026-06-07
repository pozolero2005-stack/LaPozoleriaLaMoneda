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
  
  meses = [
    { valor: 0, nombre: 'Enero' }, { valor: 1, nombre: 'Febrero' },
    { valor: 2, nombre: 'Marzo' }, { valor: 3, nombre: 'Abril' },
    { valor: 4, nombre: 'Mayo' }, { valor: 5, nombre: 'Junio' },
    { valor: 6, nombre: 'Julio' }, { valor: 7, nombre: 'Agosto' },
    { valor: 8, nombre: 'Septiembre' }, { valor: 9, nombre: 'Octubre' },
    { valor: 10, nombre: 'Noviembre' }, { valor: 11, nombre: 'Diciembre' }
  ];

  matrizCalendario: any[][] = [];
  
  totalInversionMensual = 0;
  totalMermaMensual = 0;
  totalGananciaMensual = 0;

  constructor(private supabaseService: SupabaseService) {}

  ngOnInit(): void {
    const fechaActual = new Date();
    this.mesSeleccionado = fechaActual.getMonth();
    this.anioSeleccionado = fechaActual.getFullYear();
    this.cargarYConstruirCalendario();
  }

  async cargarYConstruirCalendario(): Promise<void> {
    const mesStr = (this.mesSeleccionado + 1).toString().padStart(2, '0');
    const primerDia = `${this.anioSeleccionado}-${mesStr}-01`;
    const ultimoDia = `${this.anioSeleccionado}-${mesStr}-31`;

    // 1. Pedimos los datos al servidor (Supabase)
    const { data: registros, error } = await this.supabaseService.supabase
      .from('cuentas_diarias')
      .select('*')
      .gte('fecha', primerDia)
      .lte('fecha', ultimoDia);

    if (error) {
      console.error("Error al traer datos:", error);
      return;
    }

    // 2. Reiniciamos totales
    this.totalInversionMensual = 0;
    this.totalMermaMensual = 0;
    this.totalGananciaMensual = 0;

    // 3. Construcción del calendario
    const primerDiaMes = new Date(this.anioSeleccionado, this.mesSeleccionado, 1).getDay();
    const totalDiasMes = new Date(this.anioSeleccionado, this.mesSeleccionado + 1, 0).getDate();
    let indiceInicioSemana = primerDiaMes === 0 ? 6 : primerDiaMes - 1;
    let diasContador = 1;
    const nuevasSemanas: any[][] = [];

    for (let i = 0; i < 6; i++) {
      const renglonSemana: any[] = [];
      for (let j = 0; j < 7; j++) {
        if ((i === 0 && j < indiceInicioSemana) || diasContador > totalDiasMes) {
          renglonSemana.push({ numeroDia: null, datosFinancieros: null, fechaCompleta: null });
        } else {
          const diaStr = diasContador.toString().padStart(2, '0');
          const fechaBuscada = `${this.anioSeleccionado}-${mesStr}-${diaStr}`;
          const cuentaEncontrada = registros?.find(r => r.fecha === fechaBuscada);

          if (cuentaEncontrada) {
            this.totalInversionMensual += Number(cuentaEncontrada.inversion_total || 0);
            this.totalMermaMensual += Number(cuentaEncontrada.merma || 0);
            this.totalGananciaMensual += Number(cuentaEncontrada.libre || 0);
          }

          renglonSemana.push({
            numeroDia: diasContador,
            fechaCompleta: fechaBuscada,
            datosFinancieros: cuentaEncontrada || null
          });
          diasContador++;
        }
      }
      nuevasSemanas.push(renglonSemana);
      if (diasContador > totalDiasMes) break;
    }
    this.matrizCalendario = nuevasSemanas;
  }

  async eliminarRegistroDia(fechaParaBorrar: string, numeroDia: number): Promise<void> {
    const confirmacion = confirm(`¿Borrar registro del día ${numeroDia}?`);
    if (!confirmacion) return;

    // Eliminamos de Supabase
    const { error } = await this.supabaseService.supabase
      .from('cuentas_diarias')
      .delete()
      .eq('fecha', fechaParaBorrar);

    if (error) {
      alert("Error al borrar: " + error.message);
    } else {
      this.cargarYConstruirCalendario(); // Refrescamos vista
    }
  }

  alCambiarFiltro(): void {
    this.cargarYConstruirCalendario();
  }
}