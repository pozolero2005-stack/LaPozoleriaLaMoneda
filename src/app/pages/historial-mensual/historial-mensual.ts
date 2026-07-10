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
  customClass: { popup: 'swal-borde-amarillo' },
  didOpen: () => {
    const popup = Swal.getPopup();
    if (popup) popup.style.border = '2px solid #00ff88';
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
  
  totalVentasMensual = 0;
  totalInversionMensual = 0;
  totalMermaMensual = 0;
  totalGananciaMensual = 0;

  meses = [
    { valor: 0, nombre: 'Enero' }, { valor: 1, nombre: 'Febrero' }, { valor: 2, nombre: 'Marzo' },
    { valor: 3, nombre: 'Abril' }, { valor: 4, nombre: 'Mayo' }, { valor: 5, nombre: 'Junio' },
    { valor: 6, nombre: 'Julio' }, { valor: 7, nombre: 'Agosto' }, { valor: 8, nombre: 'Septiembre' },
    { valor: 9, nombre: 'Octubre' }, { valor: 10, nombre: 'Noviembre' }, { valor: 11, nombre: 'Diciembre' }
  ];

  // CORREGIDO: Inyectamos 'cdr' en el constructor
  constructor(private supabaseService: SupabaseService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    const hoy = new Date();
    this.mesSeleccionado = hoy.getMonth();
    this.anioSeleccionado = hoy.getFullYear();
    this.cargarYConstruirCalendario();
  }

  async cargarYConstruirCalendario(): Promise<void> {
    this.matrizCalendario = [];
    this.totalVentasMensual = 0;
    this.totalInversionMensual = 0;
    this.totalMermaMensual = 0;
    this.totalGananciaMensual = 0;

    const mesNum = Number(this.mesSeleccionado);
    const anioNum = Number(this.anioSeleccionado);

    const ultimoDia = new Date(anioNum, mesNum + 1, 0).getDate();
    const mesStr = (mesNum + 1).toString().padStart(2, '0');
    
    const { data: registros, error } = await this.supabaseService.supabase
      .from('cuenta_diaria')
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
            this.totalVentasMensual += Number(registro.venta_bruta || 0);
            this.totalInversionMensual += Number(registro.inversion_dia || 0);
            this.totalMermaMensual += Number(registro.valor_merma || 0);
            this.totalGananciaMensual += Number(registro.venta_neta_real || 0);
          }

          semana.push({
            numeroDia: diasContador,
            fechaCompleta: fechaStr,
            datosFinancieros: registro ? {
              ventasTotal: registro.venta_bruta ?? 0,
              inversionTotal: registro.inversion_dia ?? 0,
              merma: registro.valor_merma ?? 0,
              libre: registro.venta_neta_real ?? 0
            } : null
          });
          diasContador++;
        }
      }
      this.matrizCalendario.push(semana);
      if (diasContador > ultimoDia) break;
    }

    // CORREGIDO: Forzamos a la pantalla a dibujarse inmediatamente
    this.cdr.detectChanges();
  }

  async eliminarRegistroDia(fecha: string, dia: number): Promise<void> {
    const confirmacion = await miSwal.fire({
      title: '¿Estás seguro?',
      text: `Se eliminará por completo el registro del día ${dia}.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ff4a4a',
      cancelButtonColor: '#555555',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });

    if (confirmacion.isConfirmed) {
      const { error } = await this.supabaseService.supabase
        .from('cuenta_diaria')
        .delete()
        .eq('fecha', fecha);

      if (error) {
        console.error(error);
        miSwal.fire({ icon: 'error', title: 'Oops!', text: 'No se pudo borrar el registro. Revisa las políticas RLS.' });
      } else {
        miSwal.fire({ icon: 'success', title: 'Registro eliminado', timer: 1500, showConfirmButton: false });
        this.cargarYConstruirCalendario();
      }
    }
  }

  alCambiarFiltro(): void { 
    this.cargarYConstruirCalendario(); 
  }
}