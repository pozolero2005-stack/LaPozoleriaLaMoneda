import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators, FormArray, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { SupabaseService } from '../../services/supabase';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-cuenta-del-dia',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './cuenta-del-dia.html',
  styleUrl: './cuenta-del-dia.css'
})
export class CuentaDelDia implements OnInit {
  formularioFinanciero!: FormGroup;

  constructor(private supabaseService: SupabaseService) {}

  ngOnInit(): void {
    this.formularioFinanciero = new FormGroup({
      fecha: new FormControl(new Date().toISOString().split('T')[0], [Validators.required]),
      vasosCacao: new FormControl(0, [Validators.required, Validators.min(0)]),
      precioCacao: new FormControl(20, [Validators.required, Validators.min(0)]),
      vasosCacahuate: new FormControl(0, [Validators.required, Validators.min(0)]),
      precioCacahuate: new FormControl(20, [Validators.required, Validators.min(0)]),
      vasosBlanco: new FormControl(0, [Validators.required, Validators.min(0)]),
      precioBlanco: new FormControl(15, [Validators.required, Validators.min(0)]),
      ventaElectronica: new FormControl(0, [Validators.required, Validators.min(0)]),
      merma: new FormControl(0, [Validators.required, Validators.min(0)]),
      listaGastos: new FormArray([])
    });
    this.anadirGasto();
  }

  get totalVentaBruta(): number {
    const v = this.formularioFinanciero.value;
    return (v.vasosCacao * v.precioCacao) + (v.vasosCacahuate * v.precioCacahuate) + (v.vasosBlanco * v.precioBlanco);
  }

  get totalGastos(): number {
    return this.formularioFinanciero.value.listaGastos.reduce((acc: number, g: any) => acc + (g.costo || 0), 0);
  }

  get dineroFinal(): number {
    return this.totalVentaBruta - this.totalGastos - this.formularioFinanciero.value.merma;
  }

  get listaGastosControls() { 
    return (this.formularioFinanciero.get('listaGastos') as FormArray).controls; 
  }

  anadirGasto(): void {
    (this.formularioFinanciero.get('listaGastos') as FormArray).push(new FormGroup({
      concepto: new FormControl('', [Validators.required]),
      costo: new FormControl(0, [Validators.required, Validators.min(0)])
    }));
  }

  eliminarGasto(index: number): void {
    const lista = this.formularioFinanciero.get('listaGastos') as FormArray;
    lista.length > 1 ? lista.removeAt(index) : lista.at(0).reset({ concepto: '', costo: 0 });
  }

  async guardarDia(): Promise<void> {
    if (this.formularioFinanciero.invalid) {
      Swal.fire({ 
        title: 'Atención', 
        text: 'Revisa los campos.', 
        icon: 'warning',
        background: '#1a1a1a',
        color: '#fff',
        confirmButtonColor: '#ffc107'
      });
      return;
    }

    const valores = this.formularioFinanciero.value;
    const { data: { user } } = await this.supabaseService.supabase.auth.getUser();

    if (!user) {
      Swal.fire({ 
        title: 'Error', 
        text: 'Debes iniciar sesión.', 
        icon: 'error',
        background: '#1a1a1a',
        color: '#fff',
        confirmButtonColor: '#dc3545'
      });
      return;
    }

    const { error } = await this.supabaseService.supabase
      .from('cuenta_diaria')
      .insert([
        {
          fecha: valores.fecha,
          user_id: user.id,
          venta_bruta: this.totalVentaBruta,
          inversion_dia: this.totalGastos,
          valor_merma: valores.merma
        }
      ]);

    if (error) {
      console.error(error);
      Swal.fire({ 
        title: 'Error', 
        text: 'No se pudo guardar en la base de datos.', 
        icon: 'error',
        background: '#1a1a1a',
        color: '#fff'
      });
    } else {
      Swal.fire({ 
        title: '¡Éxito!', 
        text: 'Jornada guardada perfectamente.', 
        icon: 'success',
        background: '#1a1a1a',
        color: '#fff',
        confirmButtonColor: '#00ff88'
      });
    }
  }
}