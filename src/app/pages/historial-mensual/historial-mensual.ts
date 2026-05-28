import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

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
  
  // Totales acumulados del mes
  totalInversionMensual = 0;
  totalMermaMensual = 0;
  totalGananciaMensual = 0;

  ngOnInit(): void {
    const fechaActual = new Date();
    this.mesSeleccionado = fechaActual.getMonth();
    this.anioSeleccionado = fechaActual.getFullYear();

    this.cargarYConstruirCalendario();
  }

  cargarYConstruirCalendario(): void {
    const datosLocales = localStorage.getItem('historialPozol');
    const registrosDias: any[] = datosLocales ? JSON.parse(datosLocales) : [];

    this.totalInversionMensual = 0;
    this.totalMermaMensual = 0;
    this.totalGananciaMensual = 0;

    const primerDiaMes = new Date(this.anioSeleccionado, this.mesSeleccionado, 1).getDay();
    const totalDiasMes = new Date(this.anioSeleccionado, this.mesSeleccionado + 1, 0).getDate();

    // Lunes a Domingo (0=Lunes, 6=Domingo)
    let indiceInicioSemana = primerDiaMes === 0 ? 6 : primerDiaMes - 1;

    let diasContador = 1;
    const nuevasSemanas: any[][] = [];

    for (let i = 0; i < 6; i++) {
      const renglonSemana: any[] = [];
      
      for (let j = 0; j < 7; j++) {
        if ((i === 0 && j < indiceInicioSemana) || diasContador > totalDiasMes) {
          renglonSemana.push({ numeroDia: null, datosFinancieros: null, fechaCompleta: null });
        } else {
          const diaFormateado = diasContador < 10 ? `0${diasContador}` : `${diasContador}`;
          const mesFormateado = (this.mesSeleccionado + 1) < 10 ? `0${this.mesSeleccionado + 1}` : `${this.mesSeleccionado + 1}`;
          const stringFechaBuscada = `${this.anioSeleccionado}-${mesFormateado}-${diaFormateado}`;

          const cuentaEncontrada = registrosDias.find(registro => registro.fecha === stringFechaBuscada);

          if (cuentaEncontrada) {
            this.totalInversionMensual += Number(cuentaEncontrada.inversionTotal || 0);
            this.totalMermaMensual += Number(cuentaEncontrada.merma || 0);
            this.totalGananciaMensual += Number(cuentaEncontrada.libre || 0);
          }

          renglonSemana.push({
            numeroDia: diasContador,
            fechaCompleta: stringFechaBuscada,
            datosFinancieros: cuentaEncontrada ? cuentaEncontrada : null
          });
          
          diasContador++;
        }
      }
      nuevasSemanas.push(renglonSemana);
      
      if (diasContador > totalDiasMes) {
        break;
      }
    }

    this.matrizCalendario = nuevasSemanas;
  }

  // NUEVA FUNCIÓN: Permite borrar un día específico si te equivocaste o estás haciendo pruebas
  eliminarRegistroDia(fechaParaBorrar: string, numeroDia: number): void {
    const confirmacion = confirm(`¿Estás seguro de que quieres borrar el registro financiero del día ${numeroDia}? Esto no se puede deshacer.`);
    
    if (!confirmacion) return;

    const datosLocales = localStorage.getItem('historialPozol');
    if (datosLocales) {
      let registrosDias: any[] = JSON.parse(datosLocales);
      
      // Filtramos la lista dejando fuera el día que queremos eliminar
      registrosDias = registrosDias.filter(registro => registro.fecha !== fechaParaBorrar);
      
      // Guardamos la nueva lista limpia en el LocalStorage
      localStorage.setItem('historialPozol', JSON.stringify(registrosDias));
      
      // Volvemos a pintar el calendario para que desaparezcan los datos y se recalculen los totales del mes
      this.cargarYConstruirCalendario();
    }
  }

  alCambiarFiltro(): void {
    this.cargarYConstruirCalendario();
  }
}