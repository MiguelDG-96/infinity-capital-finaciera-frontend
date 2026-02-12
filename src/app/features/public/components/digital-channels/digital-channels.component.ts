import { Component, ViewChild, ElementRef, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, Monitor, Smartphone, RefreshCw, CalendarClock, Wifi, Globe, Check } from 'lucide-angular';
import { DIGITAL_CHANNELS_DATA } from '../../../../core/constants/menu-data';

@Component({
  selector: 'app-digital-channels',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './digital-channels.component.html',
})
export class DigitalChannelsComponent {
  // Lucide Icons
  readonly Monitor = Monitor;
  readonly Smartphone = Smartphone;
  readonly RefreshCw = RefreshCw;
  readonly CalendarClock = CalendarClock;
  readonly Wifi = Wifi;
  readonly Globe = Globe;
  readonly Check = Check;

  channels = [
      {
          label: 'Banca Móvil',
          description: 'Lleva tu banco contigo. Realiza transferencias, pagos y consultas desde tu celular.',
          icon: Smartphone,
          colorClass: 'bg-blue-50'
      },
      {
          label: 'Banca por Internet',
          description: 'Accede a tus cuentas desde cualquier computadora con total seguridad.',
          icon: Monitor,
          colorClass: 'bg-indigo-50'
      },
      {
          label: 'Pago Automático',
          description: 'Olvídate de las fechas de vencimiento. Programa tus pagos de servicios y tarjetas.',
          icon: RefreshCw,
          colorClass: 'bg-green-50'
      }
  ];

  @ViewChild('scrollContainer') scrollContainer!: ElementRef;
  currentChannelIndex = signal(0);

  // Drag to Scroll Logic
  isDown = false;
  startX = 0;
  scrollLeft = 0;

  onMouseDown(e: MouseEvent) {
    this.isDown = true;
    this.startX = e.pageX - this.scrollContainer.nativeElement.offsetLeft;
    this.scrollLeft = this.scrollContainer.nativeElement.scrollLeft;
  }

  onMouseLeave() {
    this.isDown = false;
  }

  onMouseUp() {
    this.isDown = false;
  }

  onMouseMove(e: MouseEvent) {
    if (!this.isDown) return;
    e.preventDefault();
    const x = e.pageX - this.scrollContainer.nativeElement.offsetLeft;
    const walk = (x - this.startX) * 2; // Scroll-fast
    this.scrollContainer.nativeElement.scrollLeft = this.scrollLeft - walk;
  }

  onTouchStart(e: TouchEvent) {
  }

  onTouchEnd(e: TouchEvent) {
  }

  onScroll(event: Event) {
    const container = this.scrollContainer.nativeElement as HTMLElement;
    const scrollPosition = container.scrollLeft;
    // Better approach for snap: find closest child
    const itemWidth = container.scrollWidth / this.channels.length;
    let index = Math.round(scrollPosition / itemWidth);
    
    // Clamp index
    index = Math.max(0, Math.min(index, this.channels.length - 1));
    
    this.currentChannelIndex.set(index);
  }

  scrollToIndex(index: number) {
    const container = this.scrollContainer.nativeElement as HTMLElement;
    // Calculate position
    const card = container.children[index] as HTMLElement;
    if (card) {
         container.scrollTo({
            left: card.offsetLeft, 
            behavior: 'smooth'
        });
    }
    this.currentChannelIndex.set(index);
  }
}
