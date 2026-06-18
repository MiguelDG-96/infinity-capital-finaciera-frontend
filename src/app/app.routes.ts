import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'register',
    canActivate: [guestGuard],
    loadComponent: () => import('./features/auth/register/register.component').then(m => m.RegisterComponent)
  },
  {
    path: 'verify',
    canActivate: [guestGuard],
    loadComponent: () => import('./features/auth/verify/verify.component').then(m => m.VerifyComponent)
  },
  {
    path: '',
    loadComponent: () => import('./layouts/public-layout/public-layout.component').then(m => m.PublicLayoutComponent),
    children: [
      { path: '', loadComponent: () => import('./features/public/landing/landing.component').then(m => m.LandingComponent) },
      { path: 'simulator', loadComponent: () => import('./features/public/simulator/simulator.component').then(m => m.SimulatorComponent) }
    ]
  },
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadComponent: () => import('./layouts/dashboard-layout/dashboard-layout.component').then(m => m.DashboardLayoutComponent),
    children: [
      { path: '', loadComponent: () => import('./features/dashboard/pages/dashboard-home/dashboard-home.component').then(m => m.DashboardHomeComponent) },
      // Rutas de Cliente
      { path: 'creditos/solicitar', loadComponent: () => import('./features/dashboard/pages/solicitar-credito/solicitar-credito.component').then(m => m.SolicitarCreditoComponent) },
      { path: 'creditos/mis-creditos', loadComponent: () => import('./features/dashboard/pages/mis-creditos/mis-creditos.component').then(m => m.MisCreditosComponent) },
      { path: 'creditos/mis-creditos/:id', loadComponent: () => import('./features/dashboard/pages/credito-detalle/credito-detalle.component').then(m => m.CreditoDetalleComponent) },
      { path: 'billetera', loadComponent: () => import('./features/dashboard/pages/billetera/billetera.component').then(m => m.BilleteraComponent) },
      // Rutas de Administrador
      { path: 'admin/solicitudes', loadComponent: () => import('./features/dashboard/pages/admin-solicitudes/admin-solicitudes.component').then(m => m.AdminSolicitudesComponent) },
      { path: 'admin/cartera', loadComponent: () => import('./features/dashboard/pages/admin-cartera/admin-cartera.component').then(m => m.AdminCarteraComponent) },
      { path: 'admin/cartera/nuevo', loadComponent: () => import('./features/dashboard/pages/admin-crear-credito/admin-crear-credito.component').then(m => m.AdminCrearCreditoComponent) },
      { path: 'admin/cartera/:id', loadComponent: () => import('./features/dashboard/pages/credito-detalle/credito-detalle.component').then(m => m.CreditoDetalleComponent) },
      { path: 'admin/tasas', loadComponent: () => import('./features/dashboard/pages/gestion-tasas/gestion-tasas.component').then(m => m.GestionTasasComponent) },
      { path: 'admin/modulos', loadComponent: () => import('./features/dashboard/pages/admin-modulos/admin-modulos.component').then(m => m.AdminModulosComponent) },
      { path: 'admin/seguridad', loadComponent: () => import('./features/dashboard/pages/admin-seguridad/admin-seguridad.component').then(m => m.AdminSeguridadComponent) },
      { path: 'admin/personal', loadComponent: () => import('./features/dashboard/pages/admin-personal/admin-personal.component').then(m => m.AdminPersonalComponent) },
      { path: 'admin/tesoreria', loadComponent: () => import('./features/dashboard/pages/admin-tesoreria/admin-tesoreria.component').then(m => m.AdminTesoreriaComponent) },
      { path: 'admin/ayuda', loadComponent: () => import('./features/dashboard/pages/admin-ayuda/admin-ayuda').then(m => m.AdminAyuda) },
      // Reportes
      { path: 'reportes', loadComponent: () => import('./features/dashboard/pages/reportes/reportes').then(m => m.Reportes) },
      // Perfil de usuario
      { path: 'perfil', loadComponent: () => import('./features/dashboard/pages/perfil/perfil.component').then(m => m.PerfilComponent) },

    ]
  },
  {
    path: 'access-denied',
    loadComponent: () => import('./features/error/access-denied/access-denied.component').then(m => m.AccessDeniedComponent)
  },
  {
    path: 'admin/calibrador-pdf',
    canActivate: [authGuard],
    loadComponent: () => import('./features/admin/pdf-calibrator/pdf-calibrator').then(m => m.PdfCalibrator)
  },
  {
    path: '**',
    redirectTo: ''
  }
];
