import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { TopbarComponent } from '../../shared/components/topbar/topbar.component';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';
import { SecondarybarComponent } from '../../shared/components/secondarybar/secondarybar.component';

@Component({
  selector: 'app-public-layout',
  standalone: true,
  imports: [RouterOutlet, TopbarComponent, NavbarComponent, SecondarybarComponent],
  template: `
    <app-topbar></app-topbar>
    <app-navbar></app-navbar>
    <app-secondarybar></app-secondarybar>

    <main>
      <router-outlet></router-outlet>
    </main>

    <footer class="p-8 bg-gray-100 mt-12 text-center text-gray-500">
      <p>&copy; 2026 Capital Finance. Todos los derechos reservados.</p>
    </footer>
  `,
  styles: []
})
export class PublicLayoutComponent {}
