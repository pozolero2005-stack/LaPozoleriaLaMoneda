import { Routes } from '@angular/router';
import { Home } from './pages/home/home';
import { CuentaDelDia } from './pages/cuenta-del-dia/cuenta-del-dia';
import { HistorialMensual } from './pages/historial-mensual/historial-mensual';
import { BalanceAnual } from './pages/balance-anual/balance-anual';
import { GastosDelMes } from './pages/gastos-del-mes/gastos-del-mes';

export const routes: Routes = [
    {path:"", component:Home},
    {path:"cuentas", component:CuentaDelDia},
    {path:"historial", component:HistorialMensual},
    {path:"balance", component: BalanceAnual},
    {path:"gastos", component: GastosDelMes}
];
