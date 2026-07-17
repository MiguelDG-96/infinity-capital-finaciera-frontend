import { Directive, ElementRef, OnInit, OnDestroy, Input } from '@angular/core';

@Directive({
  selector: '[appScrollReveal]',
  standalone: true
})
export class ScrollRevealDirective implements OnInit, OnDestroy {
  @Input('appScrollReveal') animationClass: string = 'reveal-up';
  @Input() delay: string = '';

  private observer!: IntersectionObserver;

  constructor(private el: ElementRef) {}

  ngOnInit() {
    if (typeof window === 'undefined') return;

    const element = this.el.nativeElement as HTMLElement;

    if (!this.animationClass) {
      this.animationClass = 'reveal-up';
    }

    // Añadir las clases de estado inicial.
    // La animación arranca desde opacity:0 definida dentro del @keyframes,
    // así que no hay condición de carrera con el browser.
    element.classList.add('reveal-base', this.animationClass);
    if (this.delay) {
      element.classList.add(this.delay);
    }

    this.observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          // Añadir is-visible dispara el @keyframes automáticamente.
          // No necesitamos setTimeout ni requestAnimationFrame.
          element.classList.add('is-visible');
          this.observer.disconnect();
        }
      });
    }, {
      threshold: 0,
      rootMargin: '50px 0px -40px 0px'
    });

    this.observer.observe(element);
  }

  ngOnDestroy() {
    if (this.observer) {
      this.observer.disconnect();
    }
  }
}


