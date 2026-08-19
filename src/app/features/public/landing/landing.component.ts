import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { HeroComponent } from '../components/hero/hero.component';
import { ProductsComponent } from '../components/products/products.component';

import { DigitalChannelsComponent } from '../components/digital-channels/digital-channels.component';
import { InfinyCapitalInfoComponent } from '../components/infinycapital-info/infinycapital-info.component';
import { LocationComponent } from '../components/location/location.component';
import { LucideAngularModule } from 'lucide-angular';
import { InversionistasComponent } from '../components/inversionistas/inversionistas.component';


@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    HeroComponent,
    ProductsComponent,
    InversionistasComponent,
    DigitalChannelsComponent,
    InfinyCapitalInfoComponent,
    LocationComponent,
    LucideAngularModule
  ],
  templateUrl: './landing.component.html',
  styleUrl: './landing.component.css'
})
export class LandingComponent {
  showPopup = true;

  closePopup() {
    this.showPopup = false;
  }
}
