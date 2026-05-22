import { Component, OnInit } from '@angular/core';
// 1. Importamos las herramientas esenciales de formularios reactivos
import { FormGroup, FormControl, Validators, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-cuenta-del-dia',
  standalone: true,
  // Aseguramos que el módulo esté inyectado en este componente autónomo
  imports: [ReactiveFormsModule], 
  templateUrl: './cuenta-del-dia.html',
  styleUrl: './cuenta-del-dia.css'
})
export class CuentaDelDia implements OnInit {
  
  // 1. Declaración de la variable maestra del formulario
  formularioFinanciero!: FormGroup;

  ngOnInit(): void {
    // 2. Definición del plano del formulario con sus valores iniciales y validaciones
    this.formularioFinanciero = new FormGroup({
      fecha: new FormControl('', [Validators.required]),
      inversion: new FormControl(0, [Validators.required, Validators.min(0)]),
      merma: new FormControl(0, [Validators.required, Validators.min(0)]),
      ventaEfectivo: new FormControl(0, [Validators.required, Validators.min(0)]),
      ventaElectronica: new FormControl(0, [Validators.required, Validators.min(0)]),
      cajaInicial: new FormControl(0, [Validators.required, Validators.min(0)]),
      
      // El campo 'libre' nace explícitamente deshabilitado
      libre: new FormControl({ value: 0, disabled: true })
    });

    // 3. Configuración del "escuchador" reactivo para detectar cambios en tiempo real
    this.formularioFinanciero.valueChanges.subscribe(() => {
      this.calcularGananciaLimpia();
    });
  }

  // 4. Función de cálculo automático (La Calculadora del Negocio)
  calcularGananciaLimpia(): void {
    // Recuperamos todos los valores (incluyendo el campo deshabilitado 'libre')
    const valores = this.formularioFinanciero.getRawValue();

    // Forzamos el tipado estricto convirtiendo las entradas web a tipo Number
    const inversion = Number(valores.inversion);
    const merma = Number(valores.merma);
    const ventaEfectivo = Number(valores.ventaEfectivo);
    const ventaElectronica = Number(valores.ventaElectronica);
    const cajaInicial = Number(valores.cajaInicial);

    // Aplicamos tus reglas de negocio:
    // Restamos el dinero base de cambio a las ventas físicas para conocer la venta neta en efectivo
    const ventaEfectivoReal = ventaEfectivo - cajaInicial; 
    const ingresosTotales = ventaEfectivoReal + ventaElectronica;

    // Balance final de las ganancias del día
    const resultadoLibre = ingresosTotales - inversion - merma;

    // Inyectamos el resultado formateado estrictamente a dos decimales
    // 'emitEvent: false' es vital para evitar que el formulario se vuelva a escuchar a sí mismo y se cicle
    this.formularioFinanciero.patchValue({
      libre: Number(resultadoLibre.toFixed(2))
    }, { emitEvent: false });
  }

  // 5. Función de persistencia para guardar los datos en el LocalStorage
  guardarDia(): void {
    // Verificación de seguridad: si faltan datos obligatorios, frenamos el guardado
    if (this.formularioFinanciero.invalid) {
      alert('Por favor, llena todos los campos correctamente con valores válidos.');
      return;
    }

    // Extraemos la información del formulario
    const nuevoRegistro = this.formularioFinanciero.getRawValue();

    // LEER: Intentamos recuperar el historial existente en LocalStorage
    const datosLocales = localStorage.getItem('historialPozol');
    
    // VALIDACIÓN DE ESTADO VACÍO: Si devuelve null, inicializamos un array vacío []
    let listaDias: any[] = datosLocales ? JSON.parse(datosLocales) : [];

    // VALIDACIÓN DE EXISTENCIA: Evitamos registrar dos veces la misma jornada
    const fechaExiste = listaDias.some(dia => dia.fecha === nuevoRegistro.fecha);

    if (fechaExiste) {
      alert('Esta fecha ya se encuentra registrada en el sistema. Utiliza la opción de Modificar si deseas editarla.');
      return; 
    }

    // CREAR: Añadimos el nuevo objeto de la jornada al array
    listaDias.push(nuevoRegistro);

    // SERIALIZAR: Transformamos el array actualizado a formato de texto plano y lo guardamos
    localStorage.setItem('historialPozol', JSON.stringify(listaDias));

    alert('¡Jornada financiera guardada con éxito!');
    
    // LIMPIAR: Reseteamos el formulario a su estado original para el día siguiente
    this.formularioFinanciero.reset({
      fecha: '',
      inversion: 0,
      merma: 0,
      ventaEfectivo: 0,
      ventaElectronica: 0,
      cajaInicial: 0,
      libre: 0
    });
  }
}
