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
  selector: 'app-gastos-mensuales',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './gastos-del-mes.html',
  styleUrl: './gastos-del-mes.css'
})
export class GastosDelMes implements OnInit {
  listaGastos: any[] = [];
  nuevoConcepto: string = '';
  nuevoMonto: number = 0;
  nuevaCategoria: string = 'Insumos Globales';
  fechaGasto: string = '';
  idDelaCuentaActual: string = '96b4a104-7414-4cb4-8405-93200e943ce3';
  
  mesFiltro!: number;
  anioFiltro!: number;
  
  totalGastadoMes = 0;
  totalGananciaNegocio = 0;
  balanceFinal = 0;

  categorias = ['Insumos Globales', 'Servicios (Luz/Agua/Gas)', 'Renta', 'Mantenimiento', 'Otros Gastos'];
  
  meses = [
    { valor: 0, nombre: 'Enero' }, { valor: 1, nombre: 'Febrero' }, { valor: 2, nombre: 'Marzo' },
    { valor: 3, nombre: 'Abril' }, { valor: 4, nombre: 'Mayo' }, { valor: 5, nombre: 'Junio' },
    { valor: 6, nombre: 'Julio' }, { valor: 7, nombre: 'Agosto' }, { valor: 8, nombre: 'Septiembre' },
    { valor: 9, nombre: 'Octubre' }, { valor: 10, nombre: 'Noviembre' }, { valor: 11, nombre: 'Diciembre' }
  ];

  constructor(private supabaseService: SupabaseService) {}

  ngOnInit(): void {
    const hoy = new Date();
    const fechaLocal = new Date(hoy.getTime() - (hoy.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
    
    this.mesFiltro = hoy.getMonth();
    this.anioFiltro = hoy.getFullYear();
    this.fechaGasto = fechaLocal;
    this.cargarGastos();
  }

  async cargarGastos(): Promise<void> {
    const { cuentas, gastos } = await this.supabaseService.obtenerDatosComparativos(this.mesFiltro, this.anioFiltro);
    
    this.listaGastos = gastos;
    this.totalGastadoMes = this.listaGastos.reduce((acc, curr) => acc + Number(curr.costo || 0), 0);
    this.totalGananciaNegocio = cuentas.reduce((acc, curr) => acc + Number(curr.libre || 0), 0);
    this.balanceFinal = this.totalGananciaNegocio - this.totalGastadoMes;
  }

  async agregarGasto(): Promise<void> {
    if (!this.nuevoConcepto.trim() || this.nuevoMonto <= 0) {
      miSwal.fire({
        icon: 'warning',
        title: 'Campos incompletos',
        text: 'Por favor, asegúrate de llenar el concepto y el monto correctamente.'
      });
      return;
    }

    const nuevoGasto = {
      fecha: this.fechaGasto,
      concepto: this.nuevoConcepto.trim(),
      costo: this.nuevoMonto,
      categoria: this.nuevaCategoria,
      cuenta_id: this.idDelaCuentaActual
    };

    const { error } = await this.supabaseService.registrarGasto(nuevoGasto);
    if (error) {
      miSwal.fire({
        icon: 'error',
        title: 'Error al guardar',
        text: error.message
      });
    } else {
      this.nuevoConcepto = '';
      this.nuevoMonto = 0;
      this.cargarGastos();
      miSwal.fire({
        icon: 'success',
        title: '¡Gasto guardado!',
        timer: 1000,
        showConfirmButton: false
      });
    }
  }

  async eliminarGasto(id: string): Promise<void> {
    const result = await miSwal.fire({
      title: '¿Estás seguro?',
      text: "Esta acción no se puede deshacer",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      const { error } = await this.supabaseService.eliminarGasto(id);
      if (!error) {
        this.cargarGastos();
        miSwal.fire('Eliminado', 'El gasto ha sido borrado.', 'success');
      }
    }
  }
}