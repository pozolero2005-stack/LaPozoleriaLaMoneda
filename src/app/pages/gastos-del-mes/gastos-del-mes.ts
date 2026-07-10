import { Component, OnInit, ChangeDetectorRef } from '@angular/core'; // <-- CORREGIDO: Importamos el despertador
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SupabaseService } from '../../services/supabase';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-gastos-mensuales',
  standalone: true,
  imports: [CommonModule, FormsModule],
  providers: [DatePipe],
  templateUrl: './gastos-del-mes.html',
  styleUrls: ['./gastos-del-mes.css']
})
export class GastosDelMes implements OnInit {
  nuevoConcepto: string = '';
  nuevoMonto: number = 0;
  fechaGasto: string = new Date().toISOString().split('T')[0];

  anioSeleccionado!: number;
  mesSeleccionado!: number;

  listaAnios: number[] = [];
  listaMeses = [
    { value: 1, label: 'Enero' }, { value: 2, label: 'Febrero' },
    { value: 3, label: 'Marzo' }, { value: 4, label: 'Abril' },
    { value: 5, label: 'Mayo' },  { value: 6, label: 'Junio' },
    { value: 7, label: 'Julio' }, { value: 8, label: 'Agosto' },
    { value: 9, label: 'Septiembre' }, { value: 10, label: 'Octubre' },
    { value: 11, label: 'Noviembre' }, { value: 12, label: 'Diciembre' }
  ];

  nombresDias: string[] = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
  diasDelMes: any[] = [];
  listaGastos: any[] = [];
  diaSeleccionado: any = null; 
  isSidebarHidden: boolean = false; 

  totalGastadoMes: number = 0;
  totalIngresosMes: number = 0;
  balanceFinal: number = 0;

  // CORREGIDO: Inyectamos 'cdr' en el constructor
  constructor(private supabaseService: SupabaseService, private cdr: ChangeDetectorRef) {
    const hoy = new Date();
    this.anioSeleccionado = hoy.getFullYear();
    this.mesSeleccionado = hoy.getMonth() + 1;

    const anioActual = hoy.getFullYear();
    for (let i = 2024; i <= anioActual + 10; i++) {
      this.listaAnios.push(i);
    }
  }

  ngOnInit(): void { 
    this.cargarDatos(); 
  }

  toggleSidebar(): void {
    this.isSidebarHidden = !this.isSidebarHidden;
  }

  cerrarModal(): void {
    this.diaSeleccionado = null;
  }

  private pad(num: number): string {
    return num < 10 ? `0${num}` : `${num}`;
  }

  private showSwal(title: string, icon: 'success' | 'error', text?: string) {
    Swal.fire({
      title, text, icon,
      background: '#1a1a1a',
      color: '#fff',
      confirmButtonColor: '#ffc107',
      backdrop: `rgba(0,0,0,0.8)`
    });
  }

  async cargarDatos(): Promise<void> {
    const primerDiaStr = `${this.anioSeleccionado}-${this.pad(this.mesSeleccionado)}-01`;
    const totalDiasEnMes = new Date(this.anioSeleccionado, this.mesSeleccionado, 0).getDate();
    const ultimoDiaStr = `${this.anioSeleccionado}-${this.pad(this.mesSeleccionado)}-${totalDiasEnMes}`;

    const { data: cuentas } = await this.supabaseService.supabase
      .from('cuenta_diaria')
      .select('venta_neta_real')
      .gte('fecha', primerDiaStr)
      .lte('fecha', ultimoDiaStr);

    const { data: gastos } = await this.supabaseService.supabase
      .from('gastos_mantenimiento')
      .select('*')
      .gte('fecha', primerDiaStr)
      .lte('fecha', ultimoDiaStr)
      .order('fecha', { ascending: false });

    this.listaGastos = gastos || [];
    
    let ingresos = 0;
    let egresos = 0;

    cuentas?.forEach(c => ingresos += (Number(c.venta_neta_real) || 0));
    this.listaGastos.forEach(g => egresos += (Number(g.monto) || 0));

    this.totalIngresosMes = ingresos;
    this.totalGastadoMes = egresos;
    this.balanceFinal = ingresos - egresos;

    this.generarCalendario(totalDiasEnMes, this.listaGastos);
    
    // CORREGIDO: Forzamos a la pantalla a redibujarse con los datos nuevos
    this.cdr.detectChanges();
  }

  generarCalendario(totalDias: number, gastos: any[]): void {
    this.diasDelMes = [];

    const primerDiaSemana = new Date(this.anioSeleccionado, this.mesSeleccionado - 1, 1).getDay();
    const espaciosVacios = primerDiaSemana === 0 ? 6 : primerDiaSemana - 1;

    for (let h = 0; h < espaciosVacios; h++) {
      this.diasDelMes.push({ vacio: true });
    }

    for (let i = 1; i <= totalDias; i++) {
      const fechaStr = `${this.anioSeleccionado}-${this.pad(this.mesSeleccionado)}-${this.pad(i)}`;
      const gastosDia = gastos.filter(g => g.fecha === fechaStr);
      const totalDia = gastosDia.reduce((sum, g) => sum + (Number(g.monto) || 0), 0);

      this.diasDelMes.push({
        vacio: false,
        numero: i,
        fecha: fechaStr,
        gastos: gastosDia,
        totalGastado: totalDia
      });
    }

    if (this.diaSeleccionado && !this.diaSeleccionado.vacio) {
      this.diaSeleccionado = this.diasDelMes.find(d => d.fecha === this.diaSeleccionado.fecha) || null;
    }
  }

  seleccionarDia(dia: any): void {
    if (dia.vacio) return;
    this.diaSeleccionado = dia;
  }

  async agregarGasto(): Promise<void> {
    if (!this.nuevoConcepto || this.nuevoMonto <= 0) {
      this.showSwal('Oops!', 'error', 'Ingresa concepto y monto válido');
      return;
    }

    const { error } = await this.supabaseService.supabase.from('gastos_mantenimiento').insert([{ 
      fecha: this.fechaGasto, 
      concepto: this.nuevoConcepto, 
      monto: this.nuevoMonto 
    }]);

    if (error) {
      this.showSwal('Error', 'error', error.message);
    } else {
      this.showSwal('¡Registrado!', 'success', 'Gasto guardado con éxito');
      this.nuevoConcepto = '';
      this.nuevoMonto = 0;
      await this.cargarDatos();
    }
  }

  async borrarGasto(id: string): Promise<void> {
    const result = await Swal.fire({
      title: '¿Eliminar este gasto?',
      text: "Esta acción no se puede deshacer.",
      icon: 'warning',
      background: '#1a1a1a',
      color: '#fff',
      showCancelButton: true,
      confirmButtonColor: '#dc3545',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Sí, borrar',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      const { error } = await this.supabaseService.supabase.from('gastos_mantenimiento').delete().eq('id', id);
      if (error) {
        this.showSwal('Error', 'error', 'No se pudo eliminar el gasto');
      } else {
        await this.cargarDatos();
        this.showSwal('Eliminado', 'success', 'El gasto ha sido borrado');
      }
    }
  }
}