import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-balance-anual',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './balance-anual.html',
  styleUrl: './balance-anual.css'
})
export class BalanceAnual implements OnInit {

  anioSeleccionado!: number;
  
  // Estructura para almacenar los acumulados de cada uno de los 12 meses
  mesesDelAnio: any[] = [];

  // Totales globales de todo el año completo
  granTotalInversion = 0;
  granTotalMerma = 0;
  granTotalGanancia = 0;

  NombresMeses = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  ngOnInit(): void {
    // Inicializar de forma automática con el año en curso
    this.anioSeleccionado = new Date().getFullYear();
    this.calcularBalanceAnual();
  }

  calcularBalanceAnual(): void {
    // 1. Traer todo el historial acumulado
    const datosLocales = localStorage.getItem('historialPozol');
    const registrosDias: any[] = datosLocales ? JSON.parse(datosLocales) : [];

    // Resetear contadores anuales
    this.granTotalInversion = 0;
    this.granTotalMerma = 0;
    this.granTotalGanancia = 0;

    // 2. Inicializar la estructura vacía para los 12 meses
    const estructuraMeses = this.NombresMeses.map((nombre, indice) => {
      return {
        numeroMes: indice, // 0 = Enero, 11 = Diciembre
        nombreMes: nombre,
        inversion: 0,
        merma: 0,
        ganancia: 0,
        tieneRegistros: false
      };
    });

    // 3. Filtrar y acumular los datos que pertenezcan al año seleccionado
    registrosDias.forEach(registro => {
      // El formato de fecha guardado es ISO: "YYYY-MM-DD"
      const partesFecha = registro.fecha.split('-'); // [YYYY, MM, DD]
      const anioRegistro = parseInt(partesFecha[0], 10);
      const mesRegistro = parseInt(partesFecha[1], 10) - 1; // JS usa meses de 0 a 11

      if (anioRegistro === this.anioSeleccionado) {
        estructuraMeses[mesRegistro].inversion += Number(registro.inversionTotal || 0);
        estructuraMeses[mesRegistro].merma += Number(registro.merma || 0);
        estructuraMeses[mesRegistro].ganancia += Number(registro.libre || 0);
        estructuraMeses[mesRegistro].tieneRegistros = true;

        // Sumar al acumulado global anual
        this.granTotalInversion += Number(registro.inversionTotal || 0);
        this.granTotalMerma += Number(registro.merma || 0);
        this.granTotalGanancia += Number(registro.libre || 0);
      }
    });

    this.mesesDelAnio = estructuraMeses;
  }

  // Si cambias el año en las flechas o input, recalcula los 12 meses al instante
  alCambiarAnio(): void {
    this.calcularBalanceAnual();
  }
}