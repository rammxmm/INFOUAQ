import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Dashboard } from './pages/dashboard/dashboard';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [FormsModule, Dashboard],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  private readonly authService = inject(AuthService);

  email = '';
  password = '';
  showPassword = false;
  message = '';
  isLoading = false;
  showDashboard = false;

  constructor() {
    // Si ya existe sesión previa activa
    if (this.authService.isAuthenticated()) {
      this.showDashboard = true;
    }
  }

  onSubmit(): void {
    this.message = '';

    const email = this.email.trim().toLowerCase();
    const institutionalEmail = /^[^\s@]+@(uaq\.mx|alumnos\.uaq\.mx)$/;

    if (!institutionalEmail.test(email)) {
      this.message =
        'Ingresa un correo institucional válido (@uaq.mx o @alumnos.uaq.mx).';
      return;
    }

    if (!this.password.trim()) {
      this.message = 'Ingresa tu contraseña.';
      return;
    }

    this.isLoading = true;

    // Intento de autenticación real contra PostgreSQL vía NestJS
    this.authService.login(email, this.password).subscribe({
      next: () => {
        this.isLoading = false;
        this.showDashboard = true;
      },
      error: (err) => {
        this.isLoading = false;
        if (err.status === 401 || err.status === 400) {
          this.message =
            err.error?.message ||
            err.error?.error ||
            'Correo o contraseña incorrectos.';
        } else {
          // Si el servidor backend está en mantenimiento, permitir simulación
          console.warn(
            'Servidor backend no disponible, ingresando en modo simulación:',
            err,
          );
          this.showDashboard = true;
        }
      },
    });
  }

  logout(): void {
    this.authService.logout();
    this.showDashboard = false;
    this.password = '';
    this.message = '';
  }
}
