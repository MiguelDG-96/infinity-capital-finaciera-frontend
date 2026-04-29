import { Component, OnInit, inject, signal, computed, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { RolService } from '../../../../core/services/rol.service';
import { ModuloService } from '../../../../core/services/modulo.service';
import { PermisoService } from '../../../../core/services/permiso.service';
import { UsuarioService } from '../../../../core/services/usuario.service';
import { Rol } from '../../../../core/models/rol.model';
import { Modulo } from '../../../../core/models/modulo.model';
import { Permiso } from '../../../../core/models/permiso.model';
import { Usuario, UsuarioRequest } from '../../../../core/models/usuario.model';
import { forkJoin } from 'rxjs';

interface MatrixRow {
  modulo: Modulo;
  permiso: Permiso;
  isSaving: boolean;
}

@Component({
  selector: 'app-admin-seguridad',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './admin-seguridad.component.html'
})
export class AdminSeguridadComponent implements OnInit {
  private rolService = inject(RolService);
  private moduloService = inject(ModuloService);
  private permisoService = inject(PermisoService);
  private cdr = inject(ChangeDetectorRef);

  roles = signal<Rol[]>([]);
  modulosBase = signal<Modulo[]>([]);
  selectedRolId = signal<number | null>(null);
  
  matrixRows = signal<MatrixRow[]>([]);
  isLoading = signal<boolean>(true);

  // Gestión de Usuarios
  activeTab = signal<'usuarios' | 'permisos'>('usuarios');
  usuarios = signal<Usuario[]>([]);
  rolesParaUsuarios = signal<any[]>([]);
  mostrarModalUsuario = signal<boolean>(false);
  editandoUsuario = signal<Usuario | null>(null);
  
  usuarioForm: UsuarioRequest = {
    email: '',
    nombreCompleto: '',
    rolId: 0,
    contrasena: ''
  };

  private usuarioService = inject(UsuarioService);

  ngOnInit() {
    this.cargarDatosIniciales();
    this.cargarUsuarios();
  }

  cargarUsuarios() {
    this.usuarioService.listarUsuarios().subscribe(data => this.usuarios.set(data));
    this.usuarioService.listarRoles().subscribe(data => this.rolesParaUsuarios.set(data));
  }

  abrirModalUsuario(user: Usuario | null = null) {
    this.editandoUsuario.set(user);
    if (user) {
      this.usuarioForm = {
        email: user.email,
        nombreCompleto: user.nombreCompleto,
        rolId: user.rol.id,
        contrasena: ''
      };
    } else {
      this.usuarioForm = { email: '', nombreCompleto: '', rolId: 0, contrasena: '' };
    }
    this.mostrarModalUsuario.set(true);
  }

  guardarUsuario() {
    const obs = this.editandoUsuario() 
      ? this.usuarioService.actualizarUsuario(this.editandoUsuario()!.id, this.usuarioForm)
      : this.usuarioService.crearUsuario(this.usuarioForm);

    obs.subscribe({
      next: () => {
        this.mostrarModalUsuario.set(false);
        this.cargarUsuarios();
      },
      error: (err) => alert(err.error?.mensaje || 'Error al guardar usuario')
    });
  }

  toggleEstadoUsuario(user: Usuario) {
    this.usuarioService.cambiarEstado(user.id, !user.habilitado).subscribe(() => {
      this.cargarUsuarios();
    });
  }

  cargarDatosIniciales() {
    this.isLoading.set(true);
    forkJoin({
      roles: this.rolService.listar(),
      modulos: this.moduloService.listar()
    }).subscribe({
      next: (res) => {
        // Exclude ROLE_ADMIN as in legacy (they have native access)
        const editableRoles = res.roles.filter(r => r.nombre !== 'ROLE_ADMIN');
        this.roles.set(editableRoles);
        this.modulosBase.set(res.modulos);
        
        if (editableRoles.length > 0) {
          const firstRolId = editableRoles[0].id;
          this.selectedRolId.set(firstRolId);
          this.cargarMatriz(firstRolId);
        } else {
          this.isLoading.set(false);
          this.cdr.detectChanges();
        }
      },
      error: () => {
        alert('Error cargando datos base');
        this.isLoading.set(false);
        this.cdr.detectChanges();
      }
    });
  }

  onRolChange(event: Event) {
    const value = (event.target as HTMLSelectElement).value;
    if (value) {
      const id = parseInt(value, 10);
      this.selectedRolId.set(id);
      this.cargarMatriz(id);
    }
  }

  cargarMatriz(rolId: number) {
    this.isLoading.set(true);
    this.permisoService.listarPorRol(rolId).subscribe({
      next: (permisosAsignados) => {
        // Map as in legacy by modulo nombre or moduloId
        const mapAsignados = new Map<number, Permiso>();
        
        // Since backend might return modulo string but we want to map robustly:
        // Try mapping by name if moduloId is missing directly (as legacy did)
        permisosAsignados.forEach(p => {
           // We will try finding the module matching by Name (or assume the backend populated moduloId correctly)
           const modTarget = this.modulosBase().find(m => m.nombre === p.modulo || m.id === p.moduloId);
           if (modTarget && modTarget.id) {
             mapAsignados.set(modTarget.id, p);
           }
        });

        const rows: MatrixRow[] = this.modulosBase().map(mod => {
          const asignado = mapAsignados.get(mod.id!) || {
            rolId: rolId,
            moduloId: mod.id!,
            verModulo: false,
            pView: false,
            pCreate: false,
            pUpdate: false,
            pDelete: false
          };
          
          return {
            modulo: mod,
            permiso: { ...asignado, rolId, moduloId: mod.id! }, // Ensure IDs are bound
            isSaving: false
          };
        });

        this.matrixRows.set(rows);
        this.isLoading.set(false);
        this.cdr.detectChanges();
      },
      error: () => {
        alert('Error cargando matriz');
        this.isLoading.set(false);
        this.cdr.detectChanges();
      }
    });
  }

  handleToggleChange(row: MatrixRow, property: keyof Permiso, checked: boolean) {
    if (row.isSaving) return; // Prevent double trigger
    
    // Applying dependency logic (if verModulo becomes false, everything else goes false)
    if (property === 'verModulo' && !checked) {
      row.permiso.pView = false;
      row.permiso.pCreate = false;
      row.permiso.pUpdate = false;
      row.permiso.pDelete = false;
    }
    
    // Set the specific property
    (row.permiso as any)[property] = checked;

    this.saveRow(row);
  }

  private saveRow(row: MatrixRow) {
    row.isSaving = true;
    
    const isEdicion = !!row.permiso.id;
    const request$ = isEdicion 
      ? this.permisoService.actualizar(row.permiso.id!, row.permiso)
      : this.permisoService.asignar(row.permiso);

    request$.subscribe({
      next: (res) => {
        row.permiso.id = res.id; // Capture ID if it was newly created
        row.isSaving = false;
        // The array is mutated, change detection is fine for properties, 
        // but we can trigger a signal update if necessary
        this.matrixRows.update(rows => [...rows]);
      },
      error: () => {
        // Rollback on error
        alert('Falló el guardado automático');
        row.isSaving = false;
        // Safe bet: reload matrix from server to restore correct state
        const rol = this.selectedRolId();
        if (rol) this.cargarMatriz(rol);
      }
    });
  }
}
