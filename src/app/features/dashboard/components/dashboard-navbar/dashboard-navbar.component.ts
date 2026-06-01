import { Component, OnInit, OnDestroy, output, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { debounceTime, distinctUntilChanged, switchMap, catchError, map } from 'rxjs/operators';
import { of } from 'rxjs';

import { ThemeService } from '../../../../core/services/theme.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { AuthService } from '../../../../core/services/auth.service';
import { CreditoService } from '../../../../core/services/credito.service';
import { Credito } from '../../../../core/models/credito.model';

@Component({
  selector: 'app-dashboard-navbar',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, ReactiveFormsModule],
  templateUrl: './dashboard-navbar.component.html',
  styleUrl: './dashboard-navbar.component.css',
})
export class DashboardNavbarComponent implements OnInit, OnDestroy {
  private router = inject(Router);
  private creditoService = inject(CreditoService);

  searchControl = new FormControl('');
  searchResults = signal<Credito[]>([]);
  isSearching = signal(false);
  showDropdown = signal(false);

  constructor(
    public themeService: ThemeService,
    public notificationService: NotificationService,
    public authService: AuthService
  ) {}

  get userFullName(): string {
    return this.authService.currentUserData()?.nombreCompleto || 'Usuario';
  }

  get userPhotoUrl(): string | null {
    return this.authService.currentUserData()?.fotoUrl || null;
  }

  get userInitials(): string {
    const name = this.userFullName.trim();
    if (!name || name === 'Usuario') return 'US';
    
    const parts = name.split(' ');
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  
  toggleSidebar = output<void>();
  logoutRequested = output<void>();

  onToggleSidebar() {
    this.toggleSidebar.emit();
  }

  onToggleDarkMode() {
    this.themeService.toggleDarkMode();
  }

  onToggleNotifications() {
    this.notificationService.toggle();
    if (this.notificationService.isOpen()) {
      this.notificationService.recargar();
    }
  }

  ngOnInit() {
    const rol = this.authService.currentUserData()?.rol || '';
    const isAdmin = rol === 'ROLE_ADMIN' || rol === 'ROLE_TRABAJADOR';
    if (isAdmin) {
      this.notificationService.iniciarPolling();

      // Configurar buscador
      this.searchControl.valueChanges.pipe(
        debounceTime(300),
        distinctUntilChanged(),
        switchMap(term => {
          if (!term || term.trim().length < 2) {
            this.showDropdown.set(false);
            this.searchResults.set([]);
            return of([]);
          }
          this.isSearching.set(true);
          this.showDropdown.set(true);
          const searchTerm = term.toLowerCase().trim();
          
          return this.creditoService.obtenerCarteraGeneral().pipe(
            map(creditos => {
              return creditos.filter(c => 
                c.id.toString() === searchTerm ||
                (c.nombreCliente && c.nombreCliente.toLowerCase().includes(searchTerm)) ||
                (c.documento && c.documento.includes(searchTerm))
              ).slice(0, 6); // Limitar a 6 resultados
            }),
            catchError(() => of([]))
          );
        })
      ).subscribe(results => {
        this.searchResults.set(results);
        this.isSearching.set(false);
      });
    }
  }

  goToCredit(creditoId: number) {
    this.showDropdown.set(false);
    this.searchControl.setValue('', { emitEvent: false });
    this.router.navigate(['/dashboard/admin/cartera', creditoId]);
  }

  ngOnDestroy() {
    this.notificationService.detenerPolling();
  }

  hideDropdown() {
    setTimeout(() => this.showDropdown.set(false), 200);
  }
}
