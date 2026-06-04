import { Component, signal, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { ThemeService } from '../../../core/services/theme.service';
import { AuthService } from '../../../core/services/auth.service';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, ReactiveFormsModule, RouterLink],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css',
})
export class RegisterComponent implements OnInit, OnDestroy {
  public themeService = inject(ThemeService);
  private authService = inject(AuthService);
  private fb = inject(FormBuilder);
  private router = inject(Router);

  showPassword = signal(false);
  isLoading = signal(false);
  errorMessage = signal<string | null>(null);
  currentSlide = signal(0);

  slides = [
    {
      image: 'login/banner-1.svg',
      phrase: '¡Tus finanzas bajo control!',
      position: 'top-4 right-4',
      tailPosition: '-bottom-2 right-8'
    },
    {
      image: 'login/banner-2.svg',
      phrase: 'Seguridad en cada préstamo',
      position: 'top-12 left-4',
      tailPosition: '-bottom-2 left-8'
    },
    {
      image: 'login/banner-3.svg',
      phrase: 'Convierte ahorros en ganancias',
      position: 'top-2 center-x',
      tailPosition: '-bottom-2 left-1/2 -translate-x-1/2'
    }
  ];
  
  registerForm = this.fb.group({
    nombres: ['', [Validators.required, Validators.minLength(2)]],
    apellidoPaterno: ['', [Validators.required, Validators.minLength(2)]],
    apellidoMaterno: [''],
    email: ['', [Validators.required, Validators.email]],
    telefono: ['', [Validators.required, Validators.pattern(/^[0-9+]{8,15}$/)]],
    contrasena: ['', [Validators.required, Validators.minLength(8)]],
  });

  private intervalId: any;

  ngOnInit() {
    this.startAutoPlay();
  }

  ngOnDestroy() {
    this.stopAutoPlay();
  }

  startAutoPlay() {
    this.intervalId = setInterval(() => {
      this.nextSlide();
    }, 5000);
  }

  stopAutoPlay() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }

  nextSlide() {
    this.currentSlide.update(v => (v + 1) % this.slides.length);
  }

  setSlide(index: number) {
    this.currentSlide.set(index);
    this.stopAutoPlay();
    this.startAutoPlay();
  }

  togglePassword() {
    this.showPassword.update(v => !v);
  }

  onSubmit() {
    if (this.registerForm.valid) {
      this.isLoading.set(true);
      this.errorMessage.set(null);

      const request = {
        nombres: this.registerForm.value.nombres!,
        apellidoPaterno: this.registerForm.value.apellidoPaterno!,
        apellidoMaterno: this.registerForm.value.apellidoMaterno || '',
        email: this.registerForm.value.email!,
        telefono: this.registerForm.value.telefono!,
        contrasena: this.registerForm.value.contrasena!
      };

      this.authService.register(request).subscribe({
        next: (response) => {
          this.router.navigate(['/verify'], { 
            queryParams: { email: request.email },
            state: { message: response.mensaje }
          });
        },
        error: (err) => {
          this.isLoading.set(false);
          // Extract specific error message from backend
          const msg = err.error?.mensaje || err.error?.message || 'Error al crear el perfil. Por favor, intenta de nuevo.';
          this.errorMessage.set(msg);
          console.error('Registration error:', err);
        }
      });
    }
  }
}
