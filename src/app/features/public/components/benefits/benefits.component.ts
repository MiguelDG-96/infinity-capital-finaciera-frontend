import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, ArrowRight, CreditCard, Gift, Shield, Zap } from 'lucide-angular';

@Component({
  selector: 'app-benefits',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './benefits.component.html',
})
export class BenefitsComponent {
  readonly ArrowRight = ArrowRight;
  readonly CreditCard = CreditCard;
  readonly Gift = Gift;
  readonly Shield = Shield;
  readonly Zap = Zap;
}
