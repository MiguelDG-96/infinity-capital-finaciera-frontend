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
  businessAddress = 'Jiron El Dorado 208, Moyobamba 22001';
  
  officePhotos = [
    '/oficina/foto-2.jpeg',
    '/oficina/foto-4.jpeg',
    '/oficina/foto-5.jpeg',
    '/oficina/foto-6.jpeg'
  ];

  mapType: 'm' | 'k' = 'm';

  get mapUrl() {
    return `https://www.google.com/maps?q=Jiron+El+Dorado+208,+Moyobamba+22001&output=embed&t=${this.mapType}`;
  }

  setMapType(type: 'm' | 'k') {
    this.mapType = type;
  }
}
