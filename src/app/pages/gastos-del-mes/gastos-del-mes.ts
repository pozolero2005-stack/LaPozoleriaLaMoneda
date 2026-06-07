import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SupabaseService } from '../../services/supabase';

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
  idDelaCuentaActual: string = '14919aba-51d8-49ee-b72b-c9b6c9f0c494';
  
  mesFiltro!: number;
  anioFiltro!: number;
  
  // Variables para la comparativa financiera
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
  // Esta línea calcula la fecha exacta en tu zona horaria local
  const fechaLocal = new Date(hoy.getTime() - (hoy.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
  
  this.mesFiltro = hoy.getMonth();
  this.anioFiltro = hoy.getFullYear();
  this.fechaGasto = fechaLocal; // Ahora siempre será la fecha correcta
  this.cargarGastos();
}

  async cargarGastos(): Promise<void> {
    // Usamos nuestra nueva función unificada
    const { cuentas, gastos } = await this.supabaseService.obtenerDatosComparativos(this.mesFiltro, this.anioFiltro);
    
    this.listaGastos = gastos;
    this.totalGastadoMes = this.listaGastos.reduce((acc, curr) => acc + Number(curr.costo || 0), 0);
    
    // Sumamos la ganancia "libre" del negocio
    this.totalGananciaNegocio = cuentas.reduce((acc, curr) => acc + Number(curr.libre || 0), 0);
    
    // Balance Real
    this.balanceFinal = this.totalGananciaNegocio - this.totalGastadoMes;
  }

  async agregarGasto(): Promise<void> {
    if (!this.nuevoConcepto.trim() || this.nuevoMonto <= 0) {
      alert('Llena los campos correctamente.');
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
      alert("Error al guardar: " + error.message);
    } else {
      this.nuevoConcepto = '';
      this.nuevoMonto = 0;
      this.cargarGastos(); // Recarga y actualiza el balance automáticamente
    }
  }

  async eliminarGasto(id: string): Promise<void> {
    if (!confirm('¿Seguro que deseas eliminar este gasto?')) return;
    const { error } = await this.supabaseService.eliminarGasto(id);
    if (!error) this.cargarGastos();
  }
}