import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment.development';

@Injectable({
  providedIn: 'root'
})
export class SupabaseService {
  public supabase!: SupabaseClient;

  constructor() {
    this.supabase = createClient(
      environment.supabaseUrl,
      environment.supabaseKey
    );
  }

  // --- MÉTODOS EXISTENTES DE VENTAS ---
  async guardarCuentaDiaria(datosDia: any, listaGastos: any[]) {
    const { data: nuevaCuenta, error: errorCuenta } = await this.supabase
      .from('cuentas_diarias')
      .insert([datosDia])
      .select()
      .single();
    if (errorCuenta) throw errorCuenta;

    if (listaGastos && listaGastos.length > 0) {
      const gastosConId = listaGastos.map(gasto => ({ ...gasto, cuenta_id: nuevaCuenta.id }));
      const { error: errorGastos } = await this.supabase.from('gastos_diarios').insert(gastosConId);
      if (errorGastos) throw errorGastos;
    }
    return nuevaCuenta;
  }

  async obtenerBalanceAnual(anio: number) {
    return await this.supabase
      .from('cuentas_diarias')
      .select('fecha, inversion_total, merma, libre')
      .gte('fecha', `${anio}-01-01`)
      .lte('fecha', `${anio}-12-31`);
  }

  // --- NUEVOS MÉTODOS PARA GASTOS MENSUALES ---
  async obtenerGastosPorMes(mes: number, anio: number) {
    const mesStr = (mes + 1).toString().padStart(2, '0');
    return await this.supabase
      .from('gastos_diarios')
      .select('*')
      .gte('fecha', `${anio}-${mesStr}-01`)
      .lte('fecha', `${anio}-${mesStr}-31`);
  }

  async registrarGasto(gasto: any) {
    return await this.supabase.from('gastos_diarios').insert([gasto]);
  }

  async eliminarGasto(id: string) {
    return await this.supabase.from('gastos_diarios').delete().eq('id', id);
  }
}