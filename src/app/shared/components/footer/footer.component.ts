import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, Facebook, Instagram, Linkedin, Youtube, Smartphone, MapPin, Phone } from 'lucide-angular';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './footer.component.html',
})
export class FooterComponent {
  readonly Facebook = Facebook;
  readonly Instagram = Instagram;
  readonly Linkedin = Linkedin;
  readonly Youtube = Youtube;
  readonly Smartphone = Smartphone;
  readonly MapPin = MapPin;
  readonly Phone = Phone;

  currentYear = new Date().getFullYear();
}
