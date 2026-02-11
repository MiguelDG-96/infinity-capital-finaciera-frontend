import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./layouts/public-layout/public-layout.component').then(m => m.PublicLayoutComponent),
    children: [
      { path: '', loadComponent: () => import('./features/public/landing/landing.component').then(m => m.LandingComponent) },
      { path: 'simulator', loadComponent: () => import('./features/public/simulator/simulator.component').then(m => m.SimulatorComponent) }
    ]
  },
  {
    path: '**',
    redirectTo: ''
  }
];
