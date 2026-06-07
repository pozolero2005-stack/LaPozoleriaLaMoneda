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
  
  mesFiltro!: number;
  anioFiltro!: number;

  categorias = ['Insumos Globales', 'Servicios (Luz/Agua/Gas)', 'Renta', 'Mantenimiento', 'Otros Gastos'];
  
  // ESTO ES LO QUE TE FALTABA
  meses = [
    { valor: 0, nombre: 'Enero' }, { valor: 1, nombre: 'Febrero' }, { valor: 2, nombre: 'Marzo' },
    { valor: 3, nombre: 'Abril' }, { valor: 4, nombre: 'Mayo' }, { valor: 5, nombre: 'Junio' },
    { valor: 6, nombre: 'Julio' }, { valor: 7, nombre: 'Agosto' }, { valor: 8, nombre: 'Septiembre' },
    { valor: 9, nombre: 'Octubre' }, { valor: 10, nombre: 'Noviembre' }, { valor: 11, nombre: 'Diciembre' }
  ];

  totalGastadoMes = 0;

  constructor(private supabaseService: SupabaseService) {}

  ngOnInit(): void {
    const hoy = new Date();
    this.mesFiltro = hoy.getMonth();
    this.anioFiltro = hoy.getFullYear();
    this.fechaGasto = hoy.toISOString().split('T')[0];
    this.cargarGastos();
  }

  async cargarGastos(): Promise<void> {
    const { data, error } = await this.supabaseService.obtenerGastosPorMes(this.mesFiltro, this.anioFiltro);
    if (error) {
      console.error("Error al traer gastos:", error);
      return;
    }
    this.listaGastos = data || [];
    this.totalGastadoMes = this.listaGastos.reduce((acc, curr) => acc + Number(curr.costo || 0), 0);
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
      categoria: this.nuevaCategoria
    };

    const { error } = await this.supabaseService.registrarGasto(nuevoGasto);
    if (error) {
      alert("Error al guardar: " + error.message);
    } else {
      this.nuevoConcepto = '';
      this.nuevoMonto = 0;
      this.cargarGastos();
    }
  }

  async eliminarGasto(id: string): Promise<void> {
    if (!confirm('¿Seguro que deseas eliminar este gasto?')) return;
    const { error } = await this.supabaseService.eliminarGasto(id);
    if (!error) this.cargarGastos();
  }
}