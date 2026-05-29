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

  // ACCIÓN MÁGICA: GUARDAR LA JORNADA COMPLETA EN LA BASE DE DATOS
  async guardarCuentaDiaria(datosDia: any, listaGastos: any[]) {
    // 1. Le decimos al castillo que anote el resumen del día
    const { data: nuevaCuenta, error: errorCuenta } = await this.supabase
      .from('cuentas_diarias')
      .insert([datosDia])
      .select()
      .single();

    if (errorCuenta) throw errorCuenta;

    // 2. Si hay gastos que guardar, los amarramos al ID de ese día
    if (listaGastos && listaGastos.length > 0) {
      // Usamos un mapa para ponerle a cada gasto el sello de a qué día pertenece
      const gastosConId = listaGastos.map(gasto => ({
        ...gasto,
        cuenta_id: nuevaCuenta.id // Aquí pegamos el ID que nos dio el castillo
      }));

      // Mandamos la lista completa de gastos en un solo viaje
      const { error: errorGastos } = await this.supabase
        .from('gastos_diarios')
        .insert(gastosConId);

      if (errorGastos) throw errorGastos;
    }

    return nuevaCuenta;
  }
}