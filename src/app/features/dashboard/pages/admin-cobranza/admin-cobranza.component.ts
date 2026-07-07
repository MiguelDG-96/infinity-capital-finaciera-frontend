import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { NotificationService, PendienteCobranzaItem } from '../../../../core/services/notification.service';
import { CreditoService } from '../../../../core/services/credito.service';
import { CartaCobranzaPdfService } from '../../../../core/services/carta-cobranza-pdf.service';
import { ToastService } from '../../../../core/services/toast.service';
import { delay, firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-admin-cobranza',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './admin-cobranza.component.html',
})
export class AdminCobranzaComponent implements OnInit {
  private notificationService = inject(NotificationService);
  private creditoService = inject(CreditoService);
  private pdfService = inject(CartaCobranzaPdfService);
  private toastService = inject(ToastService);

  readonly pendientes = this.notificationService.pendientesCobranza;

  // Computed signals para separar por niveles
  readonly nivel1 = computed(() => this.pendientes().filter(p => p.nivel === 1));
  readonly nivel2 = computed(() => this.pendientes().filter(p => p.nivel === 2));
  readonly nivel3 = computed(() => this.pendientes().filter(p => p.nivel === 3));

  // Estados para la UI
  isLoading = signal(false);
  
  // Estado del proceso de envío masivo
  sendingProgress = signal({
    isActive: false,
    nivel: 0,
    total: 0,
    current: 0,
    success: 0,
    failed: 0,
    logs: [] as string[]
  });

  ngOnInit() {
    this.recargar();
  }

  recargar() {
    this.notificationService.recargar();
  }

  async enviarMasivo(nivel: number) {
    if (this.sendingProgress().isActive) return;

    let targetList: PendienteCobranzaItem[] = [];
    if (nivel === 1) targetList = this.nivel1();
    if (nivel === 2) targetList = this.nivel2();
    if (nivel === 3) targetList = this.nivel3();

    if (targetList.length === 0) {
      this.toastService.show('No hay clientes en este nivel.', 'warning');
      return;
    }

    this.sendingProgress.set({
      isActive: true,
      nivel,
      total: targetList.length,
      current: 0,
      success: 0,
      failed: 0,
      logs: []
    });

    for (let i = 0; i < targetList.length; i++) {
      const item = targetList[i];
      this.updateProgress(i + 1, `Generando carta para ${item.clienteNombre}...`);
      
      try {
        // 1. Obtener crédito y cronograma
        const credito = await firstValueFrom(this.creditoService.obtenerCreditoPorIdAdmin(item.creditoId));
        const cuotas = await firstValueFrom(this.creditoService.obtenerCronogramaAdmin(item.creditoId));
        
        // 2. Generar PDF
        const pdfBlob = await this.pdfService.generarCarta(credito, cuotas, nivel, false);

        // 3. Enviar correo al titular
        this.updateProgress(i + 1, `Enviando correo a ${item.clienteEmail || 'titular'}...`);
        const email = item.clienteEmail || 'noreply@infinitycapital.com'; // Fallback
        await firstValueFrom(this.creditoService.enviarCartaCobranza(item.creditoId, pdfBlob, email, item.clienteNombre, nivel));
        
        // 4. (Opcional) Si el nivel requiere, podríamos enviar al garante aquí también.

        this.sendingProgress.update(s => ({ ...s, success: s.success + 1 }));
      } catch (error: any) {
        console.error('Error enviando carta', error);
        this.sendingProgress.update(s => ({ ...s, failed: s.failed + 1, logs: [...s.logs, `Error con ${item.clienteNombre}: ${error.message || 'Desconocido'}`] }));
      }
    }

    this.updateProgress(targetList.length, `Envío masivo finalizado.`);
    this.toastService.show(`Envíos completados: ${this.sendingProgress().success} éxitos, ${this.sendingProgress().failed} fallos.`, 'success');
    
    // Al final del proceso, esperamos unos segundos y cerramos el modal
    setTimeout(() => {
      this.cerrarModalProgreso();
      this.recargar(); // Recargar la lista por si hubo actualizaciones (aunque idealmente el backend marcaría que se envió, si implementamos eso)
    }, 4000);
  }

  private updateProgress(current: number, logMsg: string) {
    this.sendingProgress.update(s => ({
      ...s,
      current,
      logs: [logMsg, ...s.logs].slice(0, 5) // Mantener últimos 5 logs
    }));
  }

  cerrarModalProgreso() {
    this.sendingProgress.update(s => ({ ...s, isActive: false }));
  }
}
