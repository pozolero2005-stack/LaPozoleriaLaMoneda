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

  // --- MÉTODOS DE NEGOCIO ---
  async guardarCuentaDiaria(datosDia: any, listaGastos: any[]) {
    const { data: nuevaCuenta, error: errorCuenta } = await this.supabase
      .from('cuentas_diarias')
      .upsert([datosDia], { onConflict: 'fecha' }) 
      .select()
      .single();
    
    if (errorCuenta) throw errorCuenta;

    if (listaGastos && listaGastos.length > 0) {
      const gastosConId = listaGastos.map(gasto => ({ 
        ...gasto, 
        cuenta_id: nuevaCuenta.id 
      }));
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

  // --- MÉTODOS DE GASTOS Y COMPARATIVA ---
  async obtenerDatosComparativos(mes: number, anio: number) {
    const mesStr = (mes + 1).toString().padStart(2, '0');
    const ultimoDia = new Date(anio, mes + 1, 0).getDate();
    const inicio = `${anio}-${mesStr}-01`;
    const fin = `${anio}-${mesStr}-${ultimoDia}`;

    // Ejecutamos ambas consultas simultáneamente
    // He añadido .order para asegurar que los datos más recientes aparezcan al principio
    const [cuentas, gastos] = await Promise.all([
      this.supabase
        .from('cuentas_diarias')
        .select('*')
        .gte('fecha', inicio)
        .lte('fecha', fin),
      this.supabase
        .from('gastos_diarios')
        .select('*')
        .gte('fecha', inicio)
        .lte('fecha', fin)
        .order('fecha', { ascending: false })
    ]);

    return { 
      cuentas: cuentas.data || [], 
      gastos: gastos.data || [] 
    };
  }

  // Registrar un gasto validando que el objeto tenga el formato correcto
  async registrarGasto(gasto: any) {
    // Si el cuenta_id viene vacío por error, lo mandamos como null explícito
    const gastoAInsertar = {
      ...gasto,
      cuenta_id: gasto.cuenta_id || null 
    };
    
    return await this.supabase
      .from('gastos_diarios')
      .insert([gastoAInsertar]);
  }

  async eliminarGasto(id: string) {
    return await this.supabase
      .from('gastos_diarios')
      .delete()
      .eq('id', id);
  }
}