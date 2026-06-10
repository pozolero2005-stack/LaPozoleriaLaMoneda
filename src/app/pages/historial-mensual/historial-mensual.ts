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

  async cargarYConstruirCalendario(): Promise<void> {
    const mesNum = Number(this.mesSeleccionado);
    const anioNum = Number(this.anioSeleccionado);

    if (isNaN(mesNum) || isNaN(anioNum) || mesNum < 0 || mesNum > 11) return;

    this.matrizCalendario = [];
    this.totalInversionMensual = 0;
    this.totalMermaMensual = 0;
    this.totalGananciaMensual = 0;

    const ultimoDia = new Date(anioNum, mesNum + 1, 0).getDate();
    const mesStr = (mesNum + 1).toString().padStart(2, '0');
    
    const { data: registros, error } = await this.supabaseService.supabase
      .from('cuentas_diarias')
      .select('*')
      .gte('fecha', `${anioNum}-${mesStr}-01`)
      .lte('fecha', `${anioNum}-${mesStr}-${ultimoDia}`);

    if (error) { 
      miSwal.fire({ icon: 'error', title: 'Error', text: 'No se pudieron cargar los datos.' });
      return; 
    }

    const primerDiaSemana = new Date(anioNum, mesNum, 1).getDay();
    let indiceInicioSemana = (primerDiaSemana === 0 ? 6 : primerDiaSemana - 1);
    let diasContador = 1;

    for (let i = 0; i < 6; i++) {
      const semana = [];
      for (let j = 0; j < 7; j++) {
        if ((i === 0 && j < indiceInicioSemana) || diasContador > ultimoDia) {
          semana.push({ numeroDia: null, datosFinancieros: null });
        } else {
          const fechaStr = `${anioNum}-${mesStr}-${diasContador.toString().padStart(2, '0')}`;
          const registro = registros?.find(r => r.fecha === fechaStr);

          if (registro) {
            this.totalInversionMensual += Number(registro.inversion_total || 0);
            this.totalMermaMensual += Number(registro.merma || 0);
            this.totalGananciaMensual += Number(registro.libre || 0);
          }

          semana.push({
            numeroDia: diasContador,
            fechaCompleta: fechaStr,
            datosFinancieros: registro ? {
              inversionTotal: registro.inversion_total,
              merma: registro.merma,
              libre: registro.libre
            } : null
          });
          diasContador++;
        }
      }
      this.matrizCalendario.push(semana);
      if (diasContador > ultimoDia) break;
    }
  }

  async eliminarRegistroDia(fecha: string, dia: number): Promise<void> {
    const confirmacion = await miSwal.fire({
      title: '¿Estás seguro?',
      text: `Se eliminará el registro del día ${dia}. Esta acción no se puede deshacer.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });

    if (confirmacion.isConfirmed) {
      const { error } = await this.supabaseService.supabase
        .from('cuentas_diarias')
        .delete()
        .eq('fecha', fecha);

      if (error) {
        miSwal.fire({ icon: 'error', title: 'Error', text: 'No se pudo eliminar el registro.' });
      } else {
        miSwal.fire({ icon: 'success', title: 'Eliminado', timer: 1500 });
        this.cargarYConstruirCalendario();
      }
    }
  }

  alCambiarFiltro(): void { 
    this.cargarYConstruirCalendario(); 
  }
}