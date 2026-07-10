import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment.development';

@Injectable({ providedIn: 'root' })
export class SupabaseService {
  public supabase: SupabaseClient;

  constructor() {
    // CAMBIO 1: Añadimos la configuración para usar sessionStorage (el pizarrón mágico)
    this.supabase = createClient(environment.supabaseUrl, environment.supabaseKey, {
      auth: {
        storage: window.sessionStorage, // Se borra automático al cerrar la pestaña
        autoRefreshToken: true,
        persistSession: true
      }
    });
  }

  async guardarCuentaDiaria(datosDia: any, listaGastos: any[]) {
    // CAMBIO 2: Apuntamos a tu tabla real 'cuenta_diaria' (sin la 's')
    const { data: cuenta, error: errorCuenta } = await this.supabase
      .from('cuenta_diaria')
      .insert([datosDia])
      .select('id')
      .single();

    if (errorCuenta) throw errorCuenta;

    // CAMBIO 3: Guardamos los gastos en la tabla 'gastos_mantenimiento'
    if (listaGastos.length > 0) {
      const gastosConId = listaGastos.map(g => ({
        concepto: g.concepto,
        monto: g.costo || g.monto, // Ajustado a tu columna real de la base de datos: 'monto'
        fecha: datosDia.fecha
      }));

      const { error: errorGastos } = await this.supabase
        .from('gastos_mantenimiento')
        .insert(gastosConId);

      if (errorGastos) throw errorGastos;
    }

    return cuenta.id;
  }
}