import { Directive, ElementRef, HostListener, Renderer2 } from '@angular/core';

@Directive({
  selector: '[appHover3d]',
  standalone: true,
})
export class Hover3dDirective {
  private el: HTMLElement;

  constructor(private elementRef: ElementRef, private renderer: Renderer2) {
    this.el = this.elementRef.nativeElement;
    // Aplicar estilos base necesarios para el efecto 3D
    this.renderer.setStyle(this.el, 'transform-style', 'preserve-3d');
    this.renderer.setStyle(this.el, 'transition', 'transform 0.1s ease-out, box-shadow 0.1s ease-out');
    this.renderer.setStyle(this.el, 'will-change', 'transform');
  }

  @HostListener('mousemove', ['$event'])
  onMouseMove(event: MouseEvent): void {
    const rect = this.el.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    // Máximo de 12 grados de rotación
    const rotateY = ((x - centerX) / centerX) * 12;
    const rotateX = -((y - centerY) / centerY) * 12;

    this.renderer.setStyle(
      this.el,
      'transform',
      `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`
    );
    this.renderer.setStyle(
      this.el,
      'box-shadow',
      `${-rotateY * 1.5}px ${rotateX * 1.5}px 30px rgba(0,0,0,0.25)`
    );
  }

  @HostListener('mouseleave')
  onMouseLeave(): void {
    this.renderer.setStyle(
      this.el,
      'transform',
      'perspective(800px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)'
    );
    this.renderer.setStyle(this.el, 'transition', 'transform 0.4s ease, box-shadow 0.4s ease');
    this.renderer.setStyle(this.el, 'box-shadow', '');
  }

  @HostListener('mouseenter')
  onMouseEnter(): void {
    this.renderer.setStyle(this.el, 'transition', 'transform 0.1s ease-out, box-shadow 0.1s ease-out');
  }
}
