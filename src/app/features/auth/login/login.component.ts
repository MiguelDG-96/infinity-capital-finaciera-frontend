import { Component, signal, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { ThemeService } from '../../../core/services/theme.service';
import { AuthService } from '../../../core/services/auth.service';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})
export class LoginComponent implements OnInit, OnDestroy {
  public themeService = inject(ThemeService);
  private authService = inject(AuthService);
  private fb = inject(FormBuilder);
  private router = inject(Router);

  showPassword = signal(false);
  isLoading = signal(false);
  errorMessage = signal<string | null>(null);
  currentSlide = signal(0);
  private intervalId: any;

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
  
  loginForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    remember: [false]
  });

  ngOnInit() {
    this.startAutoPlay();
    
    // Check for remembered email and password
    const rememberedEmail = localStorage.getItem('infinity_remembered_email');
    const rememberedPassword = localStorage.getItem('infinity_remembered_password');
    if (rememberedEmail) {
      this.loginForm.patchValue({
        email: rememberedEmail,
        password: rememberedPassword || '',
        remember: true
      });
    }
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
    if (this.loginForm.valid) {
      this.isLoading.set(true);
      this.errorMessage.set(null);

      const credentials = {
        email: this.loginForm.value.email!,
        contrasena: this.loginForm.value.password!
      };

      this.authService.login(credentials).subscribe({
        next: () => {
          // Guardar o eliminar el recordatorio de sesión
          if (this.loginForm.value.remember) {
            localStorage.setItem('infinity_remembered_email', this.loginForm.value.email!);
            localStorage.setItem('infinity_remembered_password', this.loginForm.value.password!);
          } else {
            localStorage.removeItem('infinity_remembered_email');
            localStorage.removeItem('infinity_remembered_password');
          }
          this.router.navigate(['/dashboard']);
        },
        error: (err) => {
          this.isLoading.set(false);
          const msg = err.error?.mensaje || err.error?.message || 'Error de autenticación. Por favor, intenta de nuevo.';
          this.errorMessage.set(msg);
          console.error('Login error:', err);
        }
      });
    }
  }
}
