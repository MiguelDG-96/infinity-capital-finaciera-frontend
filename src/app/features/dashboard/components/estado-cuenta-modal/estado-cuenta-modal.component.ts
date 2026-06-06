import { Component, Input, Output, EventEmitter, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Credito, Cuota } from '../../../../core/models/credito.model';
import { CreditoService } from '../../../../core/services/credito.service';
import { EstadoCuentaPdfService } from '../../../../core/services/estado-cuenta-pdf.service';

type ModalState = 'generando' | 'preview' | 'enviando' | 'exito' | 'error';

@Component({
  selector: 'app-estado-cuenta-modal',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './estado-cuenta-modal.component.html',
  styleUrl: './estado-cuenta-modal.component.css'
})
export class EstadoCuentaModalComponent implements OnInit {
  @Input({ required: true }) credito!: Credito;
  @Output() cerrar = new EventEmitter<void>();

  estado = signal<ModalState>('generando');
  errorMsg = signal('');
  pdfBlob: Blob | null = null;
  pdfUrl: string | null = null;
  safePdfUrl: SafeResourceUrl | null = null;
  cuotas: Cuota[] = [];

  get emailCliente(): string {
    return (this.credito.cliente as any)?.usuario?.email || '—';
  }

  constructor(
    private creditoService: CreditoService,
    private pdfService: EstadoCuentaPdfService,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit(): void {
    this.cargarYGenerar();
  }

  private async cargarYGenerar(): Promise<void> {
    this.estado.set('generando');
    try {
      // Cargar el cronograma completo
      this.cuotas = await new Promise<Cuota[]>((resolve, reject) => {
        this.creditoService.obtenerCronogramaAdmin(this.credito.id).subscribe({
          next: resolve,
          error: reject
        });
      });

      // Generar PDF
      this.pdfBlob = await this.pdfService.generarEstadoCuenta(this.credito, this.cuotas);
      this.pdfUrl = URL.createObjectURL(this.pdfBlob);
      this.safePdfUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this.pdfUrl);
      this.estado.set('preview');
    } catch (err: any) {
      this.errorMsg.set(err?.message || 'Error al generar el PDF');
      this.estado.set('error');
    }
  }

  descargarPdf(): void {
    if (!this.pdfBlob) return;
    const a = document.createElement('a');
    a.href = URL.createObjectURL(this.pdfBlob);
    a.download = `EstadoCuenta_Credito_${this.credito.id}.pdf`;
    a.click();
  }

  async enviarEmail(): Promise<void> {
    if (!this.pdfBlob) return;
    this.estado.set('enviando');
    this.creditoService.enviarEstadoCuenta(this.credito.id, this.pdfBlob).subscribe({
      next: () => this.estado.set('exito'),
      error: (err) => {
        this.errorMsg.set(err?.error?.error || err?.message || 'Error al enviar el correo');
        this.estado.set('error');
      }
    });
  }

  reintentar(): void {
    this.cargarYGenerar();
  }

  onCerrar(): void {
    if (this.pdfUrl) URL.revokeObjectURL(this.pdfUrl);
    this.cerrar.emit();
  }
}
