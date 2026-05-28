import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators, FormArray, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-cuenta-del-dia',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './cuenta-del-dia.html',
  styleUrl: './cuenta-del-dia.css'
})
export class CuentaDelDia implements OnInit {
  
  formularioFinanciero!: FormGroup;

  ngOnInit(): void {
    // REGLA DE NEGOCIO: Cargamos los precios base de los 3 productos desde el LocalStorage.
    // Si no existen en la memoria, asignamos precios sugeridos por defecto (35, 40 y 30).
    const preciosGuardados = localStorage.getItem('preciosBasePozol');
    const precios = preciosGuardados ? JSON.parse(preciosGuardados) : { cacao: 35, cacahuate: 40, blanco: 30 };

    this.formularioFinanciero = new FormGroup({
      fecha: new FormControl('', [Validators.required]),
      
      // PRODUCTO 1: CACAO
      vasosCacao: new FormControl(0, [Validators.required, Validators.min(0)]),
      precioCacao: new FormControl(precios.cacao, [Validators.required, Validators.min(0)]),
      
      // PRODUCTO 2: CACAHUATE
      vasosCacahuate: new FormControl(0, [Validators.required, Validators.min(0)]),
      precioCacahuate: new FormControl(precios.cacahuate, [Validators.required, Validators.min(0)]),
      
      // PRODUCTO 3: BLANCO
      vasosBlanco: new FormControl(0, [Validators.required, Validators.min(0)]),
      precioBlanco: new FormControl(precios.blanco, [Validators.required, Validators.min(0)]),
      
      // OTRAS VENTAS DIGITALES
      ventaElectronica: new FormControl(0, [Validators.required, Validators.min(0)]),
      
      // TABLA DINÁMICA DE INSUMOS
      listaGastos: new FormArray([]),
      
      // MERMA Y LOGÍSTICA
      merma: new FormControl(0, [Validators.required, Validators.min(0)]),
      cajaInicial: new FormControl(0, [Validators.required, Validators.min(0)]),
      
      // TOTALES AUTOMÁTICOS
      inversionTotal: new FormControl({ value: 0, disabled: true }),
      ventaBruta: new FormControl({ value: 0, disabled: true }),
      libre: new FormControl({ value: 0, disabled: true })
    });

    this.anadirGasto();

    // Escuchador reactivo para volver a calcular el balance con cada tecla que presiones
    this.formularioFinanciero.valueChanges.subscribe(() => {
      this.realizarCalculosDelDia();
    });
  }

  // FUNCIÓN PARA FIJAR LOS PRECIOS ACTUALES DE LOS 3 PRODUCTOS DE FORMA PERMANENTE
  actualizarPreciosBase(): void {
    const vals = this.formularioFinanciero.value;
    
    if (vals.precioCacao > 0 && vals.precioCacahuate > 0 && vals.precioBlanco > 0) {
      const nuevosPrecios = {
        cacao: vals.precioCacao,
        cacahuate: vals.precioCacahuate,
        blanco: vals.precioBlanco
      };
      localStorage.setItem('preciosBasePozol', JSON.stringify(nuevosPrecios));
      alert('¡Excelente! Los precios de las tres variedades han sido guardados como predeterminados.');
    } else {
      alert('Por favor, introduce precios válidos mayores a 0 antes de guardar.');
    }
  }

  get listaGastosControls() {
    return (this.formularioFinanciero.get('listaGastos') as FormArray).controls;
  }

  anadirGasto(): void {
    const lista = this.formularioFinanciero.get('listaGastos') as FormArray;
    lista.push(new FormGroup({
      concepto: new FormControl('', [Validators.required]),
      costo: new FormControl(0, [Validators.required, Validators.min(0)])
    }));
  }

  eliminarGasto(index: number): void {
    const lista = this.formularioFinanciero.get('listaGastos') as FormArray;
    if (lista.length > 1) {
      lista.removeAt(index);
    } else {
      lista.at(0).reset({ concepto: '', costo: 0 });
    }
  }

  realizarCalculosDelDia(): void {
    const valores = this.formularioFinanciero.getRawValue();

    // 1. Calcular Venta de cada Pozol (Vasos * Precio)
    const totalCacao = Number(valores.vasosCacao || 0) * Number(valores.precioCacao || 0);
    const totalCacahuate = Number(valores.vasosCacahuate || 0) * Number(valores.precioCacahuate || 0);
    const totalBlanco = Number(valores.vasosBlanco || 0) * Number(valores.precioBlanco || 0);

    // 2. Sumar total de efectivo + ventas electrónicas = Venta Bruta
    const ventaEfectivoTotal = totalCacao + totalCacahuate + totalBlanco;
    const ventaBrutaTotal = ventaEfectivoTotal + Number(valores.ventaElectronica || 0);

    // 3. Sumar la lista dinámica de gastos (Inversión)
    let sumaGastos = 0;
    const arrayGastos = valores.listaGastos || [];
    for (let gasto of arrayGastos) {
      sumaGastos += Number(gasto.costo || 0);
    }

    // 4. Dinero Libre = Venta Bruta - Inversión - Merma - Caja Inicial
    const merma = Number(valores.merma || 0);
    const cajaInicial = Number(valores.cajaInicial || 0);
    const resultadoLibre = ventaBrutaTotal - sumaGastos - merma - cajaInicial;

    this.formularioFinanciero.patchValue({
      inversionTotal: Number(sumaGastos.toFixed(2)),
      ventaBruta: Number(ventaBrutaTotal.toFixed(2)),
      libre: Number(resultadoLibre.toFixed(2))
    }, { emitEvent: false });
  }

  guardarDia(): void {
    if (this.formularioFinanciero.invalid) {
      alert('Por favor, revisa que todos los campos requeridos estén llenos antes de guardar.');
      return;
    }

    const nuevoRegistro = this.formularioFinanciero.getRawValue();
    const datosLocales = localStorage.getItem('historialPozol');
    let listaDias: any[] = datosLocales ? JSON.parse(datosLocales) : [];

    const fechaExiste = listaDias.some(dia => dia.fecha === nuevoRegistro.fecha);
    if (fechaExiste) {
      alert('Esta fecha ya cuenta con un registro en el historial.');
      return;
    }

    listaDias.push(nuevoRegistro);
    localStorage.setItem('historialPozol', JSON.stringify(listaDias));
    alert('¡Jornada guardada con éxito en el sistema!');
    
    // Al limpiar, recuperamos los precios vigentes de la memoria
    const preciosGuardados = localStorage.getItem('preciosBasePozol');
    const precios = preciosGuardados ? JSON.parse(preciosGuardados) : { cacao: 35, cacahuate: 40, blanco: 30 };

    const lista = this.formularioFinanciero.get('listaGastos') as FormArray;
    while (lista.length !== 0) {
      lista.removeAt(0);
    }
    
    this.formularioFinanciero.reset({
      fecha: '',
      vasosCacao: 0, precioCacao: precios.cacao,
      vasosCacahuate: 0, precioCacahuate: precios.cacahuate,
      vasosBlanco: 0, precioBlanco: precios.blanco,
      ventaElectronica: 0, merma: 0, cajaInicial: 0, inversionTotal: 0, ventaBruta: 0, libre: 0
    });
    this.anadirGasto();
  }
}