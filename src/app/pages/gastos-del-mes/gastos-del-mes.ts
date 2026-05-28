import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface GastoMes {
  id: string;
  fecha: string;
  concepto: string;
  monto: number;
  categoria: string;
}

@Component({
  selector: 'app-gastos-mensuales',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './gastos-del-mes.html',
  styleUrl: './gastos-del-mes.css'})
export class GastosDelMes implements OnInit {
  
  // Lista en memoria de los gastos
  listaGastos: GastoMes[] = [];
  
  // Variables vinculadas al formulario de registro
  nuevoConcepto: string = '';
  nuevoMonto!: number;
  nuevaCategoria: string = 'Insumos Globales';
  fechaGasto: string = '';

  // Filtro de visualización por mes y año
  mesFiltro!: number;
  anioFiltro!: number;

  categorias = ['Insumos Globales', 'Servicios (Luz/Agua/Gas)', 'Renta', 'Mantenimiento', 'Otros Gastos'];
  
  meses = [
    { valor: 0, nombre: 'Enero' }, { valor: 1, nombre: 'Febrero' }, { valor: 2, nombre: 'Marzo' },
    { valor: 3, nombre: 'Abril' }, { valor: 4, nombre: 'Mayo' }, { valor: 5, nombre: 'Junio' },
    { valor: 6, nombre: 'Julio' }, { valor: 7, nombre: 'Agosto' }, { valor: 8, nombre: 'Septiembre' },
    { valor: 9, nombre: 'Octubre' }, { valor: 10, nombre: 'Noviembre' }, { valor: 11, nombre: 'Diciembre' }
  ];

  totalGastadoMes = 0;

  ngOnInit(): void {
    const hoy = new Date();
    this.mesFiltro = hoy.getMonth();
    this.anioFiltro = hoy.getFullYear();
    
    // Inicializar la fecha del formulario con el día de hoy en formato local YYYY-MM-DD
    const dia = hoy.getDate() < 10 ? `0${hoy.getDate()}` : hoy.getDate();
    const mes = (hoy.getMonth() + 1) < 10 ? `0${hoy.getMonth() + 1}` : hoy.getMonth() + 1;
    this.fechaGasto = `${hoy.getFullYear()}-${mes}-${dia}`;

    this.cargarGastos();
  }

  cargarGastos(): void {
    const datosLocales = localStorage.getItem('gastosMensualesPozol');
    const todosLosGastos: GastoMes[] = datosLocales ? JSON.parse(datosLocales) : [];
    
    // Filtrar la lista para mostrar solo los que correspondan al mes y año seleccionados
    this.listaGastos = todosLosGastos.filter(gasto => {
      const partes = gasto.fecha.split('-'); // [YYYY, MM, DD]
      const anioGasto = parseInt(partes[0], 10);
      const mesGasto = parseInt(partes[1], 10) - 1;
      return anioGasto === this.anioFiltro && mesGasto === this.mesFiltro;
    });

    // Calcular la sumatoria de esta lista filtrada
    this.totalGastadoMes = this.listaGastos.reduce((acc, curr) => acc + Number(curr.monto || 0), 0);
  }

  agregarGasto(): void {
    if (!this.nuevoConcepto.trim() || !this.nuevoMonto || !this.fechaGasto) {
      alert('Por favor, llena todos los campos para poder registrar el gasto.');
      return;
    }

    const nuevoGasto: GastoMes = {
      id: Date.now().toString(), // Genera un ID único basado en milisegundos
      fecha: this.fechaGasto,
      concepto: this.nuevoConcepto.trim(),
      monto: Number(this.nuevoMonto),
      categoria: this.nuevaCategoria
    };

    const datosLocales = localStorage.getItem('gastosMensualesPozol');
    const todosLosGastos: GastoMes[] = datosLocales ? JSON.parse(datosLocales) : [];
    
    todosLosGastos.push(nuevoGasto);
    localStorage.setItem('gastosMensualesPozol', JSON.stringify(todosLosGastos));

    // Resetear formulario de inserción rápida
    this.nuevoConcepto = '';
    this.nuevoMonto = null!;
    
    // Recargar la tabla
    this.cargarGastos();
  }

  eliminarGasto(idGasto: string): void {
    if (!confirm('¿Seguro que deseas eliminar este gasto de la lista mensual?')) return;

    const datosLocales = localStorage.getItem('gastosMensualesPozol');
    if (datosLocales) {
      let todosLosGastos: GastoMes[] = JSON.parse(datosLocales);
      todosLosGastos = todosLosGastos.filter(g => g.id !== idGasto);
      localStorage.setItem('gastosMensualesPozol', JSON.stringify(todosLosGastos));
      this.cargarGastos();
    }
  }
}