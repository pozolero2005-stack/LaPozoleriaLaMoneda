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
    console.log('--- SERVICIO SUPABASE INICIALIZADO ---');
  }

  async guardarCuentaDiaria(datosDia: any, listaGastos: any[]) {
    console.log('--- INICIANDO PROCESO DE GUARDADO ---');
    console.log('Datos de la cuenta:', datosDia);

    // 1. Intentar upsert de la cuenta
    const { data: upsertData, error: errorCuenta } = await this.supabase
      .from('cuentas_diarias')
      .upsert([datosDia], { onConflict: 'fecha' })
      .select('id')
      .single();

    if (errorCuenta) {
      console.error('CRÍTICO: Error en upsert de cuenta:', errorCuenta);
      throw errorCuenta;
    }

    // 2. Obtener el ID
    let cuentaId = upsertData?.id;
    if (!cuentaId) {
      console.warn('UPSERT no devolvió ID, intentando búsqueda por fecha...');
      const { data: busqueda } = await this.supabase
        .from('cuentas_diarias')
        .select('id')
        .eq('fecha', datosDia.fecha)
        .single();
      cuentaId = busqueda?.id;
    }

    if (!cuentaId) {
      console.error('CRÍTICO: No se pudo localizar el ID de la cuenta.');
      throw new Error("No se pudo obtener un ID de cuenta válido.");
    }
    
    console.log('ID de cuenta verificado:', cuentaId);

    // 3. Procesar gastos con logs detallados
    if (listaGastos && listaGastos.length > 0) {
      const gastosPreparados = listaGastos.map(gasto => ({ 
        concepto: gasto.concepto || 'Sin concepto',
        costo: Number(gasto.costo) || 0,
        categoria: gasto.categoria || 'otros',
        fecha: datosDia.fecha,
        cuenta_id: cuentaId
      }));

      console.log('Datos preparados para insertar en gastos_diarios:');
      console.table(gastosPreparados);

      const { error: errorGastos } = await this.supabase
        .from('gastos_diarios')
        .insert(gastosPreparados);
        
      if (errorGastos) {
        console.error('--- ERROR 409 DETECTADO EN GASTOS ---');
        console.error('Mensaje:', errorGastos.message);
        console.error('Detalles Técnicos:', errorGastos.details);
        console.error('Sugerencia de Supabase:', errorGastos.hint);
        throw errorGastos;
      }
      console.log('Gastos insertados correctamente.');
    }
    
    return { id: cuentaId };
  }

  // ... el resto de tus métodos (obtenerBalanceAnual, etc.) permanecen iguales
  async obtenerBalanceAnual(anio: number) {
    return await this.supabase.from('cuentas_diarias').select('fecha, inversion_total, merma, libre').gte('fecha', `${anio}-01-01`).lte('fecha', `${anio}-12-31`);
  }

  async obtenerDatosComparativos(mes: number, anio: number) {
    const mesStr = (mes + 1).toString().padStart(2, '0');
    const ultimoDia = new Date(anio, mes + 1, 0).getDate();
    const inicio = `${anio}-${mesStr}-01`;
    const fin = `${anio}-${mesStr}-${ultimoDia}`;
    const [cuentas, gastos] = await Promise.all([
      this.supabase.from('cuentas_diarias').select('*').gte('fecha', inicio).lte('fecha', fin),
      this.supabase.from('gastos_diarios').select('*').gte('fecha', inicio).lte('fecha', fin).order('fecha', { ascending: false })
    ]);
    return { cuentas: cuentas.data || [], gastos: gastos.data || [] };
  }

  async registrarGasto(gasto: any) {
    return await this.supabase.from('gastos_diarios').insert([{ ...gasto, categoria: gasto.categoria || 'otros' }]);
  }

  async eliminarGasto(id: string) {
    return await this.supabase.from('gastos_diarios').delete().eq('id', id);
  }
}