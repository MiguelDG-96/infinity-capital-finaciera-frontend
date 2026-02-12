import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { TopbarComponent } from '../../shared/components/topbar/topbar.component';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';
import { SecondarybarComponent } from '../../shared/components/secondarybar/secondarybar.component';
import { FooterComponent } from '../../shared/components/footer/footer.component';


@Component({
  selector: 'app-public-layout',
  standalone: true,
  imports: [RouterOutlet, TopbarComponent, NavbarComponent, SecondarybarComponent, FooterComponent],
  template: `
    <app-topbar></app-topbar>
    <app-navbar></app-navbar>
    <app-secondarybar></app-secondarybar>

    <main>
      <router-outlet></router-outlet>
    </main>

    <app-footer></app-footer>
  `,
  styles: []
})
export class PublicLayoutComponent {}
