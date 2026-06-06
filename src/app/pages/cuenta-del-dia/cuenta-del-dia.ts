import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators, FormArray, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { SupabaseService } from '../../services/supabase'; // <-- 1. IMPORTAMOS AL TELEFONISTA

@Component({
  selector: 'app-cuenta-del-dia',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './cuenta-del-dia.html',
  styleUrl: './cuenta-del-dia.css'
})
export class CuentaDelDia implements OnInit {
  
  formularioFinanciero!: FormGroup;

  // 2. LLAMAMOS AL TELEFONISTA AL CONSTRUCTOR PARA QUE ESTÉ DISPONIBLE EN LA PÁGINA
  constructor(private supabaseService: SupabaseService) {}

  ngOnInit(): void {
    // REGLA DE NEGOCIO: Mantenemos el localStorage SOLO para recordar tus precios sugeridos en pantalla
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

    this.formularioFinanciero.valueChanges.subscribe(() => {
      this.realizarCalculosDelDia();
    });
  }

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
    const totalCacao = Number(valores.vasosCacao || 0) * Number(valores.precioCacao || 0);
    const totalCacahuate = Number(valores.vasosCacahuate || 0) * Number(valores.precioCacahuate || 0);
    const totalBlanco = Number(valores.vasosBlanco || 0) * Number(valores.precioBlanco || 0);

    const ventaEfectivoTotal = totalCacao + totalCacahuate + totalBlanco;
    const ventaBrutaTotal = ventaEfectivoTotal + Number(valores.ventaElectronica || 0);

    let sumaGastos = 0;
    const arrayGastos = valores.listaGastos || [];
    for (let gasto of arrayGastos) {
      sumaGastos += Number(gasto.costo || 0);
    }

    const merma = Number(valores.merma || 0);
    const cajaInicial = Number(valores.cajaInicial || 0);
    const resultadoLibre = ventaBrutaTotal - sumaGastos - merma - cajaInicial;

    this.formularioFinanciero.patchValue({
      inversionTotal: Number(sumaGastos.toFixed(2)),
      ventaBruta: Number(ventaBrutaTotal.toFixed(2)),
      libre: Number(resultadoLibre.toFixed(2))
    }, { emitEvent: false });
  }

  // 3. LA NUEVA FUNCIÓN ASÍNCRONA QUE CONECTA AL BANCO DE SUPABASE
  async guardarDia(): Promise<void> {
    if (this.formularioFinanciero.invalid) {
      alert('Por favor, revisa que todos los campos requeridos estén llenos antes de guardar.');
      return;
    }

    const todoElFormulario = this.formularioFinanciero.getRawValue();

    // Separamos los datos para la libreta grande (resumen del día) según las columnas exactas de tu tabla SQL
   const datosDia = {
  fecha: todoElFormulario.fecha,         // <--- Ahora sí coincide con tu SQL
  caja_inicial: todoElFormulario.cajaInicial,
  inversion_total: todoElFormulario.inversionTotal,
  venta_bruta: todoElFormulario.ventaBruta,
  libre: todoElFormulario.libre
  // Nota: No incluí "created_at" porque tu tabla lo genera solo (DEFAULT now())
};

    // Separamos la lista de gastos detallados para la libreta chica
    const listaGastos = todoElFormulario.listaGastos;
    
    console.log("Datos que viajan a la nube:", datosDia);

    try {
      // Mandamos al Telefonista a realizar el viaje seguro a Supabase
      await this.supabaseService.guardarCuentaDiaria(datosDia, listaGastos);
      
      alert('¡Jornada guardada con éxito TOTAL en la base de datos en la nube!');

      // RESET DEL FORMULARIO TRAS EL ÉXITO
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

    } catch (error: any) {
      console.error('Error al guardar:', error);
      alert('Hubo un problema al conectar con el castillo: ' + (error.message || error));
    }
  }
}