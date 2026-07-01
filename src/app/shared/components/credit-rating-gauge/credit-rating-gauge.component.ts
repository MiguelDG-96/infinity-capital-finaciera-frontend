import { Component, Input, OnChanges, SimpleChanges, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { animate } from 'animejs';

export type CreditRating = 'NORMAL' | 'PROBLEMAS_POTENCIALES' | 'DEFICIENTE' | 'DUDOSO' | 'PERDIDA';

@Component({
  selector: 'app-credit-rating-gauge',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './credit-rating-gauge.component.html',
  styleUrls: ['./credit-rating-gauge.component.css']
})
export class CreditRatingGaugeComponent implements OnChanges, AfterViewInit {
  @Input() rating: CreditRating = 'NORMAL';
  @Input() size: number = 300; // Ancho del SVG

  @ViewChild('needle') needleElement!: ElementRef<SVGElement>;

  // Grados por calificación (0 a 180, donde 0 es izquierda y 180 es derecha)
  private readonly ratingAngles: Record<CreditRating, number> = {
    'NORMAL': 18,               // Centro de la 1ra sección (0-36)
    'PROBLEMAS_POTENCIALES': 54, // Centro de la 2da sección (36-72)
    'DEFICIENTE': 90,           // Centro de la 3ra sección (72-108)
    'DUDOSO': 126,              // Centro de la 4ta sección (108-144)
    'PERDIDA': 162              // Centro de la 5ta sección (144-180)
  };

  private readonly ratingLabels: Record<CreditRating, string> = {
    'NORMAL': 'Normal',
    'PROBLEMAS_POTENCIALES': 'Problemas Potenciales',
    'DEFICIENTE': 'Deficiente',
    'DUDOSO': 'Dudoso',
    'PERDIDA': 'Pérdida'
  };

  private readonly ratingColors: Record<CreditRating, string> = {
    'NORMAL': '#16a34a',
    'PROBLEMAS_POTENCIALES': '#84cc16',
    'DEFICIENTE': '#eab308',
    'DUDOSO': '#f97316',
    'PERDIDA': '#ef4444'
  };

  currentAngle = 0; // Ángulo actual de la aguja

  ngAfterViewInit(): void {
    this.animateNeedle(this.ratingAngles[this.rating]);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['rating'] && !changes['rating'].firstChange) {
      this.animateNeedle(this.ratingAngles[this.rating]);
    }
  }

  private animateNeedle(targetAngle: number): void {
    if (!this.needleElement) return;

    animate(this.needleElement.nativeElement, {
      rotate: [this.currentAngle, targetAngle],
      duration: 1500,
      ease: 'outElastic(1, .6)', // v4 format usually is outElastic or string
      onComplete: () => {
        this.currentAngle = targetAngle;
      }
    });
  }

  get currentLabel(): string {
    return this.ratingLabels[this.rating] || 'Desconocido';
  }

  get currentColor(): string {
    return this.ratingColors[this.rating] || '#94a3b8';
  }
}
