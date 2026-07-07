import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { CobranzaAutoService } from '../../../../core/services/cobranza-auto.service';

@Component({
  selector: 'app-cobranza-progress-widget',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './cobranza-progress-widget.component.html',
  styleUrls: ['./cobranza-progress-widget.component.css']
})
export class CobranzaProgressWidgetComponent {
  readonly cobranzaService = inject(CobranzaAutoService);
}
