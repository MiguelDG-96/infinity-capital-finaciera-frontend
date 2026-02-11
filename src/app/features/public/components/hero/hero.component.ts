import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

interface Slide {
  title: string;
  subtitle: string;
  bgColor: string;
  textTitleColor: string;
  textSubtitleColor: string;
  image?: string; // Placeholder for image logic if needed
}

@Component({
  selector: 'app-hero',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './hero.component.html',
  styleUrl: './hero.component.css'
})
export class HeroComponent implements OnInit, OnDestroy {
  slides: Slide[] = [
    {
      title: 'Impulsamos tu negocio hoy',
      subtitle: 'Créditos rápidos y asesoría personalizada para emprendedores como tú.',
      bgColor: 'bg-red-200',
      textTitleColor: 'text-red-600',
      textSubtitleColor: 'text-red-900',
      image: '/hero/banner/banner-1.png'
    },
    {
      title: 'Tu esfuerzo merece más capital',
      subtitle: 'Financiamiento flexible para hacer crecer tu negocio paso a paso.',
      bgColor: 'bg-blue-200',
      textTitleColor: 'text-blue-600',
      textSubtitleColor: 'text-blue-900',
      image: '/hero/banner/banner-2.png'
    },
    {
      title: 'Tu ahorro tiene recompensa',
      subtitle: 'Pide tu Préstamo Digital y participa por uno de nuestros ¡10 premios especiales!',
      bgColor: 'bg-white',
      textTitleColor: 'text-green-600',
      textSubtitleColor: 'text-green-900',
      image: '/hero/banner/banner-3.png'
    }
  ];

  currentSlide = signal(0);
  intervalId: any;

  ngOnInit() {
    this.startAutoPlay();
  }

  ngOnDestroy() {
    this.stopAutoPlay();
  }

  startAutoPlay() {
    this.stopAutoPlay();
    this.intervalId = setInterval(() => {
      this.next();
    }, 5000);
  }

  stopAutoPlay() {
    if (this.intervalId) clearInterval(this.intervalId);
  }

  next() {
    this.currentSlide.update(curr => (curr + 1) % this.slides.length);
  }

  prev() {
    this.currentSlide.update(curr => (curr - 1 + this.slides.length) % this.slides.length);
  }

  // Swipe logic
  private touchStartX = 0;
  private touchEndX = 0;

  // Touch Events
  onTouchStart(event: TouchEvent) {
    this.touchStartX = event.changedTouches[0].screenX;
  }

  onTouchEnd(event: TouchEvent) {
    this.touchEndX = event.changedTouches[0].screenX;
    this.handleSwipe();
  }

  // Mouse Events (for Desktop Drag)
  onMouseDown(event: MouseEvent) {
    this.touchStartX = event.clientX;
  }

  onMouseUp(event: MouseEvent) {
    this.touchEndX = event.clientX;
    this.handleSwipe();
  }

  handleSwipe() {
    const threshold = 50; // Minimum distance to be considered a swipe
    if (this.touchEndX < this.touchStartX - threshold) {
      this.next(); // Swipe Left -> Next
    }
    if (this.touchEndX > this.touchStartX + threshold) {
      this.prev(); // Swipe Right -> Prev
    }
  }

  goToSlide(index: number) {
    this.currentSlide.set(index);
    this.startAutoPlay(); // Reset timer
  }
}
