import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { ThemeService } from '../../../core/services/theme.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, LucideAngularModule],
  templateUrl: './forgot-password.html',
  styleUrl: './forgot-password.css',
})
export class ForgotPassword {
  public themeService = inject(ThemeService);
  private authService = inject(AuthService);
  private fb = inject(FormBuilder);
  private router = inject(Router);

  isLoading = signal(false);
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]]
  });

  onSubmit() {
    if (this.form.valid) {
      this.isLoading.set(true);
      this.errorMessage.set(null);
      this.successMessage.set(null);

      const email = this.form.value.email!;

      this.authService.forgotPassword(email).subscribe({
        next: () => {
          this.isLoading.set(false);
          this.successMessage.set('Hemos enviado un código a tu correo. Revisa tu bandeja de entrada.');
          
          setTimeout(() => {
            this.router.navigate(['/reset-password'], { queryParams: { email: email } });
          }, 2500);
        },
        error: (err) => {
          this.isLoading.set(false);
          this.errorMessage.set(err.error?.mensaje || err.error?.message || 'Error al solicitar el restablecimiento. Intenta de nuevo.');
        }
      });
    }
  }
}
