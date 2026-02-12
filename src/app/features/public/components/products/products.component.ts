import { Component, ViewChild, ElementRef, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, Banknote, PiggyBank, CreditCard, HandCoins } from 'lucide-angular';

interface Product {
  title: string;
  subtitle: string;
  icon: any;
  iconName?: string; // For template reference if needed
  image?: string;
  colorClass: string;
}

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './products.component.html',
})
export class ProductsComponent {
  readonly Banknote = Banknote;
  readonly PiggyBank = PiggyBank;
  readonly CreditCard = CreditCard;
  readonly HandCoins = HandCoins;

  @ViewChild('scrollContainer') scrollContainer!: ElementRef;

  currentProductIndex = signal(0);

  products: Product[] = [
    {
      title: 'Cuenta Digital',
      subtitle: 'Cero costo de mantenimiento',
      icon: PiggyBank,
      // iconName: 'piggy-bank',
      image: '/products/piggy-coins.gif',
      colorClass: 'bg-gray-200'
    },
    {
      title: 'Inversiones',
      subtitle: 'Haz crecer tu dinero',
      icon: Banknote,
      iconName: 'banknote',
      colorClass: 'bg-red-600'
    },
    {
      title: 'Tarjeta de Crédito',
      subtitle: 'Compras seguras',
      icon: CreditCard,
      iconName: 'credit-card',
      colorClass: 'bg-gray-800'
    },
    {
      title: 'Préstamos',
      subtitle: 'Al instante',
      icon: HandCoins,
      iconName: 'hand-coins',
      colorClass: 'bg-teal-600'
    }
  ];

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
    // Optional: Logic if needed
  }

  onScroll(event: Event) {
    const container = this.scrollContainer.nativeElement as HTMLElement;
    const scrollPosition = container.scrollLeft;
    // Better approach for snap: find closest child
    const itemWidth = container.scrollWidth / this.products.length;
    let index = Math.round(scrollPosition / itemWidth);
    
    // Clamp index
    index = Math.max(0, Math.min(index, this.products.length - 1));
    
    this.currentProductIndex.set(index);
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
    this.currentProductIndex.set(index);
  }
}
