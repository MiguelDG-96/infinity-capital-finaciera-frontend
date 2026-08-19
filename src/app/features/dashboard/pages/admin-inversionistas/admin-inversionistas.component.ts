import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, Search, Clock, AlertCircle, Eye, CheckCircle, XCircle, Building, User, Mail, Phone, Calendar, Landmark, CreditCard } from 'lucide-angular';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { InversionistaProspectoService, InversionistaProspecto } from '../../../../core/services/inversionista-prospecto.service';

@Component({
  selector: 'app-admin-inversionistas',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, FormsModule],
  templateUrl: './admin-inversionistas.component.html'
})
export class AdminInversionistasComponent implements OnInit {
  private prospectoService = inject(InversionistaProspectoService);
  private cdr = inject(ChangeDetectorRef);
  private route = inject(ActivatedRoute);

  readonly Search = Search;
  readonly Clock = Clock;
  readonly AlertCircle = AlertCircle;
  readonly Eye = Eye;
  readonly CheckCircle = CheckCircle;
  readonly XCircle = XCircle;
  readonly Building = Building;
  readonly User = User;
  readonly Mail = Mail;
  readonly Phone = Phone;
  readonly Calendar = Calendar;
  readonly Landmark = Landmark;
  readonly CreditCard = CreditCard;

  prospectos: InversionistaProspecto[] = [];
  isLoading = true;
  searchTerm = '';
  
  // Modal state
  isDetalleModalOpen = false;
  selectedProspecto: InversionistaProspecto | null = null;

  ngOnInit() {
    this.cargarProspectos();
  }

  cargarProspectos() {
    this.isLoading = true;
    this.prospectoService.listarProspectos().subscribe({
      next: (data) => {
        this.prospectos = data;
        this.isLoading = false;
        this.cdr.detectChanges();

        // Si venimos de una notificación con ?detalle=ID, abrir el modal en el siguiente tick
        // para evitar NG0100 (ExpressionChangedAfterItHasBeenChecked)
        const detalleId = this.route.snapshot.queryParamMap.get('detalle');
        if (detalleId) {
          const prospecto = this.prospectos.find(p => p.id === Number(detalleId));
          if (prospecto) {
            setTimeout(() => {
              this.openDetalleModal(prospecto);
              this.cdr.detectChanges();
            }, 0);
          }
        }
      },
      error: (err) => {
        console.error('Error cargando prospectos', err);
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  cambiarEstado(id: number, nuevoEstado: string) {
    this.prospectoService.actualizarEstado(id, nuevoEstado).subscribe({
      next: () => {
        this.cargarProspectos();
        
        // If modal is open and the current prospect is the one being updated, update the state in modal or close it
        if (this.selectedProspecto && this.selectedProspecto.id === id) {
          this.selectedProspecto.estado = nuevoEstado;
          // Optionally close modal after action:
          this.closeDetalleModal();
        }
      },
      error: (err) => console.error('Error actualizando estado', err)
    });
  }

  openDetalleModal(prospecto: InversionistaProspecto) {
    this.selectedProspecto = prospecto;
    this.isDetalleModalOpen = true;
  }

  closeDetalleModal() {
    this.isDetalleModalOpen = false;
    setTimeout(() => {
      this.selectedProspecto = null;
    }, 300); // Wait for animation
  }

  get filteredProspectos() {
    return this.prospectos.filter(p => 
      p.nombres.toLowerCase().includes(this.searchTerm.toLowerCase()) || 
      p.dni.includes(this.searchTerm) ||
      p.email.toLowerCase().includes(this.searchTerm.toLowerCase())
    );
  }
}
