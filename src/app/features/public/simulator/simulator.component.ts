import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { TasasService } from '../../../core/services/tasas.service';
import { TipoCredito } from '../../../core/models/tasas.model';
import { LucideAngularModule } from 'lucide-angular';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-simulator',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule, RouterLink],
  templateUrl: './simulator.component.html',
  styleUrls: ['./simulator.component.css']
})
export class SimulatorComponent implements OnInit {
  private tasasService = inject(TasasService);
  
  tipos = signal<TipoCredito[]>([]);
  selectedTipoId: number | null = null;
  amount = 5000;
  term = 12;
  Math = Math;

  ngOnInit() {
    this.tasasService.getTiposPublicos().subscribe(tipos => {
      this.tipos.set(tipos);
      if (tipos.length > 0) {
        this.selectedTipoId = tipos[0].id;
      }
    });
  }

  currentRate() {
    const tipoId = this.selectedTipoId;
    const amount = this.amount;
    const tipo = this.tipos().find(t => t.id == tipoId);
    
    if (!tipo) return 5; // Default fallback

    // Buscar en rangos
    if (tipo.rangos && tipo.rangos.length > 0) {
      const rango = tipo.rangos.find(r => amount >= r.montoMinimo && amount <= r.montoMaximo);
      if (rango) return rango.tasaMensual;
    }

    return tipo.temDefecto;
  }

  calculateQuota(): number {
    const p = this.amount;
    const n = this.term;
    if (p <= 0 || n <= 0) return 0;
    
    // Tasa mensual en decimal
    const i = this.currentRate() / 100;
    
    if (i === 0) return p / n;

    // Fórmula Francesa: R = P * (i * (1 + i)^n) / ((1 + i)^n - 1)
    const factor = (i * Math.pow(1 + i, n)) / (Math.pow(1 + i, n) - 1);
    const result = p * factor;
    return Math.round(result * 10) / 10;
  }
}
