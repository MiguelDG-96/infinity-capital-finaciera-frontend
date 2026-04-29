import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { ThemeService } from '../../../core/services/theme.service';
import { AuthService } from '../../../core/services/auth.service';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';

@Component({
  selector: 'app-verify',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, ReactiveFormsModule, RouterLink],
  templateUrl: './verify.component.html',
  styleUrl: './verify.component.css',
})
export class VerifyComponent implements OnInit {
  public themeService = inject(ThemeService);
  private authService = inject(AuthService);
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  email = signal<string>('');
  status = signal<'idle' | 'loading' | 'success' | 'error'>('idle');
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);

  verifyForm = this.fb.group({
    codigo: ['', [Validators.required, Validators.pattern(/^[0-9]{6}$/)]],
  });

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      const emailParam = params['email'];
      if (emailParam) {
        this.email.set(emailParam);
      } else {
        // If no email, redirect to login
        this.router.navigate(['/login']);
      }
    });

    // Check if there's a success message from registration
    const state = window.history.state;
    if (state && state['message']) {
        this.successMessage.set(state['message']);
    }
  }

  onSubmit() {
    if (this.verifyForm.valid && this.email()) {
      this.status.set('loading');
      this.errorMessage.set(null);
      this.successMessage.set(null);

      const codigo = this.verifyForm.value.codigo!;

      this.authService.verify(this.email(), codigo).subscribe({
        next: () => {
          this.status.set('success');
          // Wait for animation before redirect
          setTimeout(() => {
            this.router.navigate(['/dashboard']);
          }, 1500);
        },
        error: (err) => {
          this.status.set('error');
          const msg = err.error?.mensaje || err.error?.message || 'Código incorrecto o expirado.';
          this.errorMessage.set(msg);
          // Return to idle after a moment or stay in error if needed
          setTimeout(() => { if(this.status() === 'error') this.status.set('idle'); }, 3000);
        }
      });
    }
  }

  resendCode() {
    // Optional: Implement resend logic if backend supports it
    // For now, just show a message or do nothing if not available
    this.successMessage.set('Si no recibiste el código, por favor revisa tu carpeta de spam.');
  }
}
