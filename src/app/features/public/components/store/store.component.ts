import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, CheckCircle2, ChevronDown } from 'lucide-angular';

@Component({
  selector: 'app-store',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './store.component.html',
  styleUrl: './store.component.css'
})
export class StoreComponent {
  readonly CheckCircle2 = CheckCircle2;
  readonly ChevronDown = ChevronDown;
  
  docType = 'DNI';
  docNumber = '';

  onSubmit() {
    console.log('Consultando:', this.docType, this.docNumber);
    // Logic to consult pre-approved products
  }
}
