import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, Smartphone, Monitor, RefreshCw, Wifi, ShieldCheck, CreditCard, User, MoreHorizontal, ArrowRightLeft, Globe } from 'lucide-angular';

interface Channel {
  label: string;
  icon: any; // Lucide Icon class
  iconName: string;
  description: string;
  colorClass: string;
}

@Component({
  selector: 'app-digital-channels',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './digital-channels.component.html',
})
export class DigitalChannelsComponent {
  readonly Smartphone = Smartphone;
  readonly Monitor = Monitor;
  readonly RefreshCw = RefreshCw;
  readonly Wifi = Wifi;
  readonly ShieldCheck = ShieldCheck;
  readonly CreditCard = CreditCard;
  readonly User = User;
  readonly MoreHorizontal = MoreHorizontal;
  readonly ArrowRightLeft = ArrowRightLeft;
  readonly Globe = Globe;

  channels: Channel[] = [
    {
      label: 'Banca Móvil',
      icon: Smartphone,
      iconName: 'smartphone',
      description: 'Tu banco en tu bolsillo',
      colorClass: 'bg-blue-50'
    },
    {
      label: 'Banca por Internet',
      icon: Monitor,
      iconName: 'monitor',
      description: 'Gestiona desde casa',
      colorClass: 'bg-indigo-50'
    },
    {
      label: 'Pago Automático',
      icon: RefreshCw,
      iconName: 'refresh-cw',
      description: 'Olvídate de las fechas',
      colorClass: 'bg-green-50'
    }
  ];
}
