import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';

import { SafeUrlPipe } from '../../../../shared/pipes/safe-url.pipe';

@Component({
  selector: 'app-location',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, SafeUrlPipe],
  templateUrl: './location.component.html'
})
export class LocationComponent {
  // Replace with the actual business address once registered on Google Maps
  businessAddress = 'Av. Javier Prado Este 1234, San Isidro, Lima, Perú';
  
  officePhotos = [
    '/oficina/foto-2.jpeg',
    '/oficina/foto-4.jpeg',
    '/oficina/foto-5.jpeg',
    '/oficina/foto-6.jpeg'
  ];

  // To get the embed URL: 
  // 1. Search for your business on Google Maps.
  // 2. Click "Share".
  // 3. Click "Embed a map".
  // 4. Copy the src URL from the iframe.
  mapUrl = 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3901.21858509375!2d-77.028243!3d-12.091176!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMTLCsDA1JzI4LjIiUyA3N8KwMDEnNDEuNyJX!5e0!3m2!1sen!2spe!4v1715780000000!5m2!1sen!2spe';
}
