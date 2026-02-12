import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, Banknote, ShieldCheck, Clock, Zap, Heart, Star, Sparkles, TrendingUp, HandCoins } from 'lucide-angular';

@Component({
  selector: 'app-infinycapital-info',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './infinycapital-info.component.html',
})
export class InfinyCapitalInfoComponent {
  readonly Banknote = Banknote;
  readonly ShieldCheck = ShieldCheck;
  readonly Clock = Clock;
  readonly Zap = Zap;
  readonly Heart = Heart;
  readonly HandCoins = HandCoins;
  readonly Star = Star;
  readonly Sparkles = Sparkles;
  readonly TrendingUp = TrendingUp;
}
