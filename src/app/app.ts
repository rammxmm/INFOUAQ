
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Dashboard } from './pages/dashboard/dashboard';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [FormsModule, Dashboard],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  email = '';
  password = '';
  showPassword = false;
  message = '';
  showDashboard = false;

  onSubmit(): void {
    this.message = '';

    const email = this.email.trim().toLowerCase();
    const institutionalEmail =
      /^[^\s@]+@(uaq\.mx|alumnos\.uaq\.mx)$/;

    if (!institutionalEmail.test(email)) {
      this.message = 'Ingresa un correo institucional válido.';
      return;
    }

    if (!this.password.trim()) {
      this.message = 'Ingresa tu contraseña.';
      return;
    }

    this.showDashboard = true;
  }

  logout(): void {
    this.showDashboard = false;
    this.password = '';
    this.message = '';
  }
}
