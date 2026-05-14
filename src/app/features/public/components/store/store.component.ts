import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, CheckCircle2, ChevronDown } from 'lucide-angular';
import { Router } from '@angular/router';

@Component({
  selector: 'app-store',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './store.component.html',
  styleUrl: './store.component.css'
})
export class StoreComponent {
  private router = inject(Router);
  
  readonly CheckCircle2 = CheckCircle2;
  readonly ChevronDown = ChevronDown;
  
  docType = 'DNI';
  docNumber = '';
  isChecking = false;

  onSubmit() {
    if (!this.docNumber || this.docNumber.length < 8) {
      alert('Por favor, ingresa un número de documento válido.');
      return;
    }

    this.isChecking = true;
    
    // Simulamos una consulta al backend de 1.5 segundos
    setTimeout(() => {
      this.isChecking = false;
      // Redirigimos al registro para que el cliente continúe con su producto pre-aprobado
      this.router.navigate(['/register'], { 
        queryParams: { 
          docType: this.docType, 
          docNumber: this.docNumber,
          preapproved: true 
        } 
      });
    }, 1500);
  }
}
